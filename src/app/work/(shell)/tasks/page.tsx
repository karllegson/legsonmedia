import { TasksManager } from "@/components/work/TasksManager";
import { getWorkSession } from "@/lib/work/auth.server";
import { listActiveClients, listServiceCategories } from "@/lib/work/clients.server";
import { isManagerRole } from "@/lib/work/roles";
import { listTeamMembers } from "@/lib/work/planning.server";
import { listAllTasks, listTasksForUser } from "@/lib/work/tasks.server";

export default async function WorkTasksPage() {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  const isManager = isManagerRole(session.profile.role);

  const [tasks, clients, teamMembers, serviceCategories] = await Promise.all([
    isManager ? listAllTasks() : listTasksForUser(session.userId),
    listActiveClients(),
    isManager ? listTeamMembers() : Promise.resolve([]),
    listServiceCategories(),
  ]);

  return (
    <TasksManager
      tasks={tasks}
      clients={clients}
      teamMembers={teamMembers}
      serviceCategories={serviceCategories}
      isManager={isManager}
      currentUserId={session.userId}
    />
  );
}
