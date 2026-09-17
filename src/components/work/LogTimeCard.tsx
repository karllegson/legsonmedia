"use client";

import { AlertCircle, CheckCircle2, ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { addManualTimeAction } from "@/app/work/(shell)/actions";
import {
  addWeeks,
  formatWorkWeekRange,
  getMondayOfWeek,
} from "@/lib/work/roles";
import type { Client, WorkTask } from "@/lib/work/types";

type TeammateOption = {
  id: string;
  displayName: string | null;
  email: string;
};

type LogTimeCardProps = {
  clients: Client[];
  teammates: TeammateOption[];
  tasks: WorkTask[];
  currentUserId: string;
};

function buildWeekOptions() {
  const thisWeek = getMondayOfWeek();
  return Array.from({ length: 8 }, (_, index) => {
    const weekStart = addWeeks(thisWeek, -index);
    const label =
      index === 0
        ? `This week · ${formatWorkWeekRange(weekStart)}`
        : index === 1
          ? `Last week · ${formatWorkWeekRange(weekStart)}`
          : formatWorkWeekRange(weekStart);
    return { weekStart, label };
  });
}

export function LogTimeCard({
  clients,
  teammates,
  tasks,
  currentUserId,
}: LogTimeCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState(currentUserId);
  const [clientId, setClientId] = useState("");
  const weekOptions = useMemo(() => buildWeekOptions(), []);

  const taskOptions = useMemo(() => {
    return tasks.filter((task) => {
      if (task.status === "done") {
        return false;
      }
      if (userId && task.assignedTo !== userId) {
        return false;
      }
      if (clientId && task.clientId !== clientId) {
        return false;
      }
      return true;
    });
  }, [tasks, userId, clientId]);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await addManualTimeAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not log time");
        return;
      }

      const hours = Number(formData.get("hours") ?? 0);
      const minutes = Number(formData.get("minutes") ?? 0);
      const personId = String(formData.get("userId") ?? "");
      const person = teammates.find((member) => member.id === personId);
      const name =
        person?.displayName || person?.email?.split("@")[0] || "teammate";
      const parts = [
        hours > 0 ? `${hours}h` : null,
        minutes > 0 ? `${minutes}m` : null,
      ].filter(Boolean);
      setSuccess(`Logged ${parts.join(" ") || "0"} for ${name}.`);
      router.refresh();
    });
  }

  return (
    <section className="wk-card">
      <div className="wk-card-head">
        <div>
          <h2 className="wk-card-title">Log time</h2>
          <p className="wk-card-sub">
            Add hours for anyone, any client, any week (Mon–Sun). No clock-in
            needed.
          </p>
        </div>
      </div>

      <form action={handleSubmit} className="wk-card-pad">
        {error ? (
          <div className="wk-alert wk-alert-error" style={{ marginBottom: 14 }}>
            <AlertCircle size={16} strokeWidth={2} aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        {success ? (
          <div
            className="wk-alert wk-alert-success"
            style={{ marginBottom: 14 }}
          >
            <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
            <span>{success}</span>
          </div>
        ) : null}

        <div className="wk-form-grid">
          <div className="wk-field">
            <label className="wk-label" htmlFor="log-person">
              Person
            </label>
            <select
              className="wk-select"
              id="log-person"
              name="userId"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              disabled={pending}
              required
            >
              {teammates.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName || member.email || "Teammate"}
                  {member.id === currentUserId ? " (you)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="wk-field">
            <label className="wk-label" htmlFor="log-week">
              Work week
            </label>
            <select
              className="wk-select"
              id="log-week"
              name="weekStart"
              defaultValue={weekOptions[1]?.weekStart ?? weekOptions[0]?.weekStart}
              disabled={pending}
              required
            >
              {weekOptions.map((week) => (
                <option key={week.weekStart} value={week.weekStart}>
                  {week.label}
                </option>
              ))}
            </select>
          </div>

          <div className="wk-field">
            <label className="wk-label" htmlFor="log-client">
              Client
            </label>
            <select
              className="wk-select"
              id="log-client"
              name="clientId"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              disabled={pending}
              required
            >
              <option value="" disabled>
                Select client
              </option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className="wk-field">
            <label className="wk-label" htmlFor="log-hours">
              Hours
            </label>
            <input
              className="wk-input"
              id="log-hours"
              name="hours"
              type="number"
              min="0"
              step="1"
              placeholder="4"
              defaultValue="0"
              disabled={pending}
            />
          </div>

          <div className="wk-field">
            <label className="wk-label" htmlFor="log-minutes">
              Minutes
            </label>
            <input
              className="wk-input"
              id="log-minutes"
              name="minutes"
              type="number"
              min="0"
              max="59"
              step="1"
              placeholder="45"
              defaultValue="0"
              disabled={pending}
            />
          </div>

          <div className="wk-field wk-form-full">
            <label className="wk-label" htmlFor="log-notes">
              What was it for?
            </label>
            <input
              className="wk-input"
              id="log-notes"
              name="notes"
              type="text"
              placeholder="e.g. Homepage revisions, retainer catch-up"
              required
              disabled={pending}
            />
          </div>

          <div className="wk-field wk-form-full">
            <label className="wk-label" htmlFor="log-task">
              Link to a task{" "}
              <span className="wk-label-hint">(optional)</span>
            </label>
            <select
              className="wk-select"
              id="log-task"
              name="taskId"
              defaultValue=""
              disabled={pending || !clientId || !userId}
            >
              <option value="">No task</option>
              {taskOptions.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            {clientId && userId && taskOptions.length === 0 ? (
              <p className="wk-note" style={{ marginTop: 6 }}>
                No open tasks for this person + client.
              </p>
            ) : null}
          </div>
        </div>

        <div className="wk-form-actions">
          <button
            type="submit"
            className="wk-btn wk-btn-primary"
            disabled={pending || teammates.length === 0}
          >
            <ClipboardList size={15} strokeWidth={2} aria-hidden />
            {pending ? "Saving…" : "Log time"}
          </button>
          <p className="wk-note" style={{ margin: 0 }}>
            Weeks run Monday–Sunday.
          </p>
        </div>
      </form>
    </section>
  );
}
