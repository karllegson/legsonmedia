import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  ListChecks,
  Target,
  Timer,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { LiveTimer } from "@/components/work/LiveTimer";
import { getWorkSession } from "@/lib/work/auth.server";
import { listActiveClients, listServiceCategories } from "@/lib/work/clients.server";
import { sumAllocatedHoursForUser } from "@/lib/work/planning.server";
import {
  formatHours,
  getMondayOfWeek,
  isManagerRole,
  minutesToHours,
} from "@/lib/work/roles";
import { listAllTasks, listTasksForUser } from "@/lib/work/tasks.server";
import { getActiveClockSession, sumLoggedMinutesForUser } from "@/lib/work/time.server";

const STATUS_LABEL = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
} as const;

export default async function WorkDashboardPage() {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  const weekStart = getMondayOfWeek();
  const isManager = isManagerRole(session.profile.role);
  const firstName = (session.profile.displayName ?? session.email ?? "there")
    .split(/[\s@]/)[0];

  const [
    openEntry,
    loggedMinutes,
    allocatedHours,
    myTasks,
    allTasks,
    clients,
    serviceCategories,
  ] = await Promise.all([
    getActiveClockSession(session.userId),
    sumLoggedMinutesForUser(session.userId, weekStart),
    sumAllocatedHoursForUser(session.userId, weekStart),
    listTasksForUser(session.userId),
    isManager ? listAllTasks() : Promise.resolve([]),
    listActiveClients(),
    listServiceCategories(),
  ]);

  const serviceName = new Map(serviceCategories.map((s) => [s.id, s.name]));
  const clientName = new Map(clients.map((c) => [c.id, c.name]));

  const openTasks = myTasks.filter((task) => task.status !== "done");
  const doneThisWeek = myTasks.filter((task) => task.status === "done").length;
  const loggedHours = minutesToHours(loggedMinutes);
  const utilizationPct =
    allocatedHours > 0
      ? Math.round((loggedHours / allocatedHours) * 100)
      : loggedHours > 0
        ? 100
        : 0;
  const progressPct = Math.min(100, utilizationPct);

  return (
    <div className="wk-stack">
      {openEntry ? (
        <section className="wk-hero">
          <div className="wk-hero-row">
            <div>
              <span className={`wk-live${openEntry.isPaused ? " is-paused" : ""}`}>
                <span className="wk-live-dot" aria-hidden />
                {openEntry.isPaused ? "Paused" : "On the clock"}
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
                {openEntry.isPaused ? "Timer paused" : "Elapsed"}
              </p>
            </div>
          </div>

          <div className="wk-hero-divider" />

          <Link href="/work/clock" className="wk-btn wk-btn-primary">
            <Timer size={15} strokeWidth={2} aria-hidden />
            Clock out
          </Link>
        </section>
      ) : (
        <section className="wk-hero">
          <div className="wk-hero-row">
            <div>
              <span className="wk-topbar-eyebrow" style={{ color: "#ffcc00" }}>
                Welcome back
              </span>
              <h2 className="wk-hero-empty-title">Ready to work, {firstName}?</h2>
              <p className="wk-hero-empty-sub">
                Pick the client you&apos;re working on and start the timer. Your
                hours roll straight into their weekly retainer.
              </p>
            </div>
          </div>

          <div className="wk-hero-divider" />

          <div className="wk-row">
            <Link href="/work/clock" className="wk-btn wk-btn-primary">
              <Timer size={15} strokeWidth={2} aria-hidden />
              Clock in
            </Link>
            <Link href="/work/tasks" className="wk-btn wk-btn-on-dark">
              View my tasks
              <ArrowRight size={15} strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </section>
      )}

      <section className="wk-stats">
        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Logged this week</span>
            <span className="wk-stat-icon is-accent">
              <Clock3 size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {loggedHours.toFixed(1)}
            <small>h</small>
          </p>
          <p className="wk-stat-foot">Week of {weekStart}</p>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Allocated</span>
            <span className="wk-stat-icon is-blue">
              <Target size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {allocatedHours.toFixed(1)}
            <small>h</small>
          </p>
          <p className="wk-stat-foot">
            {allocatedHours > 0
              ? `${formatHours(Math.max(0, allocatedHours - loggedHours))} remaining`
              : "No allocation yet"}
          </p>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Utilization</span>
            <span className="wk-stat-icon is-violet">
              <TrendingUp size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {utilizationPct}
            <small>%</small>
          </p>
          <div className="wk-progress">
            <span
              className={`wk-progress-fill${
                utilizationPct > 100 ? " is-over" : utilizationPct >= 80 ? " is-good" : ""
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Open tasks</span>
            <span className="wk-stat-icon is-green">
              <ListChecks size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">{openTasks.length}</p>
          <p className="wk-stat-foot">
            {doneThisWeek > 0 ? `${doneThisWeek} completed` : "Nothing completed yet"}
          </p>
        </article>

        {isManager ? (
          <>
            <article className="wk-stat">
              <div className="wk-stat-top">
                <span className="wk-stat-label">Active clients</span>
                <span className="wk-stat-icon">
                  <Briefcase size={16} strokeWidth={2} aria-hidden />
                </span>
              </div>
              <p className="wk-stat-value">{clients.length}</p>
              <p className="wk-stat-foot">On retainer</p>
            </article>

            <article className="wk-stat">
              <div className="wk-stat-top">
                <span className="wk-stat-label">Team tasks</span>
                <span className="wk-stat-icon">
                  <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
                </span>
              </div>
              <p className="wk-stat-value">
                {allTasks.filter((t) => t.status !== "done").length}
              </p>
              <p className="wk-stat-foot">{allTasks.length} total assigned</p>
            </article>
          </>
        ) : null}
      </section>

      <section className="wk-card">
        <div className="wk-card-head">
          <h2 className="wk-card-title">
            My open tasks
            {openTasks.length > 0 ? (
              <span className="wk-card-title-count">{openTasks.length}</span>
            ) : null}
          </h2>
          <Link href="/work/tasks" className="wk-link">
            View all
            <ArrowRight size={14} strokeWidth={2.2} aria-hidden />
          </Link>
        </div>

        {openTasks.length === 0 ? (
          <div className="wk-empty">
            <span className="wk-empty-icon">
              <ListChecks size={22} strokeWidth={1.8} aria-hidden />
            </span>
            <p className="wk-empty-title">You&apos;re all caught up</p>
            <p className="wk-empty-text">
              New tasks appear here once your operations manager publishes the
              weekly plan.
            </p>
          </div>
        ) : (
          <ul className="wk-task-list">
            {openTasks.slice(0, 6).map((task) => (
              <li key={task.id} className="wk-task-row">
                <span
                  className={`wk-task-marker${
                    task.status === "in_progress" ? " is-progress" : ""
                  }`}
                  aria-hidden
                />
                <span className="wk-task-body">
                  <span className="wk-task-title">{task.title}</span>
                  <span className="wk-task-meta">
                    <span>{clientName.get(task.clientId) ?? "Client"}</span>
                    {task.serviceCategoryId ? (
                      <span>{serviceName.get(task.serviceCategoryId)}</span>
                    ) : null}
                    {task.estimatedHours != null ? (
                      <span>{formatHours(task.estimatedHours)} est.</span>
                    ) : null}
                    {task.dueDate ? <span>Due {task.dueDate}</span> : null}
                  </span>
                </span>
                <span className={`wk-badge wk-badge-${task.status}`}>
                  {STATUS_LABEL[task.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
