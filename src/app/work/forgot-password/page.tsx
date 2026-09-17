import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { workRequestPasswordReset } from "@/app/work/actions";
import { WorkAuthShell } from "@/components/work/WorkAuthShell";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    setup?: string;
  }>;
};

export default async function WorkForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <WorkAuthShell
      title="Set a new password"
      subtitle="No email link — set a new password for your @legsonmedia.com account here."
    >
      {!configured && (
        <div className="wk-alert wk-alert-warn" style={{ marginTop: 20 }}>
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>
            Supabase is not configured yet. Add your project URL and publishable
            key to your environment.
          </span>
        </div>
      )}

      {params.error && (
        <div className="wk-alert wk-alert-error" style={{ marginTop: 20 }}>
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>{params.error}</span>
        </div>
      )}

      <form action={workRequestPasswordReset}>
        <div className="wk-auth-fields">
          <div className="wk-field">
            <label className="wk-label" htmlFor="email">
              Email address
            </label>
            <input
              className="wk-input"
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@legsonmedia.com"
              required
              disabled={!configured}
            />
          </div>

          <div className="wk-field">
            <label className="wk-label" htmlFor="password">
              New password
            </label>
            <input
              className="wk-input"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              required
              disabled={!configured}
            />
          </div>

          <div className="wk-field">
            <label className="wk-label" htmlFor="confirm">
              Confirm password
            </label>
            <input
              className="wk-input"
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              minLength={8}
              required
              disabled={!configured}
            />
          </div>

          <button
            type="submit"
            className="wk-btn wk-btn-primary wk-btn-lg wk-btn-block"
            disabled={!configured}
          >
            Update password
          </button>
        </div>
      </form>

      <p className="wk-auth-help">
        <Link href="/work/login" className="wk-link">
          <ArrowLeft size={14} strokeWidth={2.2} aria-hidden />
          Back to sign in
        </Link>
      </p>
    </WorkAuthShell>
  );
}
