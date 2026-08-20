import { ClockPanel } from "@/components/work/ClockPanel";
import { getWorkSession } from "@/lib/work/auth.server";
import { listActiveClients, listServiceCategories } from "@/lib/work/clients.server";
import { sumAllocatedHoursForUser } from "@/lib/work/planning.server";
import { getMondayOfWeek, minutesToHours } from "@/lib/work/roles";
import { listTasksForUser } from "@/lib/work/tasks.server";
import { getOpenTimeEntry, sumLoggedMinutesForUser } from "@/lib/work/time.server";

export default async function WorkClockPage() {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  const weekStart = getMondayOfWeek();

  const [
    openEntry,
    clients,
    serviceCategories,
    tasks,
    loggedMinutes,
    allocatedHours,
  ] = await Promise.all([
    getOpenTimeEntry(session.userId),
    listActiveClients(),
    listServiceCategories(),
    listTasksForUser(session.userId),
    sumLoggedMinutesForUser(session.userId, weekStart),
    sumAllocatedHoursForUser(session.userId, weekStart),
  ]);

  return (
    <ClockPanel
      openEntry={openEntry}
      clients={clients}
      tasks={tasks.filter((task) => task.status !== "done")}
      serviceCategories={serviceCategories}
      loggedHoursThisWeek={minutesToHours(loggedMinutes)}
      allocatedHoursThisWeek={allocatedHours}
    />
  );
}
