import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isWorkDevBypass } from "./auth.server";
import { getClientById, listClientsWithRetainers } from "./clients.server";
import { minutesToHours } from "./roles";
import type { ClientWithRetainer } from "./types";

export type ClientWeekEntry = {
  id: string;
  userId: string;
  displayName: string | null;
  taskTitle: string | null;
  notes: string | null;
  clockIn: string;
  clockOut: string | null;
  durationMinutes: number;
};

export type ClientWeekPersonTotal = {
  userId: string;
  displayName: string | null;
  minutes: number;
  hours: number;
};

export type ClientWeekBreakdown = {
  clientId: string;
  clientName: string;
  clientSlug: string;
  weekStart: string;
  retainerHours: number;
  loggedMinutes: number;
  loggedHours: number;
  remainingHours: number;
  byPerson: ClientWeekPersonTotal[];
  entries: ClientWeekEntry[];
};

async function getDb() {
  if (isWorkDevBypass()) {
    return createAdminClient();
  }
  return await createClient();
}

export async function getClientBySlug(slug: string) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const { data } = await db
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    id: data.id as string,
    name: data.name as string,
    slug: data.slug as string,
    isActive: data.is_active as boolean,
    notes: (data.notes as string | null) ?? null,
  };
}

export async function getClientWeekBreakdown(
  clientId: string,
  weekStart: string,
): Promise<ClientWeekBreakdown | null> {
  const clients = await listClientsWithRetainers();
  let resolved: ClientWithRetainer | null =
    clients.find((item) => item.id === clientId) ?? null;

  if (!resolved) {
    const basic = await getClientById(clientId);
    if (!basic) {
      return null;
    }
    resolved = { ...basic, retainer: null };
  }

  const db = createAdminClient();
  const weekEnd = new Date(`${weekStart}T12:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // time_entries.user_id → auth.users (not profiles), so names must be loaded separately.
  const { data, error } = await db
    .from("time_entries")
    .select(
      "id, user_id, task_id, clock_in, clock_out, duration_minutes, notes, work_tasks(title)",
    )
    .eq("client_id", clientId)
    .gte("clock_in", `${weekStart}T00:00:00.000Z`)
    .lt("clock_in", weekEnd.toISOString())
    .not("clock_out", "is", null)
    .order("clock_in", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const userIds = Array.from(
    new Set((data ?? []).map((row) => row.user_id as string)),
  );
  const displayNameByUser = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    for (const profile of profiles ?? []) {
      displayNameByUser.set(
        profile.id as string,
        (profile.display_name as string | null) ?? null,
      );
    }
  }

  const entries: ClientWeekEntry[] = (data ?? []).map((row) => {
    const tasks = row.work_tasks as
      | { title: string }
      | { title: string }[]
      | null;
    const taskTitle = Array.isArray(tasks) ? tasks[0]?.title : tasks?.title;
    const userId = row.user_id as string;

    return {
      id: row.id as string,
      userId,
      displayName: displayNameByUser.get(userId) ?? null,
      taskTitle: taskTitle ?? null,
      notes: (row.notes as string | null) ?? null,
      clockIn: row.clock_in as string,
      clockOut: (row.clock_out as string | null) ?? null,
      durationMinutes: Number(row.duration_minutes ?? 0),
    };
  });

  const byPersonMap = new Map<string, ClientWeekPersonTotal>();
  for (const entry of entries) {
    const current = byPersonMap.get(entry.userId) ?? {
      userId: entry.userId,
      displayName: entry.displayName,
      minutes: 0,
      hours: 0,
    };
    current.minutes += entry.durationMinutes;
    current.hours = minutesToHours(current.minutes);
    byPersonMap.set(entry.userId, current);
  }

  const loggedMinutes = entries.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  );
  const loggedHours = minutesToHours(loggedMinutes);
  const retainerHours = resolved.retainer?.hoursPerWeek ?? 0;

  return {
    clientId: resolved.id,
    clientName: resolved.name,
    clientSlug: resolved.slug,
    weekStart,
    retainerHours,
    loggedMinutes,
    loggedHours,
    remainingHours: Math.max(0, retainerHours - loggedHours),
    byPerson: Array.from(byPersonMap.values()).sort(
      (a, b) => b.minutes - a.minutes,
    ),
    entries,
  };
}
