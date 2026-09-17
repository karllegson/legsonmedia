"use client";

import { AlertCircle, Check, CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resolveTimeEditRequestAction } from "@/app/work/(shell)/actions";
import { formatDuration } from "@/lib/work/roles";
import type { TimeEditRequest } from "@/lib/work/timeEditRequests.server";

type TimeEditApprovalsProps = {
  requests: TimeEditRequest[];
};

function describeChange(request: TimeEditRequest) {
  const proposed = formatDuration(
    Math.round(request.proposedHours * 60 + request.proposedMinutes),
  );
  return `${formatDuration(request.currentMinutes)} → ${proposed}`;
}

export function TimeEditApprovals({ requests }: TimeEditApprovalsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function resolve(requestId: string, decision: "approved" | "denied") {
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.set("requestId", requestId);
    formData.set("decision", decision);

    startTransition(async () => {
      const result = await resolveTimeEditRequestAction(formData);
      if (!result.ok) {
        setError(result.error ?? "Could not resolve request");
        return;
      }
      setSuccess(
        decision === "approved" ? "Edit approved and applied." : "Request denied.",
      );
      router.refresh();
    });
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="wk-card" id="time-approvals">
      <div className="wk-card-head">
        <div>
          <h2 className="wk-card-title">
            Edit requests
            <span className="wk-card-title-count">{requests.length}</span>
          </h2>
          <p className="wk-card-sub">
            Approve to apply the new time, or deny to leave the log as-is.
          </p>
        </div>
      </div>

      <div className="wk-card-pad wk-stack">
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

        <div className="wk-table-scroll">
          <table className="wk-table">
            <thead>
              <tr>
                <th>Person</th>
                <th>Client</th>
                <th>Change</th>
                <th>Reason</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.requesterName || "Teammate"}</td>
                  <td>{request.clientName}</td>
                  <td>{describeChange(request)}</td>
                  <td>
                    <div>
                      <div>{request.reason}</div>
                      {request.proposedNotes ? (
                        <div className="wk-cell-muted" style={{ marginTop: 4 }}>
                          Notes: {request.proposedNotes}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="wk-row" style={{ justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="wk-btn wk-btn-primary"
                        disabled={pending}
                        onClick={() => resolve(request.id, "approved")}
                      >
                        <Check size={14} strokeWidth={2} aria-hidden />
                        Approve
                      </button>
                      <button
                        type="button"
                        className="wk-btn wk-btn-ghost"
                        disabled={pending}
                        onClick={() => resolve(request.id, "denied")}
                      >
                        <X size={14} strokeWidth={2} aria-hidden />
                        Deny
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
