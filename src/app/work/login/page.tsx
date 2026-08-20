import { AlertCircle, BarChart3, CheckCircle2, ListChecks, Timer } from "lucide-react";
import { workEnterDevBypass, workLogin } from "@/app/work/actions";
import { isAuthBypassEnabled } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; setup?: string; logged_out?: string }>;
};

export default async function WorkLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const bypass = isAuthBypassEnabled();

  return (
    <div className="wk-auth">
      <aside className="wk-auth-aside">
        <div className="wk-auth-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" />
          <span>
            <span className="wk-auth-brand-name">Legson Media</span>
            <br />
            <span className="wk-auth-brand-sub">Work Portal</span>
          </span>
        </div>

        <div>
          <h2 className="wk-auth-headline">
            Track the work. <em>Protect the retainer.</em>
          </h2>
          <p className="wk-auth-copy">
            One place for the team to clock hours against each client, work
            through assigned tasks, and keep every retainer on budget.
          </p>

          <ul className="wk-auth-features">
            <li>
              <span className="wk-auth-feature-icon">
                <Timer size={15} strokeWidth={2} aria-hidden />
              </span>
              Clock in per client with a live timer
            </li>
            <li>
              <span className="wk-auth-feature-icon">
                <ListChecks size={15} strokeWidth={2} aria-hidden />
              </span>
              See exactly which tasks are yours this week
            </li>
            <li>
              <span className="wk-auth-feature-icon">
                <BarChart3 size={15} strokeWidth={2} aria-hidden />
              </span>
              Utilization and billing summaries for every client
            </li>
          </ul>
        </div>

        <p className="wk-auth-foot">
          Internal tool &middot; Authorized team members only
        </p>
      </aside>

      <main className="wk-auth-panel">
        <div className="wk-auth-form">
          <div className="wk-auth-mobile-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" />
            <span>
              <span className="wk-auth-brand-name">Legson Media</span>
              <br />
              <span className="wk-topbar-eyebrow">Work Portal</span>
            </span>
          </div>

          <h1 className="wk-auth-title">Sign in</h1>
          <p className="wk-auth-sub">
            Use the email your operations manager set up for you.
          </p>

          {!configured && (
            <div className="wk-alert wk-alert-warn" style={{ marginTop: 20 }}>
              <AlertCircle size={16} strokeWidth={2} aria-hidden />
              <span>
                Supabase is not configured yet. Add your project URL and
                publishable key to <code>.env.local</code>.
              </span>
            </div>
          )}

          {params.logged_out && (
            <div className="wk-alert wk-alert-success" style={{ marginTop: 20 }}>
              <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
              <span>You have been signed out.</span>
            </div>
          )}

          {params.error && !bypass && (
            <div className="wk-alert wk-alert-error" style={{ marginTop: 20 }}>
              <AlertCircle size={16} strokeWidth={2} aria-hidden />
              <span>{params.error}</span>
            </div>
          )}

          {bypass ? (
            <form action={workEnterDevBypass} className="wk-auth-fields">
              <div className="wk-alert wk-alert-info">
                <AlertCircle size={16} strokeWidth={2} aria-hidden />
                <span>
                  Supabase is unreachable from this machine. Use local bypass
                  instead of email/password.
                </span>
              </div>
              <button
                type="submit"
                className="wk-btn wk-btn-primary wk-btn-lg wk-btn-block"
              >
                Continue as Dev Admin
              </button>
            </form>
          ) : (
            <form action={workLogin}>
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
                    Password
                  </label>
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
          )}

          <p className="wk-auth-help">
            {bypass
              ? "This button only appears on localhost with BYPASS_ADMIN_AUTH=true."
              : "Need access? Ask your operations manager to create your account."}
          </p>
        </div>
      </main>
    </div>
  );
}
