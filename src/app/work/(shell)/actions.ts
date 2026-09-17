"use server";

import { revalidatePath } from "next/cache";
import {
  assertWorkAuth,
  requireCmsAdmin,
  requireWorkManager,
} from "@/lib/work/auth.server";
import {
  getCurrentRetainer,
  upsertClient,
  upsertRetainer,
} from "@/lib/work/clients.server";
import { isManagerRole, isOwnerRole, WORK_ROLES, canManageWorkRoles } from "@/lib/work/roles";
import {
  bulkCreateTasksFromPlan,
  createTask,
  deleteTask,
  updateTaskStatus,
} from "@/lib/work/tasks.server";
import {
  addManualTimeEntry,
  clockIn,
  clockOut,
  deleteTimeEntry,
  pauseClock,
  resumeClock,
  updateTimeEntry,
} from "@/lib/work/time.server";
import {
  createTimeEditRequest,
  getTimeEditRequest,
  resolveTimeEditRequest,
} from "@/lib/work/timeEditRequests.server";
import {
  listWorkNotifications,
  markWorkNotificationsRead,
} from "@/lib/work/notifications.server";
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

function revalidateTimePaths() {
  revalidatePath("/work");
  revalidatePath("/work/clock");
  revalidatePath("/work/reports");
  revalidatePath("/work/clients");
}

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

export async function pauseClockAction() {
  const session = await assertWorkAuth();
  try {
    await pauseClock(session.userId);
    revalidatePath("/work");
    revalidatePath("/work/clock");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not pause",
    };
  }
}

export async function resumeClockAction() {
  const session = await assertWorkAuth();
  try {
    await resumeClock(session.userId);
    revalidatePath("/work");
    revalidatePath("/work/clock");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not resume",
    };
  }
}

export async function addManualTimeAction(formData: FormData) {
  await assertWorkAuth();

  const userId = String(formData.get("userId") ?? "");
  const clientId = String(formData.get("clientId") ?? "");
  const weekStart = String(formData.get("weekStart") ?? "");
  const hours = Number(formData.get("hours") ?? 0);
  const minutes = Number(formData.get("minutes") ?? 0);
  const notes = String(formData.get("notes") ?? "");
  const taskId = String(formData.get("taskId") ?? "") || undefined;

  try {
    await addManualTimeEntry({
      userId,
      clientId,
      weekStart,
      hours,
      minutes,
      notes,
      taskId,
    });
    revalidateTimePaths();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not log time",
    };
  }
}

export async function updateTimeEntryAction(formData: FormData) {
  const session = await requireCmsAdmin();

  const entryId = String(formData.get("entryId") ?? "");
  const hours = Number(formData.get("hours") ?? 0);
  const minutes = Number(formData.get("minutes") ?? 0);
  const notes = String(formData.get("notes") ?? "");

  if (!entryId) {
    return { ok: false, error: "Missing entry" };
  }

  try {
    await updateTimeEntry({ entryId, hours, minutes, notes });
    revalidateTimePaths();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update entry",
    };
  }
}

export async function deleteTimeEntryAction(formData: FormData) {
  await requireCmsAdmin();
  const entryId = String(formData.get("entryId") ?? "");
  if (!entryId) {
    return { ok: false, error: "Missing entry" };
  }

  try {
    await deleteTimeEntry(entryId);
    revalidateTimePaths();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not delete entry",
    };
  }
}

export async function requestTimeEditAction(formData: FormData) {
  const session = await assertWorkAuth();
  if (isOwnerRole(session.profile.role)) {
    return {
      ok: false,
      error: "Owners can edit time directly — no request needed",
    };
  }

  const entryId = String(formData.get("entryId") ?? "");
  const hours = Number(formData.get("hours") ?? 0);
  const minutes = Number(formData.get("minutes") ?? 0);
  const notes = String(formData.get("notes") ?? "");
  const reason = String(formData.get("reason") ?? "");

  try {
    await createTimeEditRequest({
      entryId,
      requesterId: session.userId,
      proposedHours: hours,
      proposedMinutes: minutes,
      proposedNotes: notes,
      reason,
    });
    revalidatePath("/work/clock");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not submit request",
    };
  }
}

export async function resolveTimeEditRequestAction(formData: FormData) {
  const session = await requireCmsAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const resolutionNote = String(formData.get("resolutionNote") ?? "");

  if (!requestId || (decision !== "approved" && decision !== "denied")) {
    return { ok: false, error: "Invalid decision" };
  }

  try {
    const request = await getTimeEditRequest(requestId);
    if (!request) {
      return { ok: false, error: "Request not found" };
    }

    if (decision === "approved") {
      await updateTimeEntry({
        entryId: request.entryId,
        hours: request.proposedHours,
        minutes: request.proposedMinutes,
        notes: request.proposedNotes,
      });
    }

    await resolveTimeEditRequest({
      requestId,
      resolverId: session.userId,
      status: decision,
      resolutionNote,
    });

    revalidateTimePaths();
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not resolve request",
    };
  }
}

export async function listNotificationsAction() {
  const session = await assertWorkAuth();
  try {
    const items = await listWorkNotifications({
      userId: session.userId,
      role: session.profile.role,
    });
    return { ok: true as const, items };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not load notifications",
      items: [],
    };
  }
}

export async function markNotificationsReadAction(ids: string[]) {
  const session = await assertWorkAuth();
  try {
    await markWorkNotificationsRead({ userId: session.userId, ids });
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update notifications",
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
  const session = await requireWorkManager();
  const isOwner = isOwnerRole(session.profile.role);

  const id = String(formData.get("id") ?? "") || undefined;
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const hoursPerWeek = Number(formData.get("hoursPerWeek") || 0);
  const submittedRate = Number(formData.get("hourlyRate") || 0);

  if (!name || !slug) {
    return { ok: false, error: "Name and slug are required" };
  }

  try {
    const client = await upsertClient({ id, name, slug, notes });
    if (hoursPerWeek > 0) {
      const existing = await getCurrentRetainer(client.id);
      const hourlyRate = isOwner
        ? submittedRate || existing?.hourlyRate || 0
        : existing?.hourlyRate ?? 0;

      await upsertRetainer({
        clientId: client.id,
        hoursPerWeek,
        hourlyRate,
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
