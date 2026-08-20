import {
  ADMIN_DEV_OPT_OUT_COOKIE,
  bypassAdminUser,
  isAuthBypassEnabled,
  isDevBypassSessionActive,
} from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { isManagerRole, isOwnerRole } from "./roles";
import type { WorkProfile, WorkRole } from "./types";

export class WorkAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkAuthError";
  }
}

/** Nil UUID keeps dev-bypass queries valid against uuid columns while matching no rows. */
const BYPASS_USER_ID = "00000000-0000-0000-0000-000000000000";

function bypassProfile(): WorkProfile {
  return {
    id: BYPASS_USER_ID,
    displayName: bypassAdminUser.displayName,
    role: "owner",
    isActive: true,
  };
}

export async function getWorkSession(): Promise<{
  userId: string;
  email: string | null;
  profile: WorkProfile;
} | null> {
  if (isAuthBypassEnabled()) {
    return {
      userId: bypassProfile().id,
      email: bypassAdminUser.email,
      profile: bypassProfile(),
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("display_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profileRow?.role as WorkRole | undefined) ?? "specialist";

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: {
      id: user.id,
      displayName: profileRow?.display_name ?? null,
      role,
      isActive: profileRow?.is_active ?? true,
    },
  };
}

export async function assertWorkAuth(): Promise<{
  userId: string;
  email: string | null;
  profile: WorkProfile;
}> {
  const session = await getWorkSession();

  if (!session) {
    throw new WorkAuthError("Unauthorized");
  }

  if (!session.profile.isActive) {
    throw new WorkAuthError("Account inactive");
  }

  return session;
}

export async function requireWorkRole(
  ...roles: WorkRole[]
): Promise<{
  userId: string;
  email: string | null;
  profile: WorkProfile;
}> {
  const session = await assertWorkAuth();

  if (!roles.includes(session.profile.role)) {
    throw new WorkAuthError("Forbidden");
  }

  return session;
}

export async function requireWorkManager(): Promise<{
  userId: string;
  email: string | null;
  profile: WorkProfile;
}> {
  const session = await assertWorkAuth();

  if (!isManagerRole(session.profile.role)) {
    throw new WorkAuthError("Forbidden");
  }

  return session;
}

export async function requireCmsAdmin(): Promise<{
  userId: string;
  email: string | null;
  profile: WorkProfile;
}> {
  const session = await assertWorkAuth();

  if (!isOwnerRole(session.profile.role)) {
    throw new WorkAuthError("Forbidden");
  }

  return session;
}

export function isWorkDevBypass(): boolean {
  return isAuthBypassEnabled();
}

export { isDevBypassSessionActive, ADMIN_DEV_OPT_OUT_COOKIE };
