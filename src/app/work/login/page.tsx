import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { workEnterDevBypass, workLogin } from "@/app/work/actions";
import { WorkAuthShell } from "@/components/work/WorkAuthShell";
import { isAuthBypassEnabled } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    setup?: string;
    logged_out?: string;
    reset?: string;
  }>;
};

export default async function WorkLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const bypass = isAuthBypassEnabled();

  return (
    <WorkAuthShell
      title="Sign in"
      subtitle="Use your Legson Media work email."
    >
      {!configured && (
        <div className="wk-alert wk-alert-warn" style={{ marginTop: 20 }}>
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>
            Supabase is not configured yet. Add your project URL and publishable
            key to <code>.env.local</code>.
          </span>
        </div>
      )}

      {params.logged_out && (
        <div className="wk-alert wk-alert-success" style={{ marginTop: 20 }}>
          <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
          <span>You have been signed out.</span>
        </div>
      )}

      {params.reset && (
        <div className="wk-alert wk-alert-success" style={{ marginTop: 20 }}>
          <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
          <span>Password updated. Sign in with your new password.</span>
        </div>
      )}

      {params.error && (
        <div className="wk-alert wk-alert-error" style={{ marginTop: 20 }}>
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>{params.error}</span>
        </div>
      )}

      {bypass && (
        <form action={workEnterDevBypass} className="wk-auth-fields">
          <div className="wk-alert wk-alert-info">
            <AlertCircle size={16} strokeWidth={2} aria-hidden />
            <span>
              Local bypass is on. Continue without a password, or sign in with
              your real work account below.
            </span>
          </div>
          <button
            type="submit"
            className="wk-btn wk-btn-primary wk-btn-lg wk-btn-block"
          >
            Continue as Dev Admin
          </button>
        </form>
      )}

      <form action={workLogin}>
        <div className="wk-auth-fields">
          {bypass ? (
            <p className="wk-auth-sub" style={{ margin: 0 }}>
              Or sign in with email
            </p>
          ) : null}

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
            <div className="wk-row-between">
              <label className="wk-label" htmlFor="password">
                Password
              </label>
              <Link
                href="/work/forgot-password"
                className="wk-text-btn is-accent"
              >
                Forgot password?
              </Link>
            </div>
            <input
              className="wk-input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={!configured}
            />
          </div>

          <button
            type="submit"
            className="wk-btn wk-btn-primary wk-btn-lg wk-btn-block"
            disabled={!configured}
          >
            Sign in to Work Portal
          </button>
        </div>
      </form>

      <p className="wk-auth-help">
        {bypass
          ? "Dev bypass only appears on localhost in development."
          : "Need an account? Ask ops to add you."}
      </p>
    </WorkAuthShell>
  );
}
