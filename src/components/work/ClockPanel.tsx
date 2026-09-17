"use client";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  Clock3,
  ListChecks,
  Pause,
  Play,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  clockInAction,
  clockOutAction,
  pauseClockAction,
  resumeClockAction,
} from "@/app/work/(shell)/actions";
import { LiveTimer } from "@/components/work/LiveTimer";
import { formatHours } from "@/lib/work/roles";
import type {
  Client,
  ServiceCategory,
  WorkTask,
} from "@/lib/work/types";
import type { ActiveClockSession } from "@/lib/work/time.server";

type ClockPanelProps = {
  openEntry: ActiveClockSession | null;
  clients: Client[];
  tasks: WorkTask[];
  serviceCategories: ServiceCategory[];
  loggedHoursThisWeek: number;
  allocatedHoursThisWeek: number;
};

export function ClockPanel({
  openEntry,
  clients,
  tasks,
  serviceCategories,
  loggedHoursThisWeek,
  allocatedHoursThisWeek,
}: ClockPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [clientId, setClientId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [serviceCategoryId, setServiceCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const clientTasks = tasks.filter((task) => task.clientId === clientId);

  function handleClockIn() {
    setError(null);
    const fd = new FormData();
    fd.set("clientId", clientId);
    if (taskId) fd.set("taskId", taskId);
    if (serviceCategoryId) fd.set("serviceCategoryId", serviceCategoryId);

    startTransition(async () => {
      const result = await clockInAction(fd);
      if (!result.ok) {
        setError(result.error ?? "Clock in failed");
        return;
      }
      router.refresh();
    });
  }

  function handleClockOut() {
    setError(null);
    const fd = new FormData();
    fd.set("notes", notes);

    startTransition(async () => {
      const result = await clockOutAction(fd);
      if (!result.ok) {
        setError(result.error ?? "Clock out failed");
        return;
      }
      setNotes("");
      router.refresh();
    });
  }

  function handlePauseToggle() {
    setError(null);
    startTransition(async () => {
      const result = openEntry?.isPaused
        ? await resumeClockAction()
        : await pauseClockAction();
      if (!result.ok) {
        setError(result.error ?? "Could not update pause");
        return;
      }
      router.refresh();
    });
  }

  if (openEntry) {
    return (
      <div className="wk-stack">
        <section className="wk-hero">
          <div className="wk-hero-row">
            <div>
              <span className={`wk-live${openEntry.isPaused ? " is-paused" : ""}`}>
                <span className="wk-live-dot" aria-hidden />
                {openEntry.isPaused ? "Paused" : "Session running"}
              </span>
              <h2 className="wk-hero-client">{openEntry.clientName}</h2>
              <p className="wk-hero-task">
                {openEntry.taskTitle ? (
                  <>
                    <ListChecks size={14} strokeWidth={2} aria-hidden />
                    {openEntry.taskTitle}
                  </>
                ) : (
                  <>
                    <Clock3 size={14} strokeWidth={2} aria-hidden />
                    General work &mdash; no task selected
                  </>
                )}
              </p>
            </div>

            <div className="wk-hero-timer">
              <LiveTimer
                startedAt={openEntry.clockIn}
                pausedMs={openEntry.pausedMs}
                isPaused={openEntry.isPaused}
                className="wk-hero-timer-value"
              />
              <p className="wk-hero-timer-label">
                {openEntry.isPaused
                  ? "Timer paused"
                  : `Started ${new Date(openEntry.clockIn).toLocaleTimeString(
                      "en-US",
                      { hour: "numeric", minute: "2-digit" },
                    )}`}
              </p>
            </div>
          </div>
        </section>

        <section className="wk-card">
          <div className="wk-card-head">
            <div>
              <h2 className="wk-card-title">Wrap up this session</h2>
              <p className="wk-card-sub">
                Pause for breaks, or clock out when you&apos;re done.
              </p>
            </div>
          </div>

          <div className="wk-card-pad wk-stack">
            <div className="wk-field">
              <label className="wk-label" htmlFor="clock-out-notes">
                Session notes <span className="wk-label-hint">(optional)</span>
              </label>
              <textarea
                className="wk-textarea"
                id="clock-out-notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. Published 2 IG posts, scheduled 2 more for Thursday"
              />
            </div>

            {error ? (
              <div className="wk-alert wk-alert-error">
                <AlertCircle size={16} strokeWidth={2} aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="wk-form-actions">
              <button
                type="button"
                className="wk-btn wk-btn-ghost wk-btn-lg"
                disabled={pending}
                onClick={handlePauseToggle}
              >
                {openEntry.isPaused ? (
                  <>
                    <Play size={16} strokeWidth={2} aria-hidden />
                    {pending ? "Resuming…" : "Resume"}
                  </>
                ) : (
                  <>
                    <Pause size={16} strokeWidth={2} aria-hidden />
                    {pending ? "Pausing…" : "Pause"}
                  </>
                )}
              </button>
              <button
                type="button"
                className="wk-btn wk-btn-danger wk-btn-lg"
                disabled={pending}
                onClick={handleClockOut}
              >
                <Timer size={16} strokeWidth={2} aria-hidden />
                {pending ? "Clocking out…" : "Clock out"}
              </button>
              <Link href="/work/tasks" className="wk-btn wk-btn-ghost wk-btn-lg">
                Update tasks
                <ArrowRight size={15} strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="wk-split">
      <div className="wk-stack">
        <section className="wk-card wk-card-pad">
          <p className="wk-section-title">This week</p>
          <div className="wk-metrics">
            <span>
              <span className="wk-metric-label">Logged</span>
              <span className="wk-metric-value">
                {formatHours(loggedHoursThisWeek)}
              </span>
            </span>
            <span>
              <span className="wk-metric-label">Allocated</span>
              <span className="wk-metric-value">
                {formatHours(allocatedHoursThisWeek)}
              </span>
            </span>
          </div>
          <div className="wk-progress">
            <span
              className="wk-progress-fill"
              style={{
                width: `${
                  allocatedHoursThisWeek > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (loggedHoursThisWeek / allocatedHoursThisWeek) * 100,
                        ),
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </section>

        <section className="wk-card wk-card-pad">
          <p className="wk-section-title">How it works</p>
          <ul className="wk-task-list">
            <li className="wk-row" style={{ paddingBottom: 10 }}>
              <span className="wk-stat-icon is-accent">1</span>
              <span className="wk-muted">Pick the client you&apos;re working for</span>
            </li>
            <li className="wk-row" style={{ paddingBottom: 10 }}>
              <span className="wk-stat-icon is-accent">2</span>
              <span className="wk-muted">
                Choose a task so hours land in the right bucket
              </span>
            </li>
            <li className="wk-row">
              <span className="wk-stat-icon is-accent">3</span>
              <span className="wk-muted">
                Pause for breaks, then clock out when done
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section className="wk-card">
        <div className="wk-card-head">
          <div>
            <h2 className="wk-card-title">Start a session</h2>
            <p className="wk-card-sub">
              Your time is billed against the client&apos;s weekly retainer.
            </p>
          </div>
        </div>

        <div className="wk-card-pad wk-stack">
          <div>
            <p className="wk-section-title">Client</p>
            {clients.length === 0 ? (
              <p className="wk-muted">
                No active clients yet. Ask your operations manager to add one.
              </p>
            ) : (
              <div className="wk-tiles">
                {clients.map((client) => {
                  const selected = clientId === client.id;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      className={`wk-tile${selected ? " wk-tile-live" : ""}`}
                      style={{ textAlign: "left", cursor: "pointer" }}
                      onClick={() => {
                        setClientId(client.id);
                        setTaskId("");
                      }}
                    >
                      <span className="wk-tile-head">
                        <span className="wk-stat-icon is-accent">
                          <Building2 size={16} strokeWidth={2} aria-hidden />
                        </span>
                        {selected ? (
                          <span className="wk-badge wk-badge-accent">
                            <Check size={12} strokeWidth={2.6} aria-hidden />
                            Selected
                          </span>
                        ) : null}
                      </span>
                      <span className="wk-tile-title">{client.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="wk-form-grid">
            <div className="wk-field">
              <label className="wk-label" htmlFor="clock-task">
                Task <span className="wk-label-hint">(recommended)</span>
              </label>
              <select
                className="wk-select"
                id="clock-task"
                value={taskId}
                onChange={(event) => setTaskId(event.target.value)}
                disabled={!clientId}
              >
                <option value="">
                  {clientId ? "No specific task" : "Select a client first"}
                </option>
                {clientTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="wk-field">
              <label className="wk-label" htmlFor="clock-service">
                Service <span className="wk-label-hint">(optional)</span>
              </label>
              <select
                className="wk-select"
                id="clock-service"
                value={serviceCategoryId}
                onChange={(event) => setServiceCategoryId(event.target.value)}
              >
                <option value="">Not specified</option>
                {serviceCategories.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {clientId && clientTasks.length === 0 ? (
            <div className="wk-alert wk-alert-info">
              <AlertCircle size={16} strokeWidth={2} aria-hidden />
              <span>
                You have no open tasks for this client. You can still clock in as
                general work.
              </span>
            </div>
          ) : null}

          {error ? (
            <div className="wk-alert wk-alert-error">
              <AlertCircle size={16} strokeWidth={2} aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="wk-form-actions">
            <button
              type="button"
              className="wk-btn wk-btn-primary wk-btn-lg"
              disabled={pending || !clientId}
              onClick={handleClockIn}
            >
              <Timer size={16} strokeWidth={2} aria-hidden />
              {pending ? "Starting…" : "Clock in"}
            </button>
            <Link href="/work/tasks" className="wk-link">
              View my tasks
              <ArrowRight size={14} strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
