import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Exchanges the auth code / token from Supabase email links
 * (password recovery, etc.) then redirects into the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/work";
  const safeNext = next.startsWith("/work") ? next : "/work";

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(
      `${origin}/work/forgot-password?error=${encodeURIComponent(
        "Supabase is not configured.",
      )}`,
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/work/forgot-password?error=${encodeURIComponent(
      "Reset link is invalid or expired. Request a new one.",
    )}`,
  );
}
