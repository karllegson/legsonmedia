"use client";

import { AlertCircle, Radio, Timer, UserCog, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateMemberRoleAction } from "@/app/work/(shell)/actions";
import { LiveTimer } from "@/components/work/LiveTimer";
import { formatWorkRole } from "@/lib/work/roles";
import type { ActiveClockEntry, TeamMember, WorkRole } from "@/lib/work/types";

type TeamViewProps = {
  members: TeamMember[];
  activeClockIns: Array<ActiveClockEntry & { userDisplayName: string | null }>;
  canManageRoles: boolean;
};

const ROLE_BADGE: Record<WorkRole, string> = {
  owner: "wk-badge-violet",
  operations_manager: "wk-badge-blue",
  specialist: "wk-badge-todo",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function TeamView({
  members,
  activeClockIns,
  canManageRoles,
}: TeamViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateRole(userId: string, role: string) {
    setError(null);
    const fd = new FormData();
    fd.set("userId", userId);
    fd.set("role", role);

    startTransition(async () => {
      const result = await updateMemberRoleAction(fd);
      if (!result.ok) {
        setError(result.error ?? "Could not update role");
        return;
      }
      router.refresh();
    });
  }

  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <div className="wk-stack">
      {error ? (
        <div className="wk-alert wk-alert-error">
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="wk-stats">
        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Active team members</span>
            <span className="wk-stat-icon is-accent">
              <Users size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">{activeCount}</p>
          <p className="wk-stat-foot">{members.length} accounts total</p>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Clocked in now</span>
            <span className="wk-stat-icon is-green">
              <Radio size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">{activeClockIns.length}</p>
          <p className="wk-stat-foot">
            {activeClockIns.length === 0 ? "Nobody on the clock" : "Live sessions"}
          </p>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Managers</span>
            <span className="wk-stat-icon is-violet">
              <UserCog size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {members.filter((m) => m.role !== "specialist").length}
          </p>
          <p className="wk-stat-foot">Owner + operations</p>
        </article>
      </section>

      <section className="wk-card">
        <div className="wk-card-head">
          <div>
            <h2 className="wk-card-title">
              Live activity
              {activeClockIns.length > 0 ? (
                <span className="wk-card-title-count">{activeClockIns.length}</span>
              ) : null}
            </h2>
            <p className="wk-card-sub">Who is on the clock right now</p>
          </div>
        </div>

        {activeClockIns.length === 0 ? (
          <div className="wk-empty">
            <span className="wk-empty-icon">
              <Timer size={22} strokeWidth={1.8} aria-hidden />
            </span>
            <p className="wk-empty-title">No active sessions</p>
            <p className="wk-empty-text">
              This updates as soon as someone clocks in.
            </p>
          </div>
        ) : (
          <div className="wk-card-pad">
            <div className="wk-tiles">
              {activeClockIns.map((entry) => (
                <article key={entry.id} className="wk-tile wk-tile-live">
                  <div className="wk-tile-head">
                    <span className="wk-person">
                      <span className="wk-person-avatar is-accent" aria-hidden>
                        {initials(entry.userDisplayName ?? "Team")}
                      </span>
                      <span>
                        <span className="wk-person-name">
                          {entry.userDisplayName ?? "Team member"}
                        </span>
                        <span className="wk-person-sub">{entry.clientName}</span>
                      </span>
                    </span>
                  </div>

                  <LiveTimer
                    startedAt={entry.clockIn}
                    className="wk-metric-value"
                  />

                  {entry.taskTitle ? (
                    <p className="wk-muted" style={{ marginTop: 8 }}>
                      {entry.taskTitle}
                    </p>
                  ) : (
                    <p className="wk-dim" style={{ marginTop: 8, fontSize: 12.5 }}>
                      General work
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="wk-card">
        <div className="wk-card-head">
          <div>
            <h2 className="wk-card-title">
              Roster
              <span className="wk-card-title-count">{members.length}</span>
            </h2>
            <p className="wk-card-sub">
              {canManageRoles
                ? "Change a role to grant or remove operations access."
                : "Only the owner can change roles."}
            </p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="wk-empty">
            <span className="wk-empty-icon">
              <Users size={22} strokeWidth={1.8} aria-hidden />
            </span>
            <p className="wk-empty-title">No team members yet</p>
            <p className="wk-empty-text">
              Create accounts in Supabase Auth. They appear here after first
              sign-in.
            </p>
          </div>
        ) : (
          <div className="wk-table-scroll">
            <table className="wk-table">
              <thead>
                <tr>
                  <th>Team member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const label = member.displayName || member.email || "Member";

                  return (
                    <tr key={member.id}>
                      <td>
                        <span className="wk-person">
                          <span className="wk-person-avatar" aria-hidden>
                            {initials(label)}
                          </span>
                          <span className="wk-person-name">
                            {member.displayName ?? "—"}
                          </span>
                        </span>
                      </td>
                      <td className="wk-cell-muted">{member.email || "—"}</td>
                      <td>
                        {canManageRoles ? (
                          <select
                            className="wk-select"
                            style={{ maxWidth: 190 }}
                            value={member.role}
                            disabled={pending}
                            onChange={(event) =>
                              updateRole(member.id, event.target.value)
                            }
                            aria-label={`Role for ${label}`}
                          >
                            <option value="specialist">Specialist</option>
                            <option value="operations_manager">
                              Operations Manager
                            </option>
                            <option value="owner">Owner</option>
                          </select>
                        ) : (
                          <span className={`wk-badge ${ROLE_BADGE[member.role]}`}>
                            {formatWorkRole(member.role)}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`wk-badge ${
                            member.isActive ? "wk-badge-done" : "wk-badge-danger"
                          }`}
                        >
                          <span className="wk-badge-dot" aria-hidden />
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="wk-note">
          New team members are created in Supabase Auth. Set their role here after
          their first sign-in.
        </p>
      </section>
    </div>
  );
}
