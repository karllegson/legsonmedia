"use client";

import {
  AlertCircle,
  CheckCircle2,
  Pencil,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  deleteTimeEntryAction,
  requestTimeEditAction,
  updateTimeEntryAction,
} from "@/app/work/(shell)/actions";
import { formatDuration, isOwnerRole } from "@/lib/work/roles";
import type { TimeEntryWithMeta } from "@/lib/work/time.server";
import type { TimeEditRequest } from "@/lib/work/timeEditRequests.server";
import type { WorkRole } from "@/lib/work/types";

type TimeEntriesPanelProps = {
  entries: TimeEntryWithMeta[];
  role: WorkRole;
  myRequests: TimeEditRequest[];
  /** When true, show the person column (owner reviewing everyone). */
  showPerson?: boolean;
};

type Draft = {
  entryId: string;
  hours: string;
  minutes: string;
  notes: string;
  reason: string;
  mode: "edit" | "request";
};

function splitMinutes(total: number) {
  return {
    hours: String(Math.floor(total / 60)),
    minutes: String(total % 60),
  };
}

export function TimeEntriesPanel({
  entries,
  role,
  myRequests,
  showPerson = false,
}: TimeEntriesPanelProps) {
  const router = useRouter();
  const isOwner = isOwnerRole(role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const pendingByEntry = useMemo(() => {
    const map = new Map<string, TimeEditRequest>();
    for (const request of myRequests) {
      if (request.status === "pending") {
        map.set(request.entryId, request);
      }
    }
    return map;
  }, [myRequests]);

  function openEdit(entry: TimeEntryWithMeta) {
    const parts = splitMinutes(entry.durationMinutes ?? 0);
    setError(null);
    setSuccess(null);
    setDraft({
      entryId: entry.id,
      hours: parts.hours,
      minutes: parts.minutes,
      notes: entry.notes ?? "",
      reason: "",
      mode: isOwner ? "edit" : "request",
    });
  }

  function handleSubmit() {
    if (!draft) {
      return;
    }
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.set("entryId", draft.entryId);
    formData.set("hours", draft.hours);
    formData.set("minutes", draft.minutes);
    formData.set("notes", draft.notes);
    if (draft.mode === "request") {
      formData.set("reason", draft.reason);
    }

    startTransition(async () => {
      const result =
        draft.mode === "edit"
          ? await updateTimeEntryAction(formData)
          : await requestTimeEditAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      setSuccess(
        draft.mode === "edit"
          ? "Time entry updated."
          : "Edit request sent for approval.",
      );
      setDraft(null);
      router.refresh();
    });
  }

  function handleDelete(entryId: string) {
    if (!isOwner) {
      return;
    }
    if (!window.confirm("Delete this time entry permanently?")) {
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("entryId", entryId);
    startTransition(async () => {
      const result = await deleteTimeEntryAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not delete");
        return;
      }
      setSuccess("Time entry deleted.");
      setDraft(null);
      router.refresh();
    });
  }

  return (
    <section className="wk-card" id="my-time">
      <div className="wk-card-head">
        <div>
          <h2 className="wk-card-title">
            {showPerson ? "All time logs" : "Recent time logs"}
          </h2>
          <p className="wk-card-sub">
            {isOwner
              ? "Edit or delete any closed entry. Teammates can only request changes."
              : "Need a fix? Request an edit — only the owner can approve it."}
          </p>
        </div>
      </div>

      <div className="wk-card-pad wk-stack">
        {error ? (
          <div className="wk-alert wk-alert-error">
            <AlertCircle size={16} strokeWidth={2} aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}
        {success ? (
          <div className="wk-alert wk-alert-success">
            <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
            <span>{success}</span>
          </div>
        ) : null}

        {draft ? (
          <div className="wk-inline-form">
            <div className="wk-row-between">
              <p className="wk-section-title" style={{ margin: 0 }}>
                {draft.mode === "edit" ? "Edit time entry" : "Request time edit"}
              </p>
              <button
                type="button"
                className="wk-btn wk-btn-ghost"
                onClick={() => setDraft(null)}
                disabled={pending}
              >
                <X size={15} strokeWidth={2} aria-hidden />
                Cancel
              </button>
            </div>
            <div className="wk-form-grid">
              <div className="wk-field">
                <label className="wk-label" htmlFor="edit-hours">
                  Hours
                </label>
                <input
                  className="wk-input"
                  id="edit-hours"
                  type="number"
                  min="0"
                  value={draft.hours}
                  onChange={(event) =>
                    setDraft({ ...draft, hours: event.target.value })
                  }
                  disabled={pending}
                />
              </div>
              <div className="wk-field">
                <label className="wk-label" htmlFor="edit-minutes">
                  Minutes
                </label>
                <input
                  className="wk-input"
                  id="edit-minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={draft.minutes}
                  onChange={(event) =>
                    setDraft({ ...draft, minutes: event.target.value })
                  }
                  disabled={pending}
                />
              </div>
              <div className="wk-field wk-form-full">
                <label className="wk-label" htmlFor="edit-notes">
                  Notes
                </label>
                <input
                  className="wk-input"
                  id="edit-notes"
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft({ ...draft, notes: event.target.value })
                  }
                  disabled={pending}
                />
              </div>
              {draft.mode === "request" ? (
                <div className="wk-field wk-form-full">
                  <label className="wk-label" htmlFor="edit-reason">
                    Why does this need changing?
                  </label>
                  <textarea
                    className="wk-textarea"
                    id="edit-reason"
                    rows={2}
                    value={draft.reason}
                    onChange={(event) =>
                      setDraft({ ...draft, reason: event.target.value })
                    }
                    placeholder="e.g. Clocked out late — actual work was 4h 45m"
                    disabled={pending}
                    required
                  />
                </div>
              ) : null}
            </div>
            <div className="wk-form-actions">
              <button
                type="button"
                className="wk-btn wk-btn-primary"
                disabled={pending}
                onClick={handleSubmit}
              >
                {draft.mode === "edit" ? (
                  <>
                    <Pencil size={15} strokeWidth={2} aria-hidden />
                    {pending ? "Saving…" : "Save changes"}
                  </>
                ) : (
                  <>
                    <Send size={15} strokeWidth={2} aria-hidden />
                    {pending ? "Sending…" : "Send request"}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {entries.length === 0 ? (
          <div className="wk-empty">
            <p className="wk-empty-title">No closed entries yet</p>
            <p className="wk-empty-text">
              Clock out or log time and it will show up here.
            </p>
          </div>
        ) : (
          <div className="wk-table-scroll">
            <table className="wk-table">
              <thead>
                <tr>
                  <th>When</th>
                  {showPerson ? <th>Person</th> : null}
                  <th>Client</th>
                  <th>Duration</th>
                  <th>What for</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const pendingRequest = pendingByEntry.get(entry.id);
                  return (
                    <tr key={entry.id}>
                      <td className="wk-cell-muted">
                        {new Date(entry.clockIn).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      {showPerson ? (
                        <td>{entry.userDisplayName || "Teammate"}</td>
                      ) : null}
                      <td>{entry.clientName}</td>
                      <td>{formatDuration(entry.durationMinutes ?? 0)}</td>
                      <td>{entry.notes || "—"}</td>
                      <td>
                        {pendingRequest ? (
                          <span className="wk-badge">Pending edit</span>
                        ) : (
                          <span className="wk-badge wk-badge-done">Logged</span>
                        )}
                      </td>
                      <td>
                        <div className="wk-row" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="wk-btn wk-btn-ghost"
                            disabled={pending || Boolean(pendingRequest && !isOwner)}
                            onClick={() => openEdit(entry)}
                          >
                            {isOwner ? (
                              <>
                                <Pencil size={14} strokeWidth={2} aria-hidden />
                                Edit
                              </>
                            ) : (
                              <>
                                <Send size={14} strokeWidth={2} aria-hidden />
                                Request edit
                              </>
                            )}
                          </button>
                          {isOwner ? (
                            <button
                              type="button"
                              className="wk-btn wk-btn-ghost"
                              disabled={pending}
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 size={14} strokeWidth={2} aria-hidden />
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
