"use server";

import { revalidatePath } from "next/cache";
import {
  assertWorkAuth,
  requireCmsAdmin,
  requireWorkManager,
} from "@/lib/work/auth.server";
import { upsertClient, upsertRetainer } from "@/lib/work/clients.server";
import { isManagerRole, WORK_ROLES, canManageWorkRoles } from "@/lib/work/roles";
import {
  bulkCreateTasksFromPlan,
  createTask,
  deleteTask,
  updateTaskStatus,
} from "@/lib/work/tasks.server";
import { clockIn, clockOut } from "@/lib/work/time.server";
import {
  deleteAllocation,
  deletePlanLine,
  getOrCreateWeeklyPlan,
  publishWeeklyPlan,
  updateProfileRole,
  upsertAllocation,
  upsertPlanLine,
  createTeamMember,
  setTeamMemberPassword,
} from "@/lib/work/planning.server";
import {
  createGroupChat,
  deleteGroupChat,
  markThreadRead,
  sendThreadMessage,
} from "@/lib/work/messages.server";
import type { TaskPriority, TaskStatus } from "@/lib/work/types";

export async function clockInAction(formData: FormData) {
  const session = await assertWorkAuth();
  const clientId = String(formData.get("clientId") ?? "");
  const taskId = String(formData.get("taskId") ?? "") || undefined;
  const serviceCategoryId =
    String(formData.get("serviceCategoryId") ?? "") || undefined;

  if (!clientId) {
    return { ok: false, error: "Select a client" };
  }

  try {
    await clockIn({
      userId: session.userId,
      clientId,
      taskId,
      serviceCategoryId,
    });
    revalidatePath("/work");
    revalidatePath("/work/clock");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Clock in failed",
    };
  }
}

export async function clockOutAction(formData: FormData) {
  const session = await assertWorkAuth();
  const notes = String(formData.get("notes") ?? "");

  try {
    await clockOut({ userId: session.userId, notes });
    revalidatePath("/work");
    revalidatePath("/work/clock");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Clock out failed",
    };
  }
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const session = await assertWorkAuth();

  try {
    await updateTaskStatus(
      taskId,
      status,
      session.userId,
      isManagerRole(session.profile.role),
    );
    revalidatePath("/work/tasks");
    revalidatePath("/work");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function createTaskAction(formData: FormData) {
  await requireWorkManager();

  const clientId = String(formData.get("clientId") ?? "");
  const assignedTo = String(formData.get("assignedTo") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const serviceCategoryId =
    String(formData.get("serviceCategoryId") ?? "") || undefined;
  const estimatedHours = Number(formData.get("estimatedHours") || 0) || undefined;
  const dueDate = String(formData.get("dueDate") ?? "") || undefined;
  const priority = (String(formData.get("priority") ?? "normal") ||
    "normal") as TaskPriority;

  if (!clientId || !assignedTo || !title) {
    return { ok: false, error: "Client, assignee, and title are required" };
  }

  try {
    await createTask({
      clientId,
      assignedTo,
      title,
      description,
      serviceCategoryId,
      estimatedHours,
      dueDate,
      priority,
    });
    revalidatePath("/work/tasks");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Create failed",
    };
  }
}

export async function deleteTaskAction(taskId: string) {
  await requireWorkManager();

  try {
    await deleteTask(taskId);
    revalidatePath("/work/tasks");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

export async function saveClientAction(formData: FormData) {
  await requireWorkManager();

  const id = String(formData.get("id") ?? "") || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const hoursPerWeek = Number(formData.get("hoursPerWeek") || 0);
  const hourlyRate = Number(formData.get("hourlyRate") || 0);

  if (!name || !slug) {
    return { ok: false, error: "Name and slug are required" };
  }

  try {
    const client = await upsertClient({ id, name, slug, notes });
    if (hoursPerWeek > 0) {
      await upsertRetainer({
        clientId: client.id,
        hoursPerWeek,
        hourlyRate: hourlyRate || 0,
      });
    }
    revalidatePath("/work/clients");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed",
    };
  }
}

export async function savePlanLineAction(formData: FormData) {
  await requireWorkManager();

  const weeklyPlanId = String(formData.get("weeklyPlanId") ?? "");
  const serviceCategoryId = String(formData.get("serviceCategoryId") ?? "");
  const plannedHours = Number(formData.get("plannedHours") || 0);

  if (!weeklyPlanId || !serviceCategoryId) {
    return { ok: false, error: "Missing plan or service" };
  }

  try {
    if (plannedHours <= 0) {
      const lineId = String(formData.get("lineId") ?? "");
      if (lineId) {
        await deletePlanLine(lineId);
      }
    } else {
      await upsertPlanLine({ weeklyPlanId, serviceCategoryId, plannedHours });
    }
    revalidatePath("/work/planning");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed",
    };
  }
}

export async function saveAllocationAction(formData: FormData) {
  await requireWorkManager();

  const weeklyPlanId = String(formData.get("weeklyPlanId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const serviceCategoryId = String(formData.get("serviceCategoryId") ?? "");
  const allocatedHours = Number(formData.get("allocatedHours") || 0);
  const allocationId = String(formData.get("allocationId") ?? "");

  if (!weeklyPlanId || !userId || !serviceCategoryId) {
    return { ok: false, error: "Missing allocation fields" };
  }

  try {
    if (allocatedHours <= 0 && allocationId) {
      await deleteAllocation(allocationId);
    } else if (allocatedHours > 0) {
      await upsertAllocation({
        weeklyPlanId,
        userId,
        serviceCategoryId,
        allocatedHours,
      });
    }
    revalidatePath("/work/planning");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed",
    };
  }
}

export async function publishPlanAction(formData: FormData) {
  await requireWorkManager();

  const weeklyPlanId = String(formData.get("weeklyPlanId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const weekStart = String(formData.get("weekStart") ?? "");

  if (!weeklyPlanId) {
    return { ok: false, error: "Missing plan" };
  }

  try {
    await publishWeeklyPlan(weeklyPlanId);
    revalidatePath("/work/planning");
    revalidatePath("/work/tasks");

    const generateTasks = formData.get("generateTasks") === "1";
    if (generateTasks) {
      const plan = await getOrCreateWeeklyPlan(clientId, weekStart);
      const { listAllocations } = await import("@/lib/work/planning.server");
      const { listServiceCategories } = await import("@/lib/work/clients.server");
      const allocations = await listAllocations(plan.id);
      const categories = await listServiceCategories();
      const catName = new Map(categories.map((c) => [c.id, c.name]));

      await bulkCreateTasksFromPlan({
        weeklyPlanId: plan.id,
        clientId,
        tasks: allocations.map((a) => ({
          assignedTo: a.userId,
          serviceCategoryId: a.serviceCategoryId,
          title: `${catName.get(a.serviceCategoryId) ?? "Work"} — week of ${weekStart}`,
          estimatedHours: a.allocatedHours,
        })),
      });
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Publish failed",
    };
  }
}

export async function updateMemberRoleAction(formData: FormData) {
  // Role changes are locked to karl@legsonmedia.com (owner).
  const session = await requireCmsAdmin();
  if (!canManageWorkRoles(session.email, session.profile.role)) {
    return { ok: false, error: "Only the owner can change roles." };
  }

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !role) {
    return { ok: false, error: "Missing fields" };
  }

  if (!WORK_ROLES.includes(role as (typeof WORK_ROLES)[number])) {
    return { ok: false, error: "Invalid role" };
  }

  try {
    await updateProfileRole(userId, role as (typeof WORK_ROLES)[number]);
    revalidatePath("/work/team");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

export async function createTeamMemberAction(formData: FormData) {
  const session = await requireCmsAdmin();
  if (!canManageWorkRoles(session.email, session.profile.role)) {
    return { ok: false, error: "Only the owner can add team accounts." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "specialist");

  if (!email) {
    return { ok: false, error: "Enter an email address" };
  }

  if (!WORK_ROLES.includes(role as (typeof WORK_ROLES)[number])) {
    return { ok: false, error: "Invalid role" };
  }

  try {
    await createTeamMember({
      email,
      password,
      displayName: displayName || undefined,
      role: role as (typeof WORK_ROLES)[number],
    });
    revalidatePath("/work/team");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not create account",
    };
  }
}

export async function setMemberPasswordAction(formData: FormData) {
  const session = await requireCmsAdmin();
  if (!canManageWorkRoles(session.email, session.profile.role)) {
    return { ok: false, error: "Only the owner can reset passwords." };
  }

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!userId) {
    return { ok: false, error: "Missing user" };
  }

  try {
    await setTeamMemberPassword({ userId, password });
    revalidatePath("/work/team");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update password",
    };
  }
}

export async function createGroupChatAction(formData: FormData) {
  const session = await assertWorkAuth();
  const title = String(formData.get("title") ?? "").trim();
  const memberIds = formData
    .getAll("memberIds")
    .map((value) => String(value))
    .filter(Boolean);

  try {
    const threadId = await createGroupChat({
      title,
      createdBy: session.userId,
      memberIds,
    });
    revalidatePath("/work/messages");
    return { ok: true as const, threadId };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not create group chat",
    };
  }
}

export async function sendMessageAction(formData: FormData) {
  const session = await assertWorkAuth();
  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "");

  if (!threadId) {
    return { ok: false, error: "Missing chat" };
  }

  try {
    await sendThreadMessage({
      threadId,
      senderId: session.userId,
      body,
    });
    revalidatePath("/work/messages");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not send message",
    };
  }
}

export async function markThreadReadAction(threadId: string) {
  const session = await assertWorkAuth();
  if (!threadId) {
    return { ok: false, error: "Missing chat" };
  }

  try {
    await markThreadRead({ threadId, userId: session.userId });
    revalidatePath("/work/messages");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update chat",
    };
  }
}

export async function deleteGroupChatAction(threadId: string) {
  const session = await assertWorkAuth();
  if (!threadId) {
    return { ok: false, error: "Missing chat" };
  }

  try {
    await deleteGroupChat({ threadId, userId: session.userId });
    revalidatePath("/work/messages");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not delete chat",
    };
  }
}

export async function ensureWeeklyPlanAction(clientId: string, weekStart: string) {
  await requireWorkManager();
  return getOrCreateWeeklyPlan(clientId, weekStart);
}
