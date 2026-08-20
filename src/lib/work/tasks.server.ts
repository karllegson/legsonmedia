import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isWorkDevBypass } from "./auth.server";
import type { TaskPriority, TaskStatus, WorkTask } from "./types";

function mapTask(row: Record<string, unknown>): WorkTask {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    assignedTo: row.assigned_to as string,
    serviceCategoryId: (row.service_category_id as string | null) ?? null,
    weeklyPlanId: (row.weekly_plan_id as string | null) ?? null,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    estimatedHours:
      row.estimated_hours != null ? Number(row.estimated_hours) : null,
    status: row.status as TaskStatus,
    dueDate: (row.due_date as string | null) ?? null,
    priority: row.priority as TaskPriority,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function getDb() {
  if (isWorkDevBypass()) {
    return createAdminClient();
  }
  return await createClient();
}

export const listTasksForUser = cache(async (userId: string): Promise<WorkTask[]> => {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data } = await db
    .from("work_tasks")
    .select("*")
    .eq("assigned_to", userId)
    .order("status")
    .order("due_date", { ascending: true, nullsFirst: false });

  return (data ?? []).map(mapTask);
});

/** Lightweight count for sidebar badge — avoids loading every task on navigation. */
export const countOpenTasksForUser = cache(async (userId: string): Promise<number> => {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  const { count } = await db
    .from("work_tasks")
    .select("id", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .neq("status", "done");

  return count ?? 0;
});

export async function listAllTasks(): Promise<WorkTask[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data } = await db
    .from("work_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapTask);
}

export async function listOpenTasksForUserAndClient(
  userId: string,
  clientId: string,
): Promise<WorkTask[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data } = await db
    .from("work_tasks")
    .select("*")
    .eq("assigned_to", userId)
    .eq("client_id", clientId)
    .in("status", ["todo", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false });

  return (data ?? []).map(mapTask);
}

export async function createTask(input: {
  clientId: string;
  assignedTo: string;
  serviceCategoryId?: string;
  weeklyPlanId?: string;
  title: string;
  description?: string;
  estimatedHours?: number;
  dueDate?: string;
  priority?: TaskPriority;
}): Promise<WorkTask> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const { data, error } = await db
    .from("work_tasks")
    .insert({
      client_id: input.clientId,
      assigned_to: input.assignedTo,
      service_category_id: input.serviceCategoryId ?? null,
      weekly_plan_id: input.weeklyPlanId ?? null,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      estimated_hours: input.estimatedHours ?? null,
      due_date: input.dueDate ?? null,
      priority: input.priority ?? "normal",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapTask(data);
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  userId: string,
  isManager: boolean,
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not configured");
  }

  let query = db.from("work_tasks").update({
    status,
    updated_at: new Date().toISOString(),
  });

  query = query.eq("id", taskId);
  if (!isManager) {
    query = query.eq("assigned_to", userId);
  }

  const { error } = await query;
  if (error) {
    throw error;
  }
}

export async function updateTask(
  taskId: string,
  input: Partial<{
    title: string;
    description: string;
    assignedTo: string;
    serviceCategoryId: string;
    estimatedHours: number;
    dueDate: string;
    priority: TaskPriority;
    status: TaskStatus;
  }>,
): Promise<WorkTask> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title != null) payload.title = input.title.trim();
  if (input.description != null) payload.description = input.description.trim() || null;
  if (input.assignedTo != null) payload.assigned_to = input.assignedTo;
  if (input.serviceCategoryId != null) payload.service_category_id = input.serviceCategoryId;
  if (input.estimatedHours != null) payload.estimated_hours = input.estimatedHours;
  if (input.dueDate != null) payload.due_date = input.dueDate || null;
  if (input.priority != null) payload.priority = input.priority;
  if (input.status != null) payload.status = input.status;

  const { data, error } = await db
    .from("work_tasks")
    .update(payload)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapTask(data);
}

export async function deleteTask(taskId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const { error } = await db.from("work_tasks").delete().eq("id", taskId);
  if (error) {
    throw error;
  }
}

export async function bulkCreateTasksFromPlan(input: {
  weeklyPlanId: string;
  clientId: string;
  tasks: Array<{
    assignedTo: string;
    serviceCategoryId: string;
    title: string;
    estimatedHours: number;
  }>;
}): Promise<number> {
  if (!input.tasks.length) {
    return 0;
  }

  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const rows = input.tasks.map((t) => ({
    client_id: input.clientId,
    assigned_to: t.assignedTo,
    service_category_id: t.serviceCategoryId,
    weekly_plan_id: input.weeklyPlanId,
    title: t.title,
    estimated_hours: t.estimatedHours,
    status: "todo" as const,
    priority: "normal" as const,
  }));

  const { error } = await db.from("work_tasks").insert(rows);
  if (error) {
    throw error;
  }

  return rows.length;
}
