"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_DEV_OPT_OUT_COOKIE, isAuthBypassEnabled } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { setPasswordByEmail } from "@/lib/work/planning.server";

async function restoreDevBypass() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_DEV_OPT_OUT_COOKIE);
}

export async function workEnterDevBypass() {
  if (!isAuthBypassEnabled()) {
    redirect("/work/login");
  }

  await restoreDevBypass();
  redirect("/work");
}

export async function workLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Real credentials always win over local bypass so team login / recovery works in dev.
  if (email && password) {
    const supabase = await createClient();
    if (!supabase) {
      redirect("/work/login?setup=1");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(`/work/login?error=${encodeURIComponent(error.message)}`);
    }

    await restoreDevBypass();
    redirect("/work");
  }

  if (isAuthBypassEnabled()) {
    await restoreDevBypass();
    redirect("/work");
  }

  redirect("/work/login?error=Enter+your+email+and+password");
}

export async function workLogout() {
  if (isAuthBypassEnabled()) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_DEV_OPT_OUT_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    redirect("/work/login?logged_out=1");
  }

  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/work/login?logged_out=1");
}

export async function workRequestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!email) {
    redirect("/work/forgot-password?error=Enter+your+email+address");
  }

  if (password.length < 8) {
    redirect(
      "/work/forgot-password?error=Password+must+be+at+least+8+characters",
    );
  }

  if (password !== confirm) {
    redirect("/work/forgot-password?error=Passwords+do+not+match");
  }

  try {
    await setPasswordByEmail({ email, password });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not update password";
    redirect(`/work/forgot-password?error=${encodeURIComponent(message)}`);
  }

  redirect("/work/login?reset=1");
}

export async function workUpdatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    redirect("/work/reset-password?error=Password+must+be+at+least+8+characters");
  }

  if (password !== confirm) {
    redirect("/work/reset-password?error=Passwords+do+not+match");
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect("/work/login?setup=1");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/work/forgot-password?error=Reset+link+expired.+Request+a+new+one.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/work/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/work/login?reset=1");
}
