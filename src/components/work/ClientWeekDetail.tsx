"use client";

import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  ListChecks,
  Pencil,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteTimeEntryAction,
  updateTimeEntryAction,
} from "@/app/work/(shell)/actions";
import {
  addWeeks,
  formatDuration,
  formatHours,
  formatWorkWeekRange,
  getMondayOfWeek,
  isOwnerRole,
} from "@/lib/work/roles";
import type { ClientWeekBreakdown } from "@/lib/work/clientDetail.server";
import type { WorkRole } from "@/lib/work/types";

type ClientWeekDetailProps = {
  breakdown: ClientWeekBreakdown;
  weekStart: string;
  role: WorkRole;
};

function buildWeekOptions() {
  const thisWeek = getMondayOfWeek();
  return Array.from({ length: 12 }, (_, index) => {
    const start = addWeeks(thisWeek, -index);
    const label =
      index === 0
        ? `This week · ${formatWorkWeekRange(start)}`
        : index === 1
          ? `Last week · ${formatWorkWeekRange(start)}`
          : formatWorkWeekRange(start);
    return { start, label };
  });
}

export function ClientWeekDetail({
  breakdown,
  weekStart,
  role,
}: ClientWeekDetailProps) {
  const router = useRouter();
  const isOwner = isOwnerRole(role);
  const weekOptions = buildWeekOptions();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    entryId: string;
    hours: string;
    minutes: string;
    notes: string;
  } | null>(null);

  function openEdit(entry: (typeof breakdown.entries)[number]) {
    setError(null);
    setDraft({
      entryId: entry.id,
      hours: String(Math.floor(entry.durationMinutes / 60)),
      minutes: String(entry.durationMinutes % 60),
      notes: entry.notes ?? "",
    });
  }

  function saveEdit() {
    if (!draft) {
      return;
    }
    const formData = new FormData();
    formData.set("entryId", draft.entryId);
    formData.set("hours", draft.hours);
    formData.set("minutes", draft.minutes);
    formData.set("notes", draft.notes);
    startTransition(async () => {
      const result = await updateTimeEntryAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not update");
        return;
      }
      setDraft(null);
      router.refresh();
    });
  }

  function removeEntry(entryId: string) {
    if (!window.confirm("Delete this time entry permanently?")) {
      return;
    }
    const formData = new FormData();
    formData.set("entryId", entryId);
    startTransition(async () => {
      const result = await deleteTimeEntryAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not delete");
        return;
      }
      setDraft(null);
      router.refresh();
    });
  }

  return (
    <div className="wk-stack">
      <div className="wk-row-between" style={{ alignItems: "flex-start" }}>
        <div>
          <Link href="/work/clients" className="wk-link">
            <ArrowLeft size={14} strokeWidth={2.2} aria-hidden />
            All clients
          </Link>
          <h2 className="wk-hero-empty-title" style={{ marginTop: 10 }}>
            {breakdown.clientName}
          </h2>
          <p className="wk-muted">
            Hours logged for {formatWorkWeekRange(weekStart)}
          </p>
        </div>

        <div className="wk-field" style={{ minWidth: 260 }}>
          <label className="wk-label" htmlFor="client-week">
            Work week
          </label>
          <select
            className="wk-select"
            id="client-week"
            value={weekStart}
            onChange={(event) => {
              router.push(
                `/work/clients/${breakdown.clientSlug}?week=${event.target.value}`,
              );
            }}
          >
            {weekOptions.map((week) => (
              <option key={week.start} value={week.start}>
                {week.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="wk-stats">
        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Logged</span>
            <span className="wk-stat-icon is-accent">
              <Clock3 size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {breakdown.loggedHours.toFixed(1)}
            <small>h</small>
          </p>
          <p className="wk-stat-foot">{formatDuration(breakdown.loggedMinutes)}</p>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Retainer</span>
            <span className="wk-stat-icon is-blue">
              <ListChecks size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {breakdown.retainerHours.toFixed(1)}
            <small>h</small>
          </p>
          <p className="wk-stat-foot">Weekly package</p>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Remaining</span>
            <span className="wk-stat-icon is-green">
              <UserRound size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {breakdown.remainingHours.toFixed(1)}
            <small>h</small>
          </p>
          <p className="wk-stat-foot">
            {breakdown.retainerHours > 0
              ? `${Math.min(100, Math.round((breakdown.loggedHours / breakdown.retainerHours) * 100))}% used`
              : "No retainer set"}
          </p>
        </article>
      </section>

      <section className="wk-card">
        <div className="wk-card-head">
          <div>
            <h2 className="wk-card-title">By person</h2>
            <p className="wk-card-sub">Who logged time this week</p>
          </div>
        </div>

        {breakdown.byPerson.length === 0 ? (
          <div className="wk-empty">
            <p className="wk-empty-title">No hours logged</p>
            <p className="wk-empty-text">
              Nothing recorded for this client in {formatWorkWeekRange(weekStart)}.
            </p>
          </div>
        ) : (
          <div className="wk-table-scroll">
            <table className="wk-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Hours</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.byPerson.map((person) => {
                  const share =
                    breakdown.loggedMinutes > 0
                      ? Math.round(
                          (person.minutes / breakdown.loggedMinutes) * 100,
                        )
                      : 0;
                  return (
                    <tr key={person.userId}>
                      <td>{person.displayName || "Teammate"}</td>
                      <td>{formatHours(person.hours)}</td>
                      <td>{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="wk-card">
        <div className="wk-card-head">
          <div>
            <h2 className="wk-card-title">
              Detailed entries
              {breakdown.entries.length > 0 ? (
                <span className="wk-card-title-count">
                  {breakdown.entries.length}
                </span>
              ) : null}
            </h2>
            <p className="wk-card-sub">Every logged block for this week</p>
          </div>
        </div>

        {error ? (
          <div className="wk-alert wk-alert-error" style={{ margin: "0 18px 12px" }}>
            <AlertCircle size={16} strokeWidth={2} aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        {draft && isOwner ? (
          <div className="wk-card-pad" style={{ paddingTop: 0 }}>
            <div className="wk-inline-form">
              <div className="wk-row-between">
                <p className="wk-section-title" style={{ margin: 0 }}>
                  Edit entry
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
                  <label className="wk-label" htmlFor="client-edit-hours">
                    Hours
                  </label>
                  <input
                    className="wk-input"
                    id="client-edit-hours"
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
                  <label className="wk-label" htmlFor="client-edit-minutes">
                    Minutes
                  </label>
                  <input
                    className="wk-input"
                    id="client-edit-minutes"
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
                  <label className="wk-label" htmlFor="client-edit-notes">
                    Notes
                  </label>
                  <input
                    className="wk-input"
                    id="client-edit-notes"
                    value={draft.notes}
                    onChange={(event) =>
                      setDraft({ ...draft, notes: event.target.value })
                    }
                    disabled={pending}
                  />
                </div>
              </div>
              <div className="wk-form-actions">
                <button
                  type="button"
                  className="wk-btn wk-btn-primary"
                  disabled={pending}
                  onClick={saveEdit}
                >
                  <Pencil size={15} strokeWidth={2} aria-hidden />
                  {pending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {breakdown.entries.length === 0 ? (
          <div className="wk-empty">
            <p className="wk-empty-title">No entries</p>
            <p className="wk-empty-text">
              Clock sessions and manual logs will show up here.
            </p>
          </div>
        ) : (
          <div className="wk-table-scroll">
            <table className="wk-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Person</th>
                  <th>Duration</th>
                  <th>Task</th>
                  <th>What for</th>
                  {isOwner ? <th /> : null}
                </tr>
              </thead>
              <tbody>
                {breakdown.entries.map((entry) => (
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
                    <td>{entry.displayName || "Teammate"}</td>
                    <td>{formatDuration(entry.durationMinutes)}</td>
                    <td className="wk-cell-muted">{entry.taskTitle || "—"}</td>
                    <td>{entry.notes || "—"}</td>
                    {isOwner ? (
                      <td>
                        <div
                          className="wk-row"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            type="button"
                            className="wk-btn wk-btn-ghost"
                            disabled={pending}
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil size={14} strokeWidth={2} aria-hidden />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="wk-btn wk-btn-ghost"
                            disabled={pending}
                            onClick={() => removeEntry(entry.id)}
                          >
                            <Trash2 size={14} strokeWidth={2} aria-hidden />
                            Delete
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
