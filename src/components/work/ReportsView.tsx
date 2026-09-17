"use client";

import {
  BarChart3,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  Download,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addWeeks, formatCurrency, formatHours, isOwnerRole } from "@/lib/work/roles";
import type {
  ClientUtilization,
  SpecialistUtilization,
  WorkRole,
} from "@/lib/work/types";

type ReportsViewProps = {
  weekStart: string;
  clientReport: ClientUtilization[];
  specialistReport: SpecialistUtilization[];
  billingCsv: string;
  timeCsv: string;
  role: WorkRole;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatWeekLabel(weekStart: string) {
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsView({
  weekStart,
  clientReport,
  specialistReport,
  billingCsv,
  timeCsv,
  role,
}: ReportsViewProps) {
  const router = useRouter();
  const isOwner = isOwnerRole(role);

  const totalLogged = clientReport.reduce((sum, row) => sum + row.loggedHours, 0);
  const totalRetainer = clientReport.reduce(
    (sum, row) => sum + row.retainerHours,
    0,
  );
  const totalBillable = clientReport.reduce(
    (sum, row) => sum + row.billableAmount,
    0,
  );
  const overallUtilization =
    totalRetainer > 0 ? Math.round((totalLogged / totalRetainer) * 100) : 0;

  return (
    <div className="wk-stack">
      <section className="wk-card wk-card-pad">
        <div className="wk-toolbar">
          <div className="wk-toolbar-fields">
            <div className="wk-field">
              <label className="wk-label" htmlFor="report-week">
                Week starting (Monday)
              </label>
              <div className="wk-row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className="wk-icon-btn"
                  aria-label="Previous week"
                  onClick={() =>
                    router.push(`/work/reports?week=${addWeeks(weekStart, -1)}`)
                  }
                >
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden />
                </button>
                <input
                  className="wk-input"
                  id="report-week"
                  type="date"
                  value={weekStart}
                  style={{ width: 150 }}
                  onChange={(event) =>
                    router.push(`/work/reports?week=${event.target.value}`)
                  }
                />
                <button
                  type="button"
                  className="wk-icon-btn"
                  aria-label="Next week"
                  onClick={() =>
                    router.push(`/work/reports?week=${addWeeks(weekStart, 1)}`)
                  }
                >
                  <ChevronRight size={16} strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <div className="wk-row">
            <span className="wk-badge">
              <CalendarRange size={13} strokeWidth={2.1} aria-hidden />
              {formatWeekLabel(weekStart)}
            </span>
            <button
              type="button"
              className="wk-btn wk-btn-ghost"
              onClick={() => downloadCsv(`time-entries-${weekStart}.csv`, timeCsv)}
            >
              <Download size={15} strokeWidth={2} aria-hidden />
              Time entries
            </button>
            {isOwner ? (
              <button
                type="button"
                className="wk-btn wk-btn-primary"
                onClick={() => downloadCsv(`billing-${weekStart}.csv`, billingCsv)}
              >
                <Download size={15} strokeWidth={2} aria-hidden />
                Billing CSV
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="wk-stats">
        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Hours logged</span>
            <span className="wk-stat-icon is-accent">
              <Clock3 size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {totalLogged.toFixed(1)}
            <small>h</small>
          </p>
          <p className="wk-stat-foot">
            of {formatHours(totalRetainer)} contracted
          </p>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Retainer usage</span>
            <span className="wk-stat-icon is-violet">
              <TrendingUp size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {overallUtilization}
            <small>%</small>
          </p>
          <div className="wk-progress">
            <span
              className={`wk-progress-fill${
                overallUtilization > 100
                  ? " is-over"
                  : overallUtilization >= 80
                    ? " is-good"
                    : ""
              }`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
        </article>

        {isOwner ? (
          <article className="wk-stat">
            <div className="wk-stat-top">
              <span className="wk-stat-label">Billable this week</span>
              <span className="wk-stat-icon is-green">
                <DollarSign size={16} strokeWidth={2} aria-hidden />
              </span>
            </div>
            <p className="wk-stat-value">{formatCurrency(totalBillable)}</p>
            <p className="wk-stat-foot">Logged hours &times; rate</p>
          </article>
        ) : null}

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Clients reported</span>
            <span className="wk-stat-icon is-blue">
              <BarChart3 size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">{clientReport.length}</p>
          <p className="wk-stat-foot">Active retainers</p>
        </article>
      </section>

      <section className="wk-card">
        <div className="wk-card-head">
          <div>
            <h2 className="wk-card-title">Client utilization</h2>
            <p className="wk-card-sub">
              Planned vs logged against each weekly retainer.
            </p>
          </div>
        </div>

        {clientReport.length === 0 ? (
          <div className="wk-empty">
            <span className="wk-empty-icon">
              <BarChart3 size={22} strokeWidth={1.8} aria-hidden />
            </span>
            <p className="wk-empty-title">Nothing to report yet</p>
            <p className="wk-empty-text">
              Add clients with retainers and log some time to see this report.
            </p>
          </div>
        ) : (
          <div className="wk-table-scroll">
            <table className="wk-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th className="wk-table-right">Retainer</th>
                  <th className="wk-table-right">Planned</th>
                  <th className="wk-table-right">Logged</th>
                  <th className="wk-table-right">Remaining</th>
                  <th>Usage</th>
                  {isOwner ? (
                    <th className="wk-table-right">Billable</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {clientReport.map((row) => {
                  const usage =
                    row.retainerHours > 0
                      ? Math.round((row.loggedHours / row.retainerHours) * 100)
                      : 0;

                  return (
                    <tr key={row.clientId}>
                      <td className="wk-cell-title">
                        <Link
                          href={`/work/clients/${row.clientSlug}?week=${weekStart}`}
                          className="wk-link"
                        >
                          {row.clientName}
                        </Link>
                      </td>
                      <td className="wk-table-right wk-table-num">
                        {formatHours(row.retainerHours)}
                      </td>
                      <td className="wk-table-right wk-table-num wk-cell-muted">
                        {formatHours(row.plannedHours)}
                      </td>
                      <td className="wk-table-right wk-cell-strong">
                        {formatHours(row.loggedHours)}
                      </td>
                      <td className="wk-table-right wk-table-num wk-cell-muted">
                        {formatHours(row.remainingHours)}
                      </td>
                      <td>
                        <span className="wk-util">
                          <span className="wk-util-track">
                            <span
                              className={`wk-util-fill${
                                usage > 100
                                  ? " is-over"
                                  : usage < 60
                                    ? " is-warn"
                                    : ""
                              }`}
                              style={{ width: `${Math.min(100, usage)}%` }}
                            />
                          </span>
                          <span className="wk-util-value">{usage}%</span>
                        </span>
                      </td>
                      {isOwner ? (
                        <td className="wk-table-right wk-cell-strong">
                          {formatCurrency(row.billableAmount)}
                        </td>
                      ) : null}
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
            <h2 className="wk-card-title">Team utilization</h2>
            <p className="wk-card-sub">
              Allocated vs logged hours per team member this week.
            </p>
          </div>
        </div>

        {specialistReport.length === 0 ? (
          <div className="wk-empty">
            <span className="wk-empty-icon">
              <TrendingUp size={22} strokeWidth={1.8} aria-hidden />
            </span>
            <p className="wk-empty-title">No team data</p>
            <p className="wk-empty-text">
              Allocate hours in Planning to track utilization here.
            </p>
          </div>
        ) : (
          <div className="wk-table-scroll">
            <table className="wk-table">
              <thead>
                <tr>
                  <th>Team member</th>
                  <th className="wk-table-right">Allocated</th>
                  <th className="wk-table-right">Logged</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {specialistReport.map((row) => {
                  const label = row.displayName ?? "Unknown";

                  return (
                    <tr key={row.userId}>
                      <td>
                        <span className="wk-person">
                          <span className="wk-person-avatar" aria-hidden>
                            {initials(label)}
                          </span>
                          <span className="wk-person-name">{label}</span>
                        </span>
                      </td>
                      <td className="wk-table-right wk-table-num wk-cell-muted">
                        {formatHours(row.allocatedHours)}
                      </td>
                      <td className="wk-table-right wk-cell-strong">
                        {formatHours(row.loggedHours)}
                      </td>
                      <td>
                        <span className="wk-util">
                          <span className="wk-util-track">
                            <span
                              className={`wk-util-fill${
                                row.utilizationPct > 100
                                  ? " is-over"
                                  : row.utilizationPct < 60
                                    ? " is-warn"
                                    : ""
                              }`}
                              style={{
                                width: `${Math.min(100, row.utilizationPct)}%`,
                              }}
                            />
                          </span>
                          <span className="wk-util-value">
                            {row.utilizationPct}%
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
