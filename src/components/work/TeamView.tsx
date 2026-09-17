"use client";

import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Plus,
  Radio,
  Timer,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createTeamMemberAction,
  setMemberPasswordAction,
  updateMemberRoleAction,
} from "@/app/work/(shell)/actions";
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

function generateTempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function TeamView({
  members,
  activeClockIns,
  canManageRoles,
}: TeamViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [resetMember, setResetMember] = useState<TeamMember | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  function updateRole(userId: string, role: string) {
    setError(null);
    setSuccess(null);
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

  function openCreate() {
    setError(null);
    setSuccess(null);
    setPasswordValue(generateTempPassword());
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
    setPasswordValue("");
  }

  function handleCreate(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createTeamMemberAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not create account");
        return;
      }
      const email = String(formData.get("email") ?? "").trim();
      setSuccess(
        `Account created for ${email}. Share the temporary password you set — they can change it after signing in.`,
      );
      closeCreate();
      router.refresh();
    });
  }

  function openResetPassword(member: TeamMember) {
    setError(null);
    setSuccess(null);
    setResetMember(member);
    setResetPasswordValue(generateTempPassword());
  }

  function closeResetPassword() {
    setResetMember(null);
    setResetPasswordValue("");
  }

  function handleResetPassword(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await setMemberPasswordAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not update password");
        return;
      }
      const label =
        resetMember?.displayName || resetMember?.email || "Teammate";
      setSuccess(
        `Password updated for ${label}. Share the new temporary password with them.`,
      );
      closeResetPassword();
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

      {success ? (
        <div className="wk-alert wk-alert-success">
          <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
          <span>{success}</span>
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

      {canManageRoles ? (
        <section className="wk-card">
          <div className="wk-card-head">
            <div>
              <h2 className="wk-card-title">Add team account</h2>
              <p className="wk-card-sub">
                Create a Work Portal login without opening Supabase.
              </p>
            </div>
            {!showCreate ? (
              <button
                type="button"
                className="wk-btn wk-btn-primary"
                onClick={openCreate}
              >
                <Plus size={15} strokeWidth={2} aria-hidden />
                New account
              </button>
            ) : (
              <button
                type="button"
                className="wk-btn wk-btn-ghost"
                onClick={closeCreate}
                disabled={pending}
              >
                <X size={15} strokeWidth={2} aria-hidden />
                Cancel
              </button>
            )}
          </div>

          {showCreate ? (
            <form action={handleCreate} className="wk-card-pad">
              <div className="wk-form-grid">
                <div className="wk-field">
                  <label className="wk-label" htmlFor="member-email">
                    Email
                  </label>
                  <input
                    className="wk-input"
                    id="member-email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    placeholder="name@legsonmedia.com"
                    required
                    disabled={pending}
                  />
                </div>

                <div className="wk-field">
                  <label className="wk-label" htmlFor="member-name">
                    Display name{" "}
                    <span className="wk-label-hint">(optional)</span>
                  </label>
                  <input
                    className="wk-input"
                    id="member-name"
                    name="displayName"
                    type="text"
                    autoComplete="off"
                    placeholder="Jordan"
                    disabled={pending}
                  />
                </div>

                <div className="wk-field">
                  <label className="wk-label" htmlFor="member-role">
                    Role
                  </label>
                  <select
                    className="wk-select"
                    id="member-role"
                    name="role"
                    defaultValue="specialist"
                    disabled={pending}
                  >
                    <option value="specialist">Specialist</option>
                    <option value="operations_manager">
                      Operations Manager
                    </option>
                    <option value="owner">Owner</option>
                  </select>
                </div>

                <div className="wk-field">
                  <label className="wk-label" htmlFor="member-password">
                    Temporary password
                  </label>
                  <div className="wk-row" style={{ gap: 8 }}>
                    <input
                      className="wk-input"
                      id="member-password"
                      name="password"
                      type="text"
                      autoComplete="new-password"
                      value={passwordValue}
                      onChange={(event) => setPasswordValue(event.target.value)}
                      minLength={8}
                      required
                      disabled={pending}
                    />
                    <button
                      type="button"
                      className="wk-btn wk-btn-ghost"
                      onClick={() => setPasswordValue(generateTempPassword())}
                      disabled={pending}
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>

              <div className="wk-form-actions">
                <button
                  type="submit"
                  className="wk-btn wk-btn-primary"
                  disabled={pending}
                >
                  {pending ? "Creating…" : "Create account"}
                </button>
                <p className="wk-note" style={{ margin: 0 }}>
                  Share the email + temporary password with them. No Supabase
                  email is sent.
                </p>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="wk-card">
        <div className="wk-card-head">
          <div>
            <h2 className="wk-card-title">
              Roster
              <span className="wk-card-title-count">{members.length}</span>
            </h2>
            <p className="wk-card-sub">
              {canManageRoles
                ? "You’re the owner — change a role to grant or remove access."
                : "Only the owner (karl@legsonmedia.com) can change roles."}
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
              {canManageRoles
                ? "Use Add team account above to create the first login."
                : "Ask the owner to create accounts from this page."}
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
                  {canManageRoles ? <th>Password</th> : null}
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
                      {canManageRoles ? (
                        <td>
                          <button
                            type="button"
                            className="wk-btn wk-btn-ghost"
                            onClick={() => openResetPassword(member)}
                            disabled={pending}
                          >
                            <KeyRound size={14} strokeWidth={2} aria-hidden />
                            Set password
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="wk-note">
          {canManageRoles
            ? "New accounts can sign in at /work/login with the email and temporary password you set. Use Set password anytime — no email required."
            : "Ask the owner if you need a new login created."}
        </p>
      </section>

      {canManageRoles && resetMember ? (
        <section className="wk-card">
          <div className="wk-card-head">
            <div>
              <h2 className="wk-card-title">Set password</h2>
              <p className="wk-card-sub">
                Update login for{" "}
                {resetMember.displayName || resetMember.email || "teammate"} —
                no reset email is sent.
              </p>
            </div>
            <button
              type="button"
              className="wk-btn wk-btn-ghost"
              onClick={closeResetPassword}
              disabled={pending}
            >
              <X size={15} strokeWidth={2} aria-hidden />
              Cancel
            </button>
          </div>

          <form action={handleResetPassword} className="wk-card-pad">
            <input type="hidden" name="userId" value={resetMember.id} />
            <div className="wk-form-grid">
              <div className="wk-field wk-form-full">
                <label className="wk-label" htmlFor="reset-password">
                  New temporary password
                </label>
                <div className="wk-row" style={{ gap: 8 }}>
                  <input
                    className="wk-input"
                    id="reset-password"
                    name="password"
                    type="text"
                    autoComplete="new-password"
                    value={resetPasswordValue}
                    onChange={(event) =>
                      setResetPasswordValue(event.target.value)
                    }
                    minLength={8}
                    required
                    disabled={pending}
                  />
                  <button
                    type="button"
                    className="wk-btn wk-btn-ghost"
                    onClick={() =>
                      setResetPasswordValue(generateTempPassword())
                    }
                    disabled={pending}
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
            <div className="wk-form-actions">
              <button
                type="submit"
                className="wk-btn wk-btn-primary"
                disabled={pending || resetPasswordValue.length < 8}
              >
                {pending ? "Saving…" : "Save password"}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
