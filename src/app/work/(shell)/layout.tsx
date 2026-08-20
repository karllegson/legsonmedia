import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WorkSidebar } from "@/components/work/WorkSidebar";
import { WorkTopbar } from "@/components/work/WorkTopbar";
import {
  ADMIN_DEV_OPT_OUT_COOKIE,
  isDevBypassSessionActive,
} from "@/lib/admin/auth";
import { getWorkSession } from "@/lib/work/auth.server";
import { getWorkNavForRole } from "@/lib/work/config";
import { countOpenTasksForUser } from "@/lib/work/tasks.server";
import { getOpenTimeEntry } from "@/lib/work/time.server";

export default async function WorkShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const bypass = isDevBypassSessionActive(
    cookieStore.get(ADMIN_DEV_OPT_OUT_COOKIE)?.value,
  );

  const session = await getWorkSession();
  if (!session && !bypass) {
    redirect("/work/login");
  }

  const profile = session?.profile ?? {
    id: "dev",
    displayName: "Dev Admin",
    role: "owner" as const,
    isActive: true,
  };

  const [openEntry, openTaskCount] = session
    ? await Promise.all([
        getOpenTimeEntry(session.userId),
        countOpenTasksForUser(session.userId),
      ])
    : [null, 0];

  return (
    <div className="wk-shell">
      <WorkSidebar
        navItems={getWorkNavForRole(profile.role)}
        displayName={profile.displayName}
        userEmail={session?.email ?? null}
        role={profile.role}
        openTaskCount={openTaskCount}
        isClockedIn={Boolean(openEntry)}
      />
      <div className="wk-main">
        <WorkTopbar activeClientName={openEntry?.clientName ?? null} />
        <div className="wk-content">{children}</div>
      </div>
    </div>
  );
}
