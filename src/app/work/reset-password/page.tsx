import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { workUpdatePassword } from "@/app/work/actions";
import { WorkAuthShell } from "@/components/work/WorkAuthShell";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function WorkResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  if (!configured) {
    redirect("/work/login?setup=1");
  }

  // Use the real Supabase session from the email link — not the local
  // dev-bypass profile, which would falsely look like a signed-in user.
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) {
    redirect(
      "/work/forgot-password?error=Reset+link+expired.+Request+a+new+one.",
    );
  }

  return (
    <WorkAuthShell
      title="Set new password"
      subtitle={`Choose a new password for ${user.email ?? "your account"}.`}
    >
      {params.error && (
        <div className="wk-alert wk-alert-error" style={{ marginTop: 20 }}>
          <AlertCircle size={16} strokeWidth={2} aria-hidden />
          <span>{params.error}</span>
        </div>
      )}

      <form action={workUpdatePassword}>
        <div className="wk-auth-fields">
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
            />
          </div>

          <button
            type="submit"
            className="wk-btn wk-btn-primary wk-btn-lg wk-btn-block"
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
