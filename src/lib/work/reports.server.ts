import { listClientsWithRetainers } from "./clients.server";
import { getWeeklyPlan, listPlanLines } from "./planning.server";
import { minutesToHours } from "./roles";
import { sumLoggedMinutesForClient } from "./time.server";
import type { ClientUtilization, SpecialistUtilization } from "./types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isWorkDevBypass } from "./auth.server";

async function getDb() {
  if (isWorkDevBypass()) {
    return createAdminClient();
  }
  return await createClient();
}

export async function getClientUtilizationReport(
  weekStart: string,
): Promise<ClientUtilization[]> {
  const clients = await listClientsWithRetainers();
  const results: ClientUtilization[] = [];

  for (const client of clients) {
    if (!client.isActive) {
      continue;
    }

    const retainerHours = client.retainer?.hoursPerWeek ?? 0;
    const hourlyRate = client.retainer?.hourlyRate ?? 0;

    const plan = await getWeeklyPlan(client.id, weekStart);
    let plannedHours = 0;
    if (plan) {
      const lines = await listPlanLines(plan.id);
      plannedHours = lines.reduce((sum, l) => sum + l.plannedHours, 0);
    }

    const loggedMinutes = await sumLoggedMinutesForClient(client.id, weekStart);
    const loggedHours = minutesToHours(loggedMinutes);
    const remainingHours = Math.max(0, retainerHours - loggedHours);

    results.push({
      clientId: client.id,
      clientSlug: client.slug,
      clientName: client.name,
      retainerHours,
      hourlyRate,
      plannedHours,
      loggedHours,
      remainingHours,
      billableAmount: loggedHours * hourlyRate,
    });
  }

  return results;
}

export async function getSpecialistUtilizationReport(
  weekStart: string,
): Promise<SpecialistUtilization[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const weekEnd = new Date(`${weekStart}T12:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name")
    .eq("is_active", true);

  const { data: allocations } = await db
    .from("specialist_allocations")
    .select("user_id, allocated_hours, weekly_plans!inner(week_start)")
    .eq("weekly_plans.week_start", weekStart);

  const { data: timeEntries } = await db
    .from("time_entries")
    .select("user_id, duration_minutes")
    .gte("clock_in", `${weekStart}T00:00:00.000Z`)
    .lt("clock_in", weekEnd.toISOString())
    .not("clock_out", "is", null);

  const allocatedByUser = new Map<string, number>();
  for (const row of allocations ?? []) {
    const uid = row.user_id as string;
    allocatedByUser.set(
      uid,
      (allocatedByUser.get(uid) ?? 0) + Number(row.allocated_hours),
    );
  }

  const loggedByUser = new Map<string, number>();
  for (const row of timeEntries ?? []) {
    const uid = row.user_id as string;
    loggedByUser.set(
      uid,
      (loggedByUser.get(uid) ?? 0) + Number(row.duration_minutes ?? 0),
    );
  }

  return (profiles ?? []).map((row) => {
    const userId = row.id as string;
    const allocatedHours = allocatedByUser.get(userId) ?? 0;
    const loggedHours = minutesToHours(loggedByUser.get(userId) ?? 0);
    const utilizationPct =
      allocatedHours > 0
        ? Math.round((loggedHours / allocatedHours) * 100)
        : loggedHours > 0
          ? 100
          : 0;

    return {
      userId,
      displayName: (row.display_name as string | null) ?? null,
      allocatedHours,
      loggedHours,
      utilizationPct,
    };
  });
}

export function buildBillingCsv(
  rows: ClientUtilization[],
  weekStart: string,
): string {
  const header = [
    "Week Start",
    "Client",
    "Retainer Hours",
    "Logged Hours",
    "Remaining Hours",
    "Hourly Rate",
    "Billable Amount",
  ];

  const lines = rows.map((r) =>
    [
      weekStart,
      `"${r.clientName.replace(/"/g, '""')}"`,
      r.retainerHours.toFixed(2),
      r.loggedHours.toFixed(2),
      r.remainingHours.toFixed(2),
      r.hourlyRate.toFixed(2),
      r.billableAmount.toFixed(2),
    ].join(","),
  );

  return [header.join(","), ...lines].join("\n");
}

export async function getTimeEntriesExport(
  weekStart: string,
): Promise<string> {
  const db = await getDb();
  if (!db) {
    return "";
  }

  const weekEnd = new Date(`${weekStart}T12:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data } = await db
    .from("time_entries")
    .select(
      "user_id, clock_in, clock_out, duration_minutes, notes, clients(name), work_tasks(title)",
    )
    .gte("clock_in", `${weekStart}T00:00:00.000Z`)
    .lt("clock_in", weekEnd.toISOString())
    .not("clock_out", "is", null)
    .order("clock_in");

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

  const header = [
    "Date",
    "Team Member",
    "Client",
    "Task",
    "Duration (min)",
    "Notes",
  ];

  const lines = (data ?? []).map((row) => {
    const clients = row.clients as { name: string } | { name: string }[] | null;
    const tasks = row.work_tasks as { title: string } | { title: string }[] | null;
    const clientName = Array.isArray(clients)
      ? clients[0]?.name
      : clients?.name;
    const displayName = displayNameByUser.get(row.user_id as string);
    const taskTitle = Array.isArray(tasks) ? tasks[0]?.title : tasks?.title;

    return [
      (row.clock_in as string).slice(0, 10),
      `"${(displayName ?? "Unknown").replace(/"/g, '""')}"`,
      `"${(clientName ?? "Unknown").replace(/"/g, '""')}"`,
      `"${(taskTitle ?? "").replace(/"/g, '""')}"`,
      String(row.duration_minutes ?? 0),
      `"${((row.notes as string) ?? "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  return [header.join(","), ...lines].join("\n");
}
