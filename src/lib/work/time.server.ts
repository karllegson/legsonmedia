import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isWorkDevBypass } from "./auth.server";
import type { ActiveClockEntry, TimeEntry } from "./types";

function mapTimeEntry(row: Record<string, unknown>): TimeEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    clientId: row.client_id as string,
    taskId: (row.task_id as string | null) ?? null,
    serviceCategoryId: (row.service_category_id as string | null) ?? null,
    clockIn: row.clock_in as string,
    clockOut: (row.clock_out as string | null) ?? null,
    durationMinutes:
      row.duration_minutes != null ? Number(row.duration_minutes) : null,
    notes: (row.notes as string | null) ?? null,
  };
}

async function getDb() {
  if (isWorkDevBypass()) {
    return createAdminClient();
  }
  return await createClient();
}

export async function getOpenTimeEntry(
  userId: string,
): Promise<ActiveClockEntry | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const { data } = await db
    .from("time_entries")
    .select(
      "*, clients(name), work_tasks(title)",
    )
    .eq("user_id", userId)
    .is("clock_out", null)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const entry = mapTimeEntry(data);
  const clients = data.clients as { name: string } | { name: string }[] | null;
  const tasks = data.work_tasks as { title: string } | { title: string }[] | null;
  const clientName = Array.isArray(clients)
    ? clients[0]?.name
    : clients?.name;
  const taskTitle = Array.isArray(tasks) ? tasks[0]?.title : tasks?.title;

  return {
    ...entry,
    clientName: clientName ?? "Unknown client",
    taskTitle: taskTitle ?? null,
  };
}

export async function clockIn(input: {
  userId: string;
  clientId: string;
  taskId?: string;
  serviceCategoryId?: string;
}): Promise<TimeEntry> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const existing = await getOpenTimeEntry(input.userId);
  if (existing) {
    throw new Error("Already clocked in. Clock out first.");
  }

  const { data, error } = await db
    .from("time_entries")
    .insert({
      user_id: input.userId,
      client_id: input.clientId,
      task_id: input.taskId ?? null,
      service_category_id: input.serviceCategoryId ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (input.taskId) {
    await db
      .from("work_tasks")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", input.taskId)
      .eq("status", "todo");
  }

  return mapTimeEntry(data);
}

export async function clockOut(input: {
  userId: string;
  notes?: string;
}): Promise<TimeEntry | null> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const open = await getOpenTimeEntry(input.userId);
  if (!open) {
    return null;
  }

  const { data, error } = await db
    .from("time_entries")
    .update({
      clock_out: new Date().toISOString(),
      notes: input.notes?.trim() || null,
    })
    .eq("id", open.id)
    .eq("user_id", input.userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapTimeEntry(data);
}

export async function listTimeEntriesForUser(
  userId: string,
  weekStart?: string,
): Promise<TimeEntry[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  let query = db
    .from("time_entries")
    .select("*")
    .eq("user_id", userId)
    .order("clock_in", { ascending: false });

  if (weekStart) {
    const weekEnd = new Date(`${weekStart}T12:00:00`);
    weekEnd.setDate(weekEnd.getDate() + 7);
    query = query
      .gte("clock_in", `${weekStart}T00:00:00.000Z`)
      .lt("clock_in", weekEnd.toISOString());
  }

  const { data } = await query;
  return (data ?? []).map(mapTimeEntry);
}

export async function listAllTimeEntries(weekStart?: string): Promise<
  Array<
    TimeEntry & {
      clientName: string;
      userDisplayName: string | null;
    }
  >
> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  let query = db
    .from("time_entries")
    .select("*, clients(name), profiles(display_name)")
    .order("clock_in", { ascending: false });

  if (weekStart) {
    const weekEnd = new Date(`${weekStart}T12:00:00`);
    weekEnd.setDate(weekEnd.getDate() + 7);
    query = query
      .gte("clock_in", `${weekStart}T00:00:00.000Z`)
      .lt("clock_in", weekEnd.toISOString());
  }

  const { data } = await query;

  return (data ?? []).map((row) => {
    const entry = mapTimeEntry(row);
    const clients = row.clients as { name: string } | { name: string }[] | null;
    const profiles = row.profiles as
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null;
    const clientName = Array.isArray(clients)
      ? clients[0]?.name
      : clients?.name;
    const displayName = Array.isArray(profiles)
      ? profiles[0]?.display_name
      : profiles?.display_name;

    return {
      ...entry,
      clientName: clientName ?? "Unknown",
      userDisplayName: displayName ?? null,
    };
  });
}

export async function listActiveClockIns(): Promise<
  Array<ActiveClockEntry & { userDisplayName: string | null }>
> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data } = await db
    .from("time_entries")
    .select("*, clients(name), work_tasks(title), profiles(display_name)")
    .is("clock_out", null)
    .order("clock_in", { ascending: false });

  return (data ?? []).map((row) => {
    const entry = mapTimeEntry(row);
    const clients = row.clients as { name: string } | { name: string }[] | null;
    const tasks = row.work_tasks as { title: string } | { title: string }[] | null;
    const profiles = row.profiles as
      | { display_name: string | null }
      | { display_name: string | null }[]
      | null;
    const clientName = Array.isArray(clients)
      ? clients[0]?.name
      : clients?.name;
    const taskTitle = Array.isArray(tasks) ? tasks[0]?.title : tasks?.title;
    const displayName = Array.isArray(profiles)
      ? profiles[0]?.display_name
      : profiles?.display_name;

    return {
      ...entry,
      clientName: clientName ?? "Unknown",
      taskTitle: taskTitle ?? null,
      userDisplayName: displayName ?? null,
    };
  });
}

export async function sumLoggedMinutesForUser(
  userId: string,
  weekStart: string,
): Promise<number> {
  const entries = await listTimeEntriesForUser(userId, weekStart);
  return entries.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0);
}

export async function sumLoggedMinutesForClient(
  clientId: string,
  weekStart: string,
): Promise<number> {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  const weekEnd = new Date(`${weekStart}T12:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data } = await db
    .from("time_entries")
    .select("duration_minutes")
    .eq("client_id", clientId)
    .gte("clock_in", `${weekStart}T00:00:00.000Z`)
    .lt("clock_in", weekEnd.toISOString())
    .not("clock_out", "is", null);

  return (data ?? []).reduce(
    (sum, row) => sum + Number(row.duration_minutes ?? 0),
    0,
  );
}
