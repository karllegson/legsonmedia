/** Local `next dev` only. Set BYPASS_ADMIN_AUTH=false to test real login locally. */
export function isAuthBypassEnabled() {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  const flag = process.env.BYPASS_ADMIN_AUTH?.trim().toLowerCase();
  return flag !== "false" && flag !== "0";
}

export const ADMIN_DEV_OPT_OUT_COOKIE = "admin_dev_opt_out";

export const bypassAdminUser = {
  email: "dev@local.test",
  displayName: "Dev Admin",
} as const;

export function hasDevBypassOptOut(
  cookieValue: string | undefined | null,
): boolean {
  return cookieValue === "1";
}

/** Dev bypass is on and the user has not chosen to log out for this browser session. */
export function isDevBypassSessionActive(
  cookieValue: string | undefined | null,
): boolean {
  return isAuthBypassEnabled() && !hasDevBypassOptOut(cookieValue);
}
