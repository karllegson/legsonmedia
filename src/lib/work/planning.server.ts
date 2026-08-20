import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isWorkDevBypass } from "./auth.server";
import type {
  SpecialistAllocation,
  TeamMember,
  WeeklyPlan,
  WeeklyPlanLine,
  WeeklyPlanStatus,
} from "./types";

function mapWeeklyPlan(row: Record<string, unknown>): WeeklyPlan {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    weekStart: row.week_start as string,
    status: row.status as WeeklyPlanStatus,
    notes: (row.notes as string | null) ?? null,
  };
}

function mapPlanLine(row: Record<string, unknown>): WeeklyPlanLine {
  return {
    id: row.id as string,
    weeklyPlanId: row.weekly_plan_id as string,
    serviceCategoryId: row.service_category_id as string,
    plannedHours: Number(row.planned_hours),
  };
}

function mapAllocation(row: Record<string, unknown>): SpecialistAllocation {
  return {
    id: row.id as string,
    weeklyPlanId: row.weekly_plan_id as string,
    userId: row.user_id as string,
    serviceCategoryId: row.service_category_id as string,
    allocatedHours: Number(row.allocated_hours),
    notes: (row.notes as string | null) ?? null,
  };
}

async function getDb() {
  if (isWorkDevBypass()) {
    return createAdminClient();
  }
  return await createClient();
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name, role, is_active")
    .eq("is_active", true)
    .order("display_name");

  return (profiles ?? []).map((row) => ({
    id: row.id as string,
    displayName: (row.display_name as string | null) ?? null,
    email: "",
    role: row.role as TeamMember["role"],
    isActive: row.is_active as boolean,
  }));
}

export async function listTeamMembersWithEmail(): Promise<TeamMember[]> {
  const db = createAdminClient();
  if (!db) {
    return [];
  }

  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name, role, is_active")
    .order("display_name");

  const { data: authData } = await db.auth.admin.listUsers();
  const emailById = new Map(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? ""]),
  );

  return (profiles ?? []).map((row) => ({
    id: row.id as string,
    displayName: (row.display_name as string | null) ?? null,
    email: emailById.get(row.id as string) ?? "",
    role: row.role as TeamMember["role"],
    isActive: row.is_active as boolean,
  }));
}

export async function getWeeklyPlan(
  clientId: string,
  weekStart: string,
): Promise<WeeklyPlan | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const { data } = await db
    .from("weekly_plans")
    .select("*")
    .eq("client_id", clientId)
    .eq("week_start", weekStart)
    .maybeSingle();

  return data ? mapWeeklyPlan(data) : null;
}

export async function getOrCreateWeeklyPlan(
  clientId: string,
  weekStart: string,
): Promise<WeeklyPlan> {
  const existing = await getWeeklyPlan(clientId, weekStart);
  if (existing) {
    return existing;
  }

  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const { data, error } = await db
    .from("weekly_plans")
    .insert({
      client_id: clientId,
      week_start: weekStart,
      status: "draft",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapWeeklyPlan(data);
}

export async function listPlanLines(
  weeklyPlanId: string,
): Promise<WeeklyPlanLine[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data } = await db
    .from("weekly_plan_lines")
    .select("*")
    .eq("weekly_plan_id", weeklyPlanId);

  return (data ?? []).map(mapPlanLine);
}

export async function listAllocations(
  weeklyPlanId: string,
): Promise<SpecialistAllocation[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data } = await db
    .from("specialist_allocations")
    .select("*")
    .eq("weekly_plan_id", weeklyPlanId);

  return (data ?? []).map(mapAllocation);
}

export async function upsertPlanLine(input: {
  weeklyPlanId: string;
  serviceCategoryId: string;
  plannedHours: number;
}): Promise<WeeklyPlanLine> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const { data, error } = await db
    .from("weekly_plan_lines")
    .upsert(
      {
        weekly_plan_id: input.weeklyPlanId,
        service_category_id: input.serviceCategoryId,
        planned_hours: input.plannedHours,
      },
      { onConflict: "weekly_plan_id,service_category_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapPlanLine(data);
}

export async function deletePlanLine(lineId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const { error } = await db
    .from("weekly_plan_lines")
    .delete()
    .eq("id", lineId);
  if (error) {
    throw error;
  }
}

export async function upsertAllocation(input: {
  weeklyPlanId: string;
  userId: string;
  serviceCategoryId: string;
  allocatedHours: number;
  notes?: string;
}): Promise<SpecialistAllocation> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const { data, error } = await db
    .from("specialist_allocations")
    .upsert(
      {
        weekly_plan_id: input.weeklyPlanId,
        user_id: input.userId,
        service_category_id: input.serviceCategoryId,
        allocated_hours: input.allocatedHours,
        notes: input.notes?.trim() || null,
      },
      { onConflict: "weekly_plan_id,user_id,service_category_id" },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapAllocation(data);
}

export async function deleteAllocation(allocationId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const { error } = await db
    .from("specialist_allocations")
    .delete()
    .eq("id", allocationId);
  if (error) {
    throw error;
  }
}

export async function publishWeeklyPlan(weeklyPlanId: string): Promise<void> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const { error } = await db
    .from("weekly_plans")
    .update({
      status: "published",
      updated_at: new Date().toISOString(),
    })
    .eq("id", weeklyPlanId);

  if (error) {
    throw error;
  }
}

export async function getUserAllocationsForWeek(
  userId: string,
  weekStart: string,
): Promise<SpecialistAllocation[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data: plans } = await db
    .from("weekly_plans")
    .select("id")
    .eq("week_start", weekStart)
    .eq("status", "published");

  const planIds = (plans ?? []).map((p) => p.id as string);
  if (!planIds.length) {
    return [];
  }

  const { data } = await db
    .from("specialist_allocations")
    .select("*")
    .eq("user_id", userId)
    .in("weekly_plan_id", planIds);

  return (data ?? []).map(mapAllocation);
}

export async function sumAllocatedHoursForUser(
  userId: string,
  weekStart: string,
): Promise<number> {
  const allocations = await getUserAllocationsForWeek(userId, weekStart);
  return allocations.reduce((sum, a) => sum + a.allocatedHours, 0);
}

export async function updateProfileRole(
  userId: string,
  role: TeamMember["role"],
): Promise<void> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const { error } = await db
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}
