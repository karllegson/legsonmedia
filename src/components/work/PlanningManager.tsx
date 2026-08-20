"use client";

import {
  AlertCircle,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  publishPlanAction,
  saveAllocationAction,
  savePlanLineAction,
} from "@/app/work/(shell)/actions";
import { addWeeks, formatHours } from "@/lib/work/roles";
import type {
  ClientWithRetainer,
  ServiceCategory,
  SpecialistAllocation,
  TeamMember,
  WeeklyPlan,
  WeeklyPlanLine,
} from "@/lib/work/types";

type PlanningManagerProps = {
  clients: ClientWithRetainer[];
  serviceCategories: ServiceCategory[];
  teamMembers: TeamMember[];
  selectedClientId: string;
  weekStart: string;
  plan: WeeklyPlan | null;
  planLines: WeeklyPlanLine[];
  allocations: SpecialistAllocation[];
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

export function PlanningManager({
  clients,
  serviceCategories,
  teamMembers,
  selectedClientId,
  weekStart,
  plan,
  planLines,
  allocations,
}: PlanningManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const retainerHours = selectedClient?.retainer?.hoursPerWeek ?? 0;
  const plannedTotal = planLines.reduce((sum, line) => sum + line.plannedHours, 0);
  const allocatedTotal = allocations.reduce(
    (sum, alloc) => sum + alloc.allocatedHours,
    0,
  );
  const overPlanned = plannedTotal > retainerHours && retainerHours > 0;
  const overAllocated = allocatedTotal > plannedTotal && plannedTotal > 0;
  const unassigned = Math.max(0, plannedTotal - allocatedTotal);

  const assignable = teamMembers.filter(
    (member) => member.role === "specialist" || member.role === "operations_manager",
  );

  const lineByService = new Map(planLines.map((l) => [l.serviceCategoryId, l]));
  const allocByKey = new Map(
    allocations.map((a) => [`${a.userId}:${a.serviceCategoryId}`, a]),
  );

  function navigate(clientId: string, week: string) {
    router.push(`/work/planning?client=${clientId}&week=${week}`);
  }

  function saveLine(serviceCategoryId: string, hours: number, lineId?: string) {
    if (!plan) return;
    const fd = new FormData();
    fd.set("weeklyPlanId", plan.id);
    fd.set("serviceCategoryId", serviceCategoryId);
    fd.set("plannedHours", String(hours));
    if (lineId) fd.set("lineId", lineId);

    startTransition(async () => {
      await savePlanLineAction(fd);
      router.refresh();
    });
  }

  function saveAlloc(
    userId: string,
    serviceCategoryId: string,
    hours: number,
    allocationId?: string,
  ) {
    if (!plan) return;
    const fd = new FormData();
    fd.set("weeklyPlanId", plan.id);
    fd.set("userId", userId);
    fd.set("serviceCategoryId", serviceCategoryId);
    fd.set("allocatedHours", String(hours));
    if (allocationId) fd.set("allocationId", allocationId);

    startTransition(async () => {
      await saveAllocationAction(fd);
      router.refresh();
    });
  }

  function publish(generateTasks: boolean) {
    if (!plan || !selectedClientId) return;
    const fd = new FormData();
    fd.set("weeklyPlanId", plan.id);
    fd.set("clientId", selectedClientId);
    fd.set("weekStart", weekStart);
    if (generateTasks) fd.set("generateTasks", "1");

    startTransition(async () => {
      await publishPlanAction(fd);
      router.refresh();
    });
  }

  return (
    <div className="wk-stack">
      <section className="wk-card wk-card-pad">
        <div className="wk-toolbar">
          <div className="wk-toolbar-fields">
            <div className="wk-field">
              <label className="wk-label" htmlFor="plan-client">
                Client
              </label>
              <select
                className="wk-select"
                id="plan-client"
                value={selectedClientId}
                onChange={(event) => navigate(event.target.value, weekStart)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="wk-field">
              <label className="wk-label" htmlFor="plan-week">
                Week starting (Monday)
              </label>
              <div className="wk-row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className="wk-icon-btn"
                  aria-label="Previous week"
                  onClick={() => navigate(selectedClientId, addWeeks(weekStart, -1))}
                >
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden />
                </button>
                <input
                  className="wk-input"
                  id="plan-week"
                  type="date"
                  value={weekStart}
                  style={{ width: 150 }}
                  onChange={(event) => navigate(selectedClientId, event.target.value)}
                />
                <button
                  type="button"
                  className="wk-icon-btn"
                  aria-label="Next week"
                  onClick={() => navigate(selectedClientId, addWeeks(weekStart, 1))}
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
            {plan ? (
              <span className={`wk-badge wk-badge-${plan.status}`}>
                <span className="wk-badge-dot" aria-hidden />
                {plan.status === "published" ? "Published" : "Draft"}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="wk-stats">
        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Retainer cap</span>
            <span className="wk-stat-icon is-accent">
              <Target size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {retainerHours.toFixed(1)}
            <small>h</small>
          </p>
          <p className="wk-stat-foot">{selectedClient?.name ?? "—"}</p>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Planned</span>
            <span className="wk-stat-icon is-blue">
              <CalendarRange size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {plannedTotal.toFixed(1)}
            <small>h</small>
          </p>
          <div className="wk-progress">
            <span
              className={`wk-progress-fill${overPlanned ? " is-over" : ""}`}
              style={{
                width: `${
                  retainerHours > 0
                    ? Math.min(100, (plannedTotal / retainerHours) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Allocated</span>
            <span className="wk-stat-icon is-violet">
              <Users size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {allocatedTotal.toFixed(1)}
            <small>h</small>
          </p>
          <div className="wk-progress">
            <span
              className={`wk-progress-fill${overAllocated ? " is-over" : ""}`}
              style={{
                width: `${
                  plannedTotal > 0
                    ? Math.min(100, (allocatedTotal / plannedTotal) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Unassigned</span>
            <span className="wk-stat-icon is-green">
              <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {unassigned.toFixed(1)}
            <small>h</small>
          </p>
          <p className="wk-stat-foot">
            {unassigned === 0 ? "Fully assigned" : "Still needs an owner"}
          </p>
        </article>
      </section>

      {overPlanned ? (
        <div className="wk-alert wk-alert-warn">
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>
            Planned hours ({formatHours(plannedTotal)}) exceed the retainer cap of{" "}
            {formatHours(retainerHours)}. Trim the service mix or renegotiate the
            retainer.
          </span>
        </div>
      ) : null}

      {overAllocated ? (
        <div className="wk-alert wk-alert-warn">
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>
            Specialist allocations ({formatHours(allocatedTotal)}) exceed planned
            hours ({formatHours(plannedTotal)}).
          </span>
        </div>
      ) : null}

      {!plan ? (
        <section className="wk-card">
          <div className="wk-empty">
            <span className="wk-empty-icon">
              <CalendarRange size={22} strokeWidth={1.8} aria-hidden />
            </span>
            <p className="wk-empty-title">Select a client to build a plan</p>
            <p className="wk-empty-text">
              Add a client with a retainer first, then choose them above.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="wk-card">
            <div className="wk-card-head">
              <div>
                <h2 className="wk-card-title">Service mix</h2>
                <p className="wk-card-sub">
                  Split the retainer across service lines before assigning people.
                </p>
              </div>
              <span className="wk-badge wk-badge-accent">
                {formatHours(plannedTotal)} of {formatHours(retainerHours)}
              </span>
            </div>

            <div className="wk-table-scroll">
              <table className="wk-table">
                <thead>
                  <tr>
                    <th>Service line</th>
                    <th className="wk-table-right">Planned hours</th>
                    <th className="wk-table-right">Share of retainer</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceCategories.map((category) => {
                    const line = lineByService.get(category.id);
                    const hours = line?.plannedHours ?? 0;
                    const share =
                      retainerHours > 0
                        ? Math.round((hours / retainerHours) * 100)
                        : 0;

                    return (
                      <tr key={category.id}>
                        <td className="wk-cell-title">{category.name}</td>
                        <td className="wk-table-right">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            className={`wk-num-input${hours > 0 ? " has-value" : ""}`}
                            defaultValue={hours}
                            disabled={pending}
                            onBlur={(event) =>
                              saveLine(
                                category.id,
                                Number(event.target.value) || 0,
                                line?.id,
                              )
                            }
                          />
                        </td>
                        <td className="wk-table-right">
                          <span className="wk-util">
                            <span className="wk-util-track">
                              <span
                                className="wk-util-fill is-warn"
                                style={{ width: `${Math.min(100, share)}%` }}
                              />
                            </span>
                            <span className="wk-util-value">{share}%</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="wk-note">
              Hours save automatically when you click out of a field.
            </p>
          </section>

          <section className="wk-card">
            <div className="wk-card-head">
              <div>
                <h2 className="wk-card-title">Specialist allocations</h2>
                <p className="wk-card-sub">
                  Assign each service line to the person who owns it this week.
                </p>
              </div>
            </div>

            {assignable.length === 0 ? (
              <div className="wk-empty">
                <span className="wk-empty-icon">
                  <Users size={22} strokeWidth={1.8} aria-hidden />
                </span>
                <p className="wk-empty-title">No team members yet</p>
                <p className="wk-empty-text">
                  Create accounts in Supabase Auth, then set their roles on the
                  Team page.
                </p>
              </div>
            ) : (
              <div className="wk-table-scroll">
                <table className="wk-table wk-matrix">
                  <thead>
                    <tr>
                      <th>Specialist</th>
                      {serviceCategories.map((category) => (
                        <th key={category.id} style={{ textAlign: "center" }}>
                          {category.name}
                        </th>
                      ))}
                      <th style={{ textAlign: "center" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignable.map((member) => {
                      const label = member.displayName || member.email || "Member";
                      const rowTotal = serviceCategories.reduce(
                        (sum, category) =>
                          sum +
                          (allocByKey.get(`${member.id}:${category.id}`)
                            ?.allocatedHours ?? 0),
                        0,
                      );

                      return (
                        <tr key={member.id}>
                          <td>
                            <span className="wk-person">
                              <span className="wk-person-avatar" aria-hidden>
                                {initials(label)}
                              </span>
                              <span className="wk-person-name">{label}</span>
                            </span>
                          </td>
                          {serviceCategories.map((category) => {
                            const alloc = allocByKey.get(
                              `${member.id}:${category.id}`,
                            );
                            const hours = alloc?.allocatedHours ?? 0;

                            return (
                              <td key={category.id}>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  className={`wk-num-input${
                                    hours > 0 ? " has-value" : ""
                                  }`}
                                  defaultValue={hours}
                                  disabled={pending}
                                  onBlur={(event) =>
                                    saveAlloc(
                                      member.id,
                                      category.id,
                                      Number(event.target.value) || 0,
                                      alloc?.id,
                                    )
                                  }
                                />
                              </td>
                            );
                          })}
                          <td className="wk-matrix-total">
                            {rowTotal > 0 ? formatHours(rowTotal) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="wk-card wk-card-pad">
            <div className="wk-row-between">
              <div>
                <h2 className="wk-card-title">
                  {plan.status === "published"
                    ? "Plan is live"
                    : "Ready to publish?"}
                </h2>
                <p className="wk-card-sub">
                  Publishing makes the plan visible to the team. Generating tasks
                  creates one task per allocation.
                </p>
              </div>

              <div className="wk-row">
                <button
                  type="button"
                  className="wk-btn wk-btn-ghost"
                  disabled={pending || allocatedTotal === 0}
                  onClick={() => publish(true)}
                >
                  <Sparkles size={15} strokeWidth={2} aria-hidden />
                  Publish &amp; generate tasks
                </button>
                <button
                  type="button"
                  className="wk-btn wk-btn-primary"
                  disabled={pending || plan.status === "published"}
                  onClick={() => publish(false)}
                >
                  <Send size={15} strokeWidth={2} aria-hidden />
                  {plan.status === "published" ? "Published" : "Publish plan"}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
