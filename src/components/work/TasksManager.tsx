"use client";

import {
  AlertCircle,
  ListChecks,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskStatusAction,
} from "@/app/work/(shell)/actions";
import { formatHours, formatWorkRole } from "@/lib/work/roles";
import type {
  Client,
  ServiceCategory,
  TaskStatus,
  TeamMember,
  WorkTask,
} from "@/lib/work/types";

type TasksManagerProps = {
  tasks: WorkTask[];
  clients: Client[];
  teamMembers: TeamMember[];
  serviceCategories: ServiceCategory[];
  isManager: boolean;
  currentUserId: string;
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const PRIORITY_LABEL = {
  low: "Low",
  normal: "Normal",
  high: "High",
} as const;

type Filter = "all" | TaskStatus;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function TasksManager({
  tasks,
  clients,
  teamMembers,
  serviceCategories,
  isManager,
  currentUserId,
}: TasksManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients],
  );
  const serviceName = useMemo(
    () => new Map(serviceCategories.map((s) => [s.id, s.name])),
    [serviceCategories],
  );
  const memberName = useMemo(
    () =>
      new Map(
        teamMembers.map((m) => [
          m.id,
          m.displayName || m.email || m.id.slice(0, 8),
        ]),
      ),
    [teamMembers],
  );

  const counts = useMemo(
    () => ({
      all: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    }),
    [tasks],
  );

  const visibleTasks =
    filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  function handleStatus(taskId: string, status: TaskStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateTaskStatusAction(taskId, status);
      if (!result.ok) {
        setError(result.error ?? "Could not update task");
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(taskId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteTaskAction(taskId);
      if (!result.ok) {
        setError(result.error ?? "Could not delete task");
        return;
      }
      router.refresh();
    });
  }

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTaskAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not create task");
        return;
      }
      (document.getElementById("new-task-form") as HTMLFormElement)?.reset();
      setShowForm(false);
      router.refresh();
    });
  }

  return (
    <div className="wk-stack">
      {error ? (
        <div className="wk-alert wk-alert-error">
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="wk-row-between">
        <div className="wk-segment">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`wk-segment-btn${filter === item.id ? " is-active" : ""}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label} ({counts[item.id]})
            </button>
          ))}
        </div>

        {isManager ? (
          <button
            type="button"
            className={`wk-btn ${showForm ? "wk-btn-ghost" : "wk-btn-dark"}`}
            onClick={() => setShowForm((value) => !value)}
          >
            {showForm ? (
              <>
                <X size={15} strokeWidth={2} aria-hidden />
                Cancel
              </>
            ) : (
              <>
                <Plus size={15} strokeWidth={2.2} aria-hidden />
                Assign task
              </>
            )}
          </button>
        ) : null}
      </div>

      {isManager && showForm ? (
        <section className="wk-card">
          <div className="wk-card-head">
            <div>
              <h2 className="wk-card-title">Assign a task</h2>
              <p className="wk-card-sub">
                Tasks show up on the specialist&apos;s dashboard immediately.
              </p>
            </div>
          </div>

          <form id="new-task-form" action={handleCreate} className="wk-card-pad">
            <div className="wk-form-grid">
              <div className="wk-field">
                <label className="wk-label" htmlFor="task-client">
                  Client
                </label>
                <select className="wk-select" id="task-client" name="clientId" required>
                  <option value="">Choose client…</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wk-field">
                <label className="wk-label" htmlFor="task-assignee">
                  Assign to
                </label>
                <select
                  className="wk-select"
                  id="task-assignee"
                  name="assignedTo"
                  required
                >
                  <option value="">Choose team member…</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName || member.email} &middot;{" "}
                      {formatWorkRole(member.role)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wk-field wk-form-full">
                <label className="wk-label" htmlFor="task-title">
                  Task title
                </label>
                <input
                  className="wk-input"
                  id="task-title"
                  name="title"
                  placeholder="e.g. Write + schedule 4 IG posts"
                  required
                />
              </div>

              <div className="wk-field wk-form-full">
                <label className="wk-label" htmlFor="task-desc">
                  Description <span className="wk-label-hint">(optional)</span>
                </label>
                <textarea
                  className="wk-textarea"
                  id="task-desc"
                  name="description"
                  rows={2}
                  placeholder="Any context, links, or deliverables"
                />
              </div>

              <div className="wk-field">
                <label className="wk-label" htmlFor="task-service">
                  Service
                </label>
                <select className="wk-select" id="task-service" name="serviceCategoryId">
                  <option value="">Not specified</option>
                  {serviceCategories.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wk-field">
                <label className="wk-label" htmlFor="task-hours">
                  Estimated hours
                </label>
                <input
                  className="wk-input"
                  id="task-hours"
                  name="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="6"
                />
              </div>

              <div className="wk-field">
                <label className="wk-label" htmlFor="task-due">
                  Due date
                </label>
                <input className="wk-input" id="task-due" name="dueDate" type="date" />
              </div>

              <div className="wk-field">
                <label className="wk-label" htmlFor="task-priority">
                  Priority
                </label>
                <select
                  className="wk-select"
                  id="task-priority"
                  name="priority"
                  defaultValue="normal"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="wk-form-actions" style={{ marginTop: 18 }}>
              <button type="submit" className="wk-btn wk-btn-primary" disabled={pending}>
                {pending ? "Creating…" : "Create task"}
              </button>
              <button
                type="button"
                className="wk-btn wk-btn-ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="wk-card">
        <div className="wk-card-head">
          <h2 className="wk-card-title">
            {isManager ? "All team tasks" : "My tasks"}
            <span className="wk-card-title-count">{visibleTasks.length}</span>
          </h2>
        </div>

        {visibleTasks.length === 0 ? (
          <div className="wk-empty">
            <span className="wk-empty-icon">
              <ListChecks size={22} strokeWidth={1.8} aria-hidden />
            </span>
            <p className="wk-empty-title">
              {filter === "all" ? "No tasks yet" : `Nothing ${STATUS_LABEL[filter as TaskStatus].toLowerCase()}`}
            </p>
            <p className="wk-empty-text">
              {isManager
                ? "Assign a task, or publish a weekly plan to generate them automatically."
                : "Tasks appear here once your operations manager publishes the weekly plan."}
            </p>
          </div>
        ) : (
          <div className="wk-table-scroll">
            <table className="wk-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Client</th>
                  {isManager ? <th>Assignee</th> : null}
                  <th>Status</th>
                  <th>Priority</th>
                  <th className="wk-table-right">Est.</th>
                  <th>Due</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((task) => {
                  const canEdit = isManager || task.assignedTo === currentUserId;
                  const assignee = memberName.get(task.assignedTo);

                  return (
                    <tr key={task.id}>
                      <td>
                        <span className="wk-cell-title">{task.title}</span>
                        {task.description ? (
                          <span className="wk-cell-sub">{task.description}</span>
                        ) : null}
                        {task.serviceCategoryId ? (
                          <span className="wk-cell-sub">
                            {serviceName.get(task.serviceCategoryId)}
                          </span>
                        ) : null}
                      </td>
                      <td>{clientName.get(task.clientId) ?? "—"}</td>
                      {isManager ? (
                        <td>
                          {assignee ? (
                            <span className="wk-person">
                              <span className="wk-person-avatar" aria-hidden>
                                {initials(assignee)}
                              </span>
                              <span className="wk-person-name">{assignee}</span>
                            </span>
                          ) : (
                            <span className="wk-cell-muted">—</span>
                          )}
                        </td>
                      ) : null}
                      <td>
                        <span className={`wk-badge wk-badge-${task.status}`}>
                          <span className="wk-badge-dot" aria-hidden />
                          {STATUS_LABEL[task.status]}
                        </span>
                      </td>
                      <td>
                        <span className={`wk-badge wk-badge-${task.priority}`}>
                          {PRIORITY_LABEL[task.priority]}
                        </span>
                      </td>
                      <td className="wk-table-right wk-table-num">
                        {task.estimatedHours != null
                          ? formatHours(task.estimatedHours)
                          : "—"}
                      </td>
                      <td className="wk-table-num wk-cell-muted">
                        {task.dueDate ?? "—"}
                      </td>
                      <td>
                        <span className="wk-table-actions">
                          {canEdit && task.status === "todo" ? (
                            <button
                              type="button"
                              className="wk-text-btn is-accent"
                              disabled={pending}
                              onClick={() => handleStatus(task.id, "in_progress")}
                            >
                              Start
                            </button>
                          ) : null}
                          {canEdit && task.status !== "done" ? (
                            <button
                              type="button"
                              className="wk-text-btn"
                              disabled={pending}
                              onClick={() => handleStatus(task.id, "done")}
                            >
                              Complete
                            </button>
                          ) : null}
                          {canEdit && task.status === "done" ? (
                            <button
                              type="button"
                              className="wk-text-btn"
                              disabled={pending}
                              onClick={() => handleStatus(task.id, "todo")}
                            >
                              Reopen
                            </button>
                          ) : null}
                          {isManager ? (
                            <button
                              type="button"
                              className="wk-text-btn is-danger"
                              disabled={pending}
                              onClick={() => handleDelete(task.id)}
                              aria-label="Delete task"
                              title="Delete task"
                            >
                              <Trash2 size={14} strokeWidth={2} aria-hidden />
                            </button>
                          ) : null}
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
