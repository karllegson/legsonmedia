"use client";

import {
  AlertCircle,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import {
  createGroupChatAction,
  deleteGroupChatAction,
  markThreadReadAction,
  sendMessageAction,
} from "@/app/work/(shell)/actions";
import type { WorkChatThread } from "@/lib/work/messages.server";

type TeammateOption = {
  id: string;
  displayName: string | null;
  email: string;
};

type MessagesViewProps = {
  currentUserId: string;
  currentUserName: string;
  initialThreads: WorkChatThread[];
  teammates: TeammateOption[];
  initialThreadId?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  return `${Math.round(hours / 24)}d`;
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function MessagesView({
  currentUserId,
  currentUserName,
  initialThreads,
  teammates,
  initialThreadId,
}: MessagesViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState(
    () =>
      (initialThreadId &&
        initialThreads.some((thread) => thread.id === initialThreadId) &&
        initialThreadId) ||
      initialThreads[0]?.id ||
      "",
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    setThreads(initialThreads);
    if (
      initialThreads.length > 0 &&
      !initialThreads.some((thread) => thread.id === activeId)
    ) {
      setActiveId(initialThreads[0].id);
    }
    if (initialThreads.length === 0) {
      setActiveId("");
    }
  }, [initialThreads, activeId]);

  const active = useMemo(
    () => threads.find((thread) => thread.id === activeId) ?? null,
    [activeId, threads],
  );

  const unreadCount = threads.filter((thread) => thread.unread).length;
  const otherTeammates = teammates.filter(
    (member) => member.id !== currentUserId,
  );

  function selectThread(id: string) {
    setActiveId(id);
    setError(null);
    setThreads((current) =>
      current.map((thread) =>
        thread.id === id ? { ...thread, unread: false } : thread,
      ),
    );
    startTransition(async () => {
      await markThreadReadAction(id);
    });
  }

  function toggleMember(id: string) {
    setSelectedMembers((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function handleCreateGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("title", groupTitle);
    selectedMembers.forEach((id) => fd.append("memberIds", id));

    startTransition(async () => {
      const result = await createGroupChatAction(fd);
      if (!result.ok) {
        setError(result.error ?? "Could not create group chat");
        return;
      }
      setShowCreate(false);
      setGroupTitle("");
      setSelectedMembers([]);
      if (result.threadId) {
        setActiveId(result.threadId);
      }
      router.refresh();
    });
  }

  function sendMessage() {
    const body = draft.trim();
    if (!body || !active) {
      return;
    }

    setError(null);
    const fd = new FormData();
    fd.set("threadId", active.id);
    fd.set("body", body);

    startTransition(async () => {
      const result = await sendMessageAction(fd);
      if (!result.ok) {
        setError(result.error ?? "Could not send message");
        return;
      }
      setDraft("");
      router.refresh();
    });
  }

  function handleDeleteGroup() {
    if (!active) {
      return;
    }

    const confirmed = window.confirm(
      `Delete “${active.title}” for everyone? This can’t be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    const threadId = active.id;
    startTransition(async () => {
      const result = await deleteGroupChatAction(threadId);
      if (!result.ok) {
        setError(result.error ?? "Could not delete chat");
        return;
      }
      setActiveId("");
      setDraft("");
      router.refresh();
    });
  }

  return (
    <div className="wk-stack">
      {error ? (
        <div className="wk-alert wk-alert-error">
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="wk-msg">
        <aside className="wk-msg-sidebar">
          <div className="wk-msg-sidebar-head">
            <div>
              <h2 className="wk-card-title">
                Messages
                {unreadCount > 0 ? (
                  <span className="wk-card-title-count">{unreadCount}</span>
                ) : null}
              </h2>
              <p className="wk-card-sub">Group chats for the Legson team</p>
            </div>
            <button
              type="button"
              className="wk-btn wk-btn-primary"
              onClick={() => {
                setShowCreate(true);
                setError(null);
              }}
            >
              <Plus size={15} strokeWidth={2} aria-hidden />
              New group
            </button>
          </div>

          {threads.length === 0 ? (
            <div className="wk-empty" style={{ padding: 24 }}>
              <span className="wk-empty-icon">
                <MessageSquare size={22} strokeWidth={1.8} aria-hidden />
              </span>
              <p className="wk-empty-title">No chats yet</p>
              <p className="wk-empty-text">
                Start a group chat with teammates.
              </p>
            </div>
          ) : (
            <ul className="wk-msg-thread-list">
              {threads.map((thread) => {
                const selected = thread.id === activeId;
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      className={`wk-msg-thread${selected ? " is-active" : ""}${
                        thread.unread ? " is-unread" : ""
                      }`}
                      onClick={() => selectThread(thread.id)}
                    >
                      <span className="wk-person-avatar" aria-hidden>
                        {initials(thread.title)}
                      </span>
                      <span className="wk-msg-thread-body">
                        <span className="wk-msg-thread-top">
                          <span className="wk-msg-thread-title">
                            {thread.title}
                          </span>
                          <span className="wk-msg-thread-time">
                            {formatRelativeTime(thread.updatedAt)}
                          </span>
                        </span>
                        <span className="wk-msg-thread-preview">
                          {thread.preview}
                        </span>
                      </span>
                      {thread.unread ? (
                        <span className="wk-notif-unread" aria-label="Unread" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="wk-msg-main">
          {showCreate ? (
            <form className="wk-msg-create" onSubmit={handleCreateGroup}>
              <div className="wk-msg-main-head">
                <div>
                  <h3 className="wk-msg-conversation-title">New group chat</h3>
                  <p className="wk-msg-conversation-meta">
                    <Users size={13} strokeWidth={2} aria-hidden />
                    Pick a name and teammates
                  </p>
                </div>
                <button
                  type="button"
                  className="wk-btn wk-btn-ghost"
                  onClick={() => setShowCreate(false)}
                  disabled={pending}
                >
                  <X size={15} strokeWidth={2} aria-hidden />
                  Cancel
                </button>
              </div>

              <div className="wk-card-pad" style={{ display: "grid", gap: 16 }}>
                <div className="wk-field">
                  <label className="wk-label" htmlFor="group-title">
                    Group name
                  </label>
                  <input
                    className="wk-input"
                    id="group-title"
                    value={groupTitle}
                    onChange={(event) => setGroupTitle(event.target.value)}
                    placeholder="e.g. Apex Dental crew"
                    required
                    disabled={pending}
                  />
                </div>

                <div className="wk-field">
                  <span className="wk-label">Teammates</span>
                  {otherTeammates.length === 0 ? (
                    <p className="wk-muted">
                      No other active teammates yet. Add accounts from Team
                      first.
                    </p>
                  ) : (
                    <ul className="wk-msg-member-picker">
                      {otherTeammates.map((member) => {
                        const label =
                          member.displayName ||
                          member.email ||
                          "Teammate";
                        const checked = selectedMembers.includes(member.id);
                        return (
                          <li key={member.id}>
                            <label className="wk-msg-member-option">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleMember(member.id)}
                                disabled={pending}
                              />
                              <span className="wk-person-avatar" aria-hidden>
                                {initials(label)}
                              </span>
                              <span>
                                <span className="wk-person-name">{label}</span>
                                {member.email ? (
                                  <span className="wk-person-sub">
                                    {member.email}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="wk-form-actions">
                  <button
                    type="submit"
                    className="wk-btn wk-btn-primary"
                    disabled={
                      pending ||
                      !groupTitle.trim() ||
                      selectedMembers.length === 0
                    }
                  >
                    {pending ? "Creating…" : "Create group"}
                  </button>
                </div>
              </div>
            </form>
          ) : active ? (
            <>
              <div className="wk-msg-main-head">
                <div>
                  <h3 className="wk-msg-conversation-title">{active.title}</h3>
                  <p className="wk-msg-conversation-meta">
                    <Users size={13} strokeWidth={2} aria-hidden />
                    {active.participants.join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  className="wk-btn wk-btn-ghost"
                  onClick={handleDeleteGroup}
                  disabled={pending}
                  title="Delete group chat"
                >
                  <Trash2 size={15} strokeWidth={2} aria-hidden />
                  Delete
                </button>
              </div>

              <div className="wk-msg-feed">
                {active.messages.length === 0 ? (
                  <div className="wk-empty">
                    <span className="wk-empty-icon">
                      <MessageSquare size={22} strokeWidth={1.8} aria-hidden />
                    </span>
                    <p className="wk-empty-title">No messages yet</p>
                    <p className="wk-empty-text">
                      Say hi — you’re the first one here.
                    </p>
                  </div>
                ) : (
                  active.messages.map((message) => (
                    <article
                      key={message.id}
                      className={`wk-msg-bubble${
                        message.mine ? " is-mine" : ""
                      }`}
                    >
                      <div className="wk-msg-bubble-meta">
                        <span className="wk-msg-bubble-author">
                          {message.mine ? currentUserName : message.author}
                        </span>
                        <span className="wk-msg-bubble-time">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                      <p className="wk-msg-bubble-text">{message.body}</p>
                    </article>
                  ))
                )}
              </div>

              <form
                className="wk-msg-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendMessage();
                }}
              >
                <label className="wk-sr-only" htmlFor="wk-msg-draft">
                  Write a message
                </label>
                <textarea
                  id="wk-msg-draft"
                  className="wk-textarea wk-msg-draft"
                  rows={2}
                  placeholder="Write a message…"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={pending}
                />
                <button
                  type="submit"
                  className="wk-btn wk-btn-primary"
                  disabled={pending || !draft.trim()}
                >
                  <Send size={15} strokeWidth={2} aria-hidden />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="wk-empty">
              <span className="wk-empty-icon">
                <MessageSquare size={22} strokeWidth={1.8} aria-hidden />
              </span>
              <p className="wk-empty-title">No conversation selected</p>
              <p className="wk-empty-text">
                Create a group chat to start messaging the team.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
