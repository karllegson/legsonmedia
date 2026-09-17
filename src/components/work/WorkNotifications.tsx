"use client";

import {
  Bell,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  listNotificationsAction,
  markNotificationsReadAction,
} from "@/app/work/(shell)/actions";
import type { WorkNotification } from "@/lib/work/notifications";

function NotifIcon({ kind }: { kind: WorkNotification["kind"] }) {
  if (kind === "message") {
    return <MessageSquare size={14} strokeWidth={2} aria-hidden />;
  }
  if (kind === "time") {
    return <Clock3 size={14} strokeWidth={2} aria-hidden />;
  }
  if (kind === "team") {
    return <Users size={14} strokeWidth={2} aria-hidden />;
  }
  return <CheckCircle2 size={14} strokeWidth={2} aria-hidden />;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function WorkNotifications() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WorkNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const unreadCount = items.filter((item) => !item.read).length;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listNotificationsAction();
      if (result.ok) {
        setItems(result.items);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function markAllRead() {
    const unreadIds = items.filter((item) => !item.read).map((item) => item.id);
    if (unreadIds.length === 0) {
      return;
    }
    setItems((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
    await markNotificationsReadAction(unreadIds);
  }

  async function openItem(item: WorkNotification) {
    if (!item.read) {
      setItems((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, read: true } : row,
        ),
      );
      await markNotificationsReadAction([item.id]);
    }
    setOpen(false);
  }

  return (
    <div className="wk-notif" ref={rootRef}>
      <button
        type="button"
        className="wk-icon-btn wk-notif-trigger"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((value) => !value);
          if (!open) {
            void refresh();
          }
        }}
      >
        <Bell size={15} strokeWidth={1.9} aria-hidden />
        {unreadCount > 0 ? (
          <span className="wk-notif-dot" aria-hidden>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="wk-notif-panel"
          id={panelId}
          role="dialog"
          aria-label="Notifications"
        >
          <div className="wk-notif-head">
            <div>
              <p className="wk-notif-title">Notifications</p>
              <p className="wk-notif-sub">
                {loading
                  ? "Refreshing…"
                  : unreadCount > 0
                    ? `${unreadCount} unread`
                    : "You’re all caught up"}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="wk-text-btn"
                onClick={() => void markAllRead()}
              >
                Mark all read
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <div className="wk-notif-empty">
              <p className="wk-notif-empty-title">No notifications yet</p>
              <p className="wk-notif-empty-text">
                New messages and time edit requests show up here.
              </p>
            </div>
          ) : (
            <ul className="wk-notif-list">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href || "/work"}
                    className={`wk-notif-item${item.read ? "" : " is-unread"}`}
                    onClick={() => void openItem(item)}
                  >
                    <span className="wk-notif-icon">
                      <NotifIcon kind={item.kind} />
                    </span>
                    <span className="wk-notif-body">
                      <span className="wk-notif-item-title">{item.title}</span>
                      <span className="wk-notif-item-copy">{item.body}</span>
                      <span className="wk-notif-item-time">
                        {formatRelative(item.createdAt)}
                      </span>
                    </span>
                    {!item.read ? (
                      <span className="wk-notif-unread" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
