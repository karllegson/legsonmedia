import { redirect } from "next/navigation";
import { PlanningManager } from "@/components/work/PlanningManager";
import { getWorkSession, requireWorkManager } from "@/lib/work/auth.server";
import { listClientsWithRetainers, listServiceCategories } from "@/lib/work/clients.server";
import { getMondayOfWeek } from "@/lib/work/roles";
import {
  getOrCreateWeeklyPlan,
  listAllocations,
  listPlanLines,
  listTeamMembers,
} from "@/lib/work/planning.server";

type PlanningPageProps = {
  searchParams: Promise<{ client?: string; week?: string }>;
};

export default async function WorkPlanningPage({ searchParams }: PlanningPageProps) {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  try {
    await requireWorkManager();
  } catch {
    redirect("/work");
  }

  const params = await searchParams;
  const clients = await listClientsWithRetainers();
  const activeClients = clients.filter((c) => c.isActive);
  const selectedClientId = params.client ?? activeClients[0]?.id ?? "";
  const weekStart = params.week ?? getMondayOfWeek();

  const [serviceCategories, teamMembers, plan] = await Promise.all([
    listServiceCategories(),
    listTeamMembers(),
    selectedClientId
      ? getOrCreateWeeklyPlan(selectedClientId, weekStart)
      : Promise.resolve(null),
  ]);

  const [planLines, allocations] = plan
    ? await Promise.all([
        listPlanLines(plan.id),
        listAllocations(plan.id),
      ])
    : [[], []];

  return (
    <PlanningManager
      clients={activeClients}
      serviceCategories={serviceCategories}
      teamMembers={teamMembers}
      selectedClientId={selectedClientId}
      weekStart={weekStart}
      plan={plan}
      planLines={planLines}
      allocations={allocations}
    />
  );
}
