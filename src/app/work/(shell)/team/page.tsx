import { redirect } from "next/navigation";
import { TeamView } from "@/components/work/TeamView";
import { getWorkSession, requireWorkManager } from "@/lib/work/auth.server";
import { isOwnerRole } from "@/lib/work/roles";
import { listTeamMembersWithEmail } from "@/lib/work/planning.server";
import { listActiveClockIns } from "@/lib/work/time.server";

export default async function WorkTeamPage() {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  try {
    await requireWorkManager();
  } catch {
    redirect("/work");
  }

  const [members, activeClockIns] = await Promise.all([
    listTeamMembersWithEmail(),
    listActiveClockIns(),
  ]);

  return (
    <TeamView
      members={members}
      activeClockIns={activeClockIns}
      canManageRoles={isOwnerRole(session.profile.role)}
    />
  );
}
