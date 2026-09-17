"use client";

import {
  AlertCircle,
  Briefcase,
  Building2,
  Clock3,
  DollarSign,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveClientAction } from "@/app/work/(shell)/actions";
import { formatCurrency, formatHours, isOwnerRole } from "@/lib/work/roles";
import type { ClientWithRetainer, WorkRole } from "@/lib/work/types";

type ClientsManagerProps = {
  clients: ClientWithRetainer[];
  role: WorkRole;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ClientsManager({ clients, role }: ClientsManagerProps) {
  const isOwner = isOwnerRole(role);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ClientWithRetainer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState("");
  const [slugValue, setSlugValue] = useState("");

  const totalWeeklyHours = clients.reduce(
    (sum, client) => sum + (client.retainer?.hoursPerWeek ?? 0),
    0,
  );
  const totalWeeklyValue = clients.reduce(
    (sum, client) =>
      sum +
      (client.retainer
        ? client.retainer.hoursPerWeek * client.retainer.hourlyRate
        : 0),
    0,
  );

  function openCreate() {
    setEditing(null);
    setNameValue("");
    setSlugValue("");
    setShowForm(true);
  }

  function openEdit(client: ClientWithRetainer) {
    setEditing(client);
    setNameValue(client.name);
    setSlugValue(client.slug);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setError(null);
  }

  function handleSave(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveClientAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not save client");
        return;
      }
      closeForm();
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

      <section className="wk-stats">
        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Clients on retainer</span>
            <span className="wk-stat-icon is-accent">
              <Briefcase size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">{clients.filter((c) => c.isActive).length}</p>
        </article>

        <article className="wk-stat">
          <div className="wk-stat-top">
            <span className="wk-stat-label">Contracted hours / week</span>
            <span className="wk-stat-icon is-blue">
              <Building2 size={16} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="wk-stat-value">
            {totalWeeklyHours.toFixed(1)}
            <small>h</small>
          </p>
        </article>

        {isOwner ? (
          <article className="wk-stat">
            <div className="wk-stat-top">
              <span className="wk-stat-label">Weekly retainer value</span>
              <span className="wk-stat-icon is-green">
                <DollarSign size={16} strokeWidth={2} aria-hidden />
              </span>
            </div>
            <p className="wk-stat-value">{formatCurrency(totalWeeklyValue)}</p>
          </article>
        ) : null}
      </section>

      <div className="wk-row-between">
        <p className="wk-section-title" style={{ marginBottom: 0 }}>
          Client roster
        </p>
        {showForm ? (
          <button type="button" className="wk-btn wk-btn-ghost" onClick={closeForm}>
            <X size={15} strokeWidth={2} aria-hidden />
            Cancel
          </button>
        ) : (
          <button type="button" className="wk-btn wk-btn-dark" onClick={openCreate}>
            <Plus size={15} strokeWidth={2.2} aria-hidden />
            Add client
          </button>
        )}
      </div>

      {showForm ? (
        <section className="wk-card">
          <div className="wk-card-head">
            <div>
              <h2 className="wk-card-title">
                {editing ? `Edit ${editing.name}` : "New client"}
              </h2>
              <p className="wk-card-sub">
                {isOwner
                  ? "Setting hours or rate creates a new retainer period from today."
                  : "Setting hours creates a new retainer period from today."}
              </p>
            </div>
          </div>

          <form action={handleSave} className="wk-card-pad">
            <input type="hidden" name="id" value={editing?.id ?? ""} />

            <div className="wk-form-grid">
              <div className="wk-field">
                <label className="wk-label" htmlFor="client-name">
                  Client name
                </label>
                <input
                  className="wk-input"
                  id="client-name"
                  name="name"
                  value={nameValue}
                  onChange={(event) => {
                    setNameValue(event.target.value);
                    if (!editing) {
                      setSlugValue(slugify(event.target.value));
                    }
                  }}
                  placeholder="Elite Builders"
                  required
                />
              </div>

              <div className="wk-field">
                <label className="wk-label" htmlFor="client-slug">
                  Slug
                </label>
                <input
                  className="wk-input"
                  id="client-slug"
                  name="slug"
                  value={slugValue}
                  onChange={(event) => setSlugValue(event.target.value)}
                  placeholder="elite-builders"
                  required
                />
              </div>

              <div className="wk-field">
                <label className="wk-label" htmlFor="client-hours">
                  Hours per week
                </label>
                <input
                  className="wk-input"
                  id="client-hours"
                  name="hoursPerWeek"
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue={editing?.retainer?.hoursPerWeek ?? ""}
                  placeholder="20"
                />
              </div>

              {isOwner ? (
                <div className="wk-field">
                  <label className="wk-label" htmlFor="client-rate">
                    Hourly rate (USD)
                  </label>
                  <input
                    className="wk-input"
                    id="client-rate"
                    name="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editing?.retainer?.hourlyRate ?? ""}
                    placeholder="30"
                  />
                </div>
              ) : null}

              <div className="wk-field wk-form-full">
                <label className="wk-label" htmlFor="client-notes">
                  Notes <span className="wk-label-hint">(optional)</span>
                </label>
                <textarea
                  className="wk-textarea"
                  id="client-notes"
                  name="notes"
                  rows={2}
                  defaultValue={editing?.notes ?? ""}
                  placeholder="Scope, contacts, or anything the team should know"
                />
              </div>
            </div>

            <div className="wk-form-actions" style={{ marginTop: 18 }}>
              <button type="submit" className="wk-btn wk-btn-primary" disabled={pending}>
                {pending ? "Saving…" : editing ? "Save changes" : "Create client"}
              </button>
              <button type="button" className="wk-btn wk-btn-ghost" onClick={closeForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {clients.length === 0 ? (
        <section className="wk-card">
          <div className="wk-empty">
            <span className="wk-empty-icon">
              <Briefcase size={22} strokeWidth={1.8} aria-hidden />
            </span>
            <p className="wk-empty-title">No clients yet</p>
            <p className="wk-empty-text">
              Add your first client and set their weekly retainer to start
              planning hours.
            </p>
            <div className="wk-empty-actions">
              <button type="button" className="wk-btn wk-btn-primary" onClick={openCreate}>
                <Plus size={15} strokeWidth={2.2} aria-hidden />
                Add client
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="wk-tiles">
          {clients.map((client) => (
            <article key={client.id} className="wk-tile">
              <div className="wk-tile-head">
                <span className="wk-stat-icon is-accent">
                  <Building2 size={16} strokeWidth={2} aria-hidden />
                </span>
                <span
                  className={`wk-badge ${
                    client.isActive ? "wk-badge-done" : "wk-badge-danger"
                  }`}
                >
                  {client.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <h3 className="wk-tile-title">
                <Link
                  href={`/work/clients/${client.slug}`}
                  className="wk-tile-title-link"
                >
                  {client.name}
                </Link>
              </h3>

              {client.retainer ? (
                <div className="wk-metrics" style={{ marginTop: 14 }}>
                  <span>
                    <span className="wk-metric-label">Hours / wk</span>
                    <span className="wk-metric-value">
                      {formatHours(client.retainer.hoursPerWeek)}
                    </span>
                  </span>
                  {isOwner ? (
                    <>
                      <span>
                        <span className="wk-metric-label">Rate</span>
                        <span className="wk-metric-value">
                          {formatCurrency(client.retainer.hourlyRate)}
                        </span>
                      </span>
                      <span>
                        <span className="wk-metric-label">Weekly</span>
                        <span className="wk-metric-value">
                          {formatCurrency(
                            client.retainer.hoursPerWeek *
                              client.retainer.hourlyRate,
                          )}
                        </span>
                      </span>
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="wk-muted" style={{ marginTop: 12 }}>
                  No retainer set yet
                </p>
              )}

              {client.notes ? (
                <p className="wk-muted" style={{ marginTop: 12 }}>
                  {client.notes}
                </p>
              ) : null}

              <div className="wk-row" style={{ marginTop: 16 }}>
                <Link
                  href={`/work/clients/${client.slug}`}
                  className="wk-btn wk-btn-primary"
                >
                  <Clock3 size={15} strokeWidth={2} aria-hidden />
                  Weekly hours
                </Link>
                <button
                  type="button"
                  className="wk-btn wk-btn-ghost"
                  onClick={() => openEdit(client)}
                >
                  Edit retainer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
