"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_DEV_OPT_OUT_COOKIE, isAuthBypassEnabled } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

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
  if (isAuthBypassEnabled()) {
    await restoreDevBypass();
    redirect("/work");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  if (!supabase) {
    redirect("/work/login?setup=1");
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/work/login?error=${encodeURIComponent(error.message)}`);
  }

  await restoreDevBypass();
  redirect("/work");
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
