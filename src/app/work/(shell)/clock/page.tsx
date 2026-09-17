import { ClockPanel } from "@/components/work/ClockPanel";
import { LogTimeCard } from "@/components/work/LogTimeCard";
import { TimeEditApprovals } from "@/components/work/TimeEditApprovals";
import { TimeEntriesPanel } from "@/components/work/TimeEntriesPanel";
import { getWorkSession } from "@/lib/work/auth.server";
import { listActiveClients, listServiceCategories } from "@/lib/work/clients.server";
import { listActiveTeammates } from "@/lib/work/messages.server";
import { sumAllocatedHoursForUser } from "@/lib/work/planning.server";
import { getMondayOfWeek, isOwnerRole, minutesToHours } from "@/lib/work/roles";
import { listAllTasks, listTasksForUser } from "@/lib/work/tasks.server";
import {
  getActiveClockSession,
  listAllTimeEntries,
  listRecentClosedEntriesForUser,
  sumLoggedMinutesForUser,
} from "@/lib/work/time.server";
import {
  listPendingTimeEditRequests,
  listTimeEditRequestsForUser,
} from "@/lib/work/timeEditRequests.server";

export default async function WorkClockPage() {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  const weekStart = getMondayOfWeek();
  const isOwner = isOwnerRole(session.profile.role);

  const [
    openEntry,
    clients,
    serviceCategories,
    myTasks,
    allTasks,
    loggedMinutes,
    allocatedHours,
    teammates,
    myEntries,
    allEntries,
    pendingRequests,
    myRequests,
  ] = await Promise.all([
    getActiveClockSession(session.userId),
    listActiveClients(),
    listServiceCategories(),
    listTasksForUser(session.userId),
    listAllTasks().catch(() => []),
    sumLoggedMinutesForUser(session.userId, weekStart),
    sumAllocatedHoursForUser(session.userId, weekStart),
    listActiveTeammates().catch(() => []),
    listRecentClosedEntriesForUser(session.userId, 25),
    isOwner
      ? listAllTimeEntries(weekStart).then((rows) =>
          rows
            .filter((row) => row.clockOut)
            .map((row) => ({
              ...row,
              taskTitle: null as string | null,
            })),
        )
      : Promise.resolve([]),
    isOwner ? listPendingTimeEditRequests() : Promise.resolve([]),
    listTimeEditRequestsForUser(session.userId),
  ]);

  const logTasks = allTasks.length > 0 ? allTasks : myTasks;
  const entries = isOwner ? allEntries : myEntries;

  return (
    <div className="wk-stack">
      <ClockPanel
        openEntry={openEntry}
        clients={clients}
        tasks={myTasks.filter((task) => task.status !== "done")}
        serviceCategories={serviceCategories}
        loggedHoursThisWeek={minutesToHours(loggedMinutes)}
        allocatedHoursThisWeek={allocatedHours}
      />
      {isOwner ? <TimeEditApprovals requests={pendingRequests} /> : null}
      <TimeEntriesPanel
        entries={entries}
        role={session.profile.role}
        myRequests={myRequests}
        showPerson={isOwner}
      />
      <LogTimeCard
        clients={clients}
        teammates={teammates}
        tasks={logTasks}
        currentUserId={session.userId}
      />
    </div>
  );
}
