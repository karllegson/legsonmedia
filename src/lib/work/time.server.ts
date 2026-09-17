import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isWorkDevBypass } from "./auth.server";
import type { ActiveClockEntry, TimeEntry } from "./types";

export type ActiveClockSession = ActiveClockEntry & {
  isPaused: boolean;
  pausedMs: number;
};

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

/** profiles.id matches auth.users, but time_entries has no FK to profiles — load names separately. */
async function loadDisplayNamesByUserId(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userIds: string[],
): Promise<Map<string, string | null>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  const map = new Map<string, string | null>();
  if (unique.length === 0) {
    return map;
  }

  const { data } = await db
    .from("profiles")
    .select("id, display_name")
    .in("id", unique);

  for (const row of data ?? []) {
    map.set(row.id as string, (row.display_name as string | null) ?? null);
  }
  return map;
}

export const getOpenTimeEntry = cache(async (
  userId: string,
): Promise<ActiveClockEntry | null> => {
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
});

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

  await writePauseState(db, input.userId, null);

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

  const pause = await readPauseState(db, input.userId);
  const pausedMs =
    pause?.entryId === open.id ? totalPausedMs(pause) : 0;
  const adjustedClockIn = new Date(
    new Date(open.clockIn).getTime() + pausedMs,
  ).toISOString();

  const { data, error } = await db
    .from("time_entries")
    .update({
      clock_in: adjustedClockIn,
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

  await writePauseState(db, input.userId, null);

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

export type TimeEntryWithMeta = TimeEntry & {
  clientName: string;
  taskTitle: string | null;
  userDisplayName: string | null;
};

export async function getTimeEntryById(
  entryId: string,
): Promise<TimeEntryWithMeta | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("time_entries")
    .select("*, clients(name), work_tasks(title)")
    .eq("id", entryId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const entry = mapTimeEntry(data);
  const clients = data.clients as { name: string } | { name: string }[] | null;
  const tasks = data.work_tasks as
    | { title: string }
    | { title: string }[]
    | null;
  const names = await loadDisplayNamesByUserId(db, [entry.userId]);

  return {
    ...entry,
    clientName: (Array.isArray(clients) ? clients[0]?.name : clients?.name) ?? "Unknown",
    taskTitle: (Array.isArray(tasks) ? tasks[0]?.title : tasks?.title) ?? null,
    userDisplayName: names.get(entry.userId) ?? null,
  };
}

export async function listRecentClosedEntriesForUser(
  userId: string,
  limit = 20,
): Promise<TimeEntryWithMeta[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("time_entries")
    .select("*, clients(name), work_tasks(title)")
    .eq("user_id", userId)
    .not("clock_out", "is", null)
    .order("clock_in", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const names = await loadDisplayNamesByUserId(db, [userId]);

  return (data ?? []).map((row) => {
    const entry = mapTimeEntry(row);
    const clients = row.clients as { name: string } | { name: string }[] | null;
    const tasks = row.work_tasks as
      | { title: string }
      | { title: string }[]
      | null;
    return {
      ...entry,
      clientName:
        (Array.isArray(clients) ? clients[0]?.name : clients?.name) ?? "Unknown",
      taskTitle:
        (Array.isArray(tasks) ? tasks[0]?.title : tasks?.title) ?? null,
      userDisplayName: names.get(entry.userId) ?? null,
    };
  });
}

/** Owner-only: change duration / notes on a closed entry. */
export async function updateTimeEntry(input: {
  entryId: string;
  hours: number;
  minutes?: number;
  notes?: string;
}): Promise<void> {
  const hoursPart = Number(input.hours) || 0;
  const minutesPart = Number(input.minutes) || 0;
  const minutes = Math.round(hoursPart * 60 + minutesPart);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("Enter time greater than 0");
  }

  const db = createAdminClient();
  const { data: existing, error: loadError } = await db
    .from("time_entries")
    .select("id, clock_in, clock_out")
    .eq("id", input.entryId)
    .maybeSingle();

  if (loadError) {
    throw new Error(loadError.message);
  }
  if (!existing) {
    throw new Error("Time entry not found");
  }
  if (!existing.clock_out) {
    throw new Error("Clock out the session before editing it");
  }

  const clockIn = new Date(existing.clock_in as string);
  const clockOut = new Date(clockIn.getTime() + minutes * 60_000);
  const notes =
    input.notes !== undefined ? input.notes.trim() || null : undefined;

  const payload: Record<string, unknown> = {
    clock_out: clockOut.toISOString(),
  };
  if (notes !== undefined) {
    payload.notes = notes;
  }

  const { error } = await db
    .from("time_entries")
    .update(payload)
    .eq("id", input.entryId);

  if (error) {
    throw new Error(error.message);
  }
}

/** Owner-only: permanently remove a closed time entry. */
export async function deleteTimeEntry(entryId: string): Promise<void> {
  const db = createAdminClient();
  const { data: existing, error: loadError } = await db
    .from("time_entries")
    .select("id, clock_out")
    .eq("id", entryId)
    .maybeSingle();

  if (loadError) {
    throw new Error(loadError.message);
  }
  if (!existing) {
    throw new Error("Time entry not found");
  }
  if (!existing.clock_out) {
    throw new Error("Clock out the session before deleting it");
  }

  const { error } = await db.from("time_entries").delete().eq("id", entryId);
  if (error) {
    throw new Error(error.message);
  }
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
    .select("*, clients(name)")
    .order("clock_in", { ascending: false });

  if (weekStart) {
    const weekEnd = new Date(`${weekStart}T12:00:00`);
    weekEnd.setDate(weekEnd.getDate() + 7);
    query = query
      .gte("clock_in", `${weekStart}T00:00:00.000Z`)
      .lt("clock_in", weekEnd.toISOString());
  }

  const { data } = await query;
  const names = await loadDisplayNamesByUserId(
    db,
    (data ?? []).map((row) => row.user_id as string),
  );

  return (data ?? []).map((row) => {
    const entry = mapTimeEntry(row);
    const clients = row.clients as { name: string } | { name: string }[] | null;
    const clientName = Array.isArray(clients)
      ? clients[0]?.name
      : clients?.name;

    return {
      ...entry,
      clientName: clientName ?? "Unknown",
      userDisplayName: names.get(entry.userId) ?? null,
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
    .select("*, clients(name), work_tasks(title)")
    .is("clock_out", null)
    .order("clock_in", { ascending: false });

  const names = await loadDisplayNamesByUserId(
    db,
    (data ?? []).map((row) => row.user_id as string),
  );

  return (data ?? []).map((row) => {
    const entry = mapTimeEntry(row);
    const clients = row.clients as { name: string } | { name: string }[] | null;
    const tasks = row.work_tasks as { title: string } | { title: string }[] | null;
    const clientName = Array.isArray(clients)
      ? clients[0]?.name
      : clients?.name;
    const taskTitle = Array.isArray(tasks) ? tasks[0]?.title : tasks?.title;

    return {
      ...entry,
      clientName: clientName ?? "Unknown",
      taskTitle: taskTitle ?? null,
      userDisplayName: names.get(entry.userId) ?? null,
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

/**
 * Manually log closed hours for any teammate / client / week.
 * Work week is Monday–Sunday (weekStart = Monday).
 */
export async function addManualTimeEntry(input: {
  userId: string;
  clientId: string;
  weekStart: string;
  hours: number;
  minutes?: number;
  notes: string;
  taskId?: string;
}): Promise<void> {
  const hoursPart = Number(input.hours) || 0;
  const minutesPart = Number(input.minutes) || 0;
  const minutes = Math.round(hoursPart * 60 + minutesPart);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("Enter time greater than 0");
  }

  const notes = input.notes.trim();
  if (!notes) {
    throw new Error("Add a short note for what this time was for");
  }

  if (!input.clientId) {
    throw new Error("Select a client");
  }

  if (!input.userId) {
    throw new Error("Select a person");
  }

  const db = createAdminClient();
  let serviceCategoryId: string | null = null;
  let taskId: string | null = input.taskId?.trim() || null;

  if (taskId) {
    const { data: task, error: taskError } = await db
      .from("work_tasks")
      .select("id, client_id, assigned_to, service_category_id")
      .eq("id", taskId)
      .maybeSingle();

    if (taskError) {
      throw new Error(taskError.message);
    }
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.client_id !== input.clientId) {
      throw new Error("That task belongs to a different client");
    }
    serviceCategoryId = (task.service_category_id as string | null) ?? null;
  }

  // Place the entry on Monday of the selected work week.
  const clockIn = new Date(`${input.weekStart}T12:00:00`);
  const clockOut = new Date(clockIn.getTime() + minutes * 60_000);

  const { error } = await db.from("time_entries").insert({
    user_id: input.userId,
    client_id: input.clientId,
    task_id: taskId,
    service_category_id: serviceCategoryId,
    clock_in: clockIn.toISOString(),
    clock_out: clockOut.toISOString(),
    notes,
  });

  if (error) {
    throw new Error(error.message);
  }
}

type ClockPauseState = {
  entryId: string;
  accumulatedMs: number;
  pausedAt: string | null;
};

const PAUSE_BUCKET = "work-clock";

async function ensurePauseBucket(
  db: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const { data: buckets } = await db.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.name === PAUSE_BUCKET)) {
    return;
  }
  const { error } = await db.storage.createBucket(PAUSE_BUCKET, {
    public: false,
    fileSizeLimit: "1MB",
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(error.message);
  }
}

async function readPauseState(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<ClockPauseState | null> {
  await ensurePauseBucket(db);
  const { data, error } = await db.storage
    .from(PAUSE_BUCKET)
    .download(`pauses/${userId}.json`);
  if (error || !data) {
    return null;
  }
  try {
    return JSON.parse(await data.text()) as ClockPauseState;
  } catch {
    return null;
  }
}

async function writePauseState(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  state: ClockPauseState | null,
): Promise<void> {
  await ensurePauseBucket(db);
  const path = `pauses/${userId}.json`;
  if (!state) {
    await db.storage.from(PAUSE_BUCKET).remove([path]);
    return;
  }
  const { error } = await db.storage.from(PAUSE_BUCKET).upload(
    path,
    JSON.stringify(state),
    { contentType: "application/json", upsert: true },
  );
  if (error) {
    throw new Error(error.message);
  }
}

function totalPausedMs(state: ClockPauseState | null, now = Date.now()): number {
  if (!state) {
    return 0;
  }
  const live = state.pausedAt
    ? Math.max(0, now - new Date(state.pausedAt).getTime())
    : 0;
  return state.accumulatedMs + live;
}

export async function pauseClock(userId: string): Promise<void> {
  const db = createAdminClient();
  const open = await getOpenTimeEntry(userId);
  if (!open) {
    throw new Error("No active session to pause");
  }

  const existing = await readPauseState(db, userId);
  if (existing?.entryId === open.id && existing.pausedAt) {
    return;
  }

  const accumulatedMs =
    existing?.entryId === open.id ? existing.accumulatedMs : 0;

  await writePauseState(db, userId, {
    entryId: open.id,
    accumulatedMs,
    pausedAt: new Date().toISOString(),
  });
}

export async function resumeClock(userId: string): Promise<void> {
  const db = createAdminClient();
  const open = await getOpenTimeEntry(userId);
  if (!open) {
    throw new Error("No active session to resume");
  }

  const existing = await readPauseState(db, userId);
  if (!existing || existing.entryId !== open.id || !existing.pausedAt) {
    return;
  }

  const added = Math.max(
    0,
    Date.now() - new Date(existing.pausedAt).getTime(),
  );

  await writePauseState(db, userId, {
    entryId: open.id,
    accumulatedMs: existing.accumulatedMs + added,
    pausedAt: null,
  });
}

export async function getActiveClockSession(
  userId: string,
): Promise<ActiveClockSession | null> {
  const open = await getOpenTimeEntry(userId);
  if (!open) {
    return null;
  }

  try {
    const db = createAdminClient();
    const pause = await readPauseState(db, userId);
    if (!pause || pause.entryId !== open.id) {
      return { ...open, isPaused: false, pausedMs: 0 };
    }
    return {
      ...open,
      isPaused: Boolean(pause.pausedAt),
      pausedMs: totalPausedMs(pause),
    };
  } catch {
    return { ...open, isPaused: false, pausedMs: 0 };
  }
}
