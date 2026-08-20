import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isWorkDevBypass } from "./auth.server";
import type {
  Client,
  ClientRetainer,
  ClientWithRetainer,
  ServiceCategory,
} from "./types";

function mapClient(row: Record<string, unknown>): Client {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    isActive: row.is_active as boolean,
    notes: (row.notes as string | null) ?? null,
  };
}

function mapRetainer(row: Record<string, unknown>): ClientRetainer {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    hoursPerWeek: Number(row.hours_per_week),
    hourlyRate: Number(row.hourly_rate),
    billingPeriod: row.billing_period as "weekly" | "monthly",
    effectiveFrom: row.effective_from as string,
    effectiveTo: (row.effective_to as string | null) ?? null,
  };
}

function mapServiceCategory(row: Record<string, unknown>): ServiceCategory {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    sortOrder: row.sort_order as number,
  };
}

async function getDb() {
  if (isWorkDevBypass()) {
    return createAdminClient();
  }
  return await createClient();
}

export const listServiceCategories = cache(async (): Promise<ServiceCategory[]> => {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data } = await db
    .from("service_categories")
    .select("*")
    .order("sort_order");

  return (data ?? []).map(mapServiceCategory);
});

export const listClients = cache(async (): Promise<Client[]> => {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data } = await db
    .from("clients")
    .select("*")
    .order("name");

  return (data ?? []).map(mapClient);
});

export async function listActiveClients(): Promise<Client[]> {
  const clients = await listClients();
  return clients.filter((c) => c.isActive);
}

export async function getClientById(id: string): Promise<Client | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const { data } = await db.from("clients").select("*").eq("id", id).maybeSingle();
  return data ? mapClient(data) : null;
}

export const listClientsWithRetainers = cache(async (): Promise<ClientWithRetainer[]> => {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const { data: clients } = await db.from("clients").select("*").order("name");
  const { data: retainers } = await db
    .from("client_retainers")
    .select("*")
    .is("effective_to", null);

  const retainerByClient = new Map<string, ClientRetainer>();
  for (const row of retainers ?? []) {
    retainerByClient.set(row.client_id as string, mapRetainer(row));
  }

  return (clients ?? []).map((row) => ({
    ...mapClient(row),
    retainer: retainerByClient.get(row.id as string) ?? null,
  }));
});

export async function getCurrentRetainer(
  clientId: string,
): Promise<ClientRetainer | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  const { data } = await db
    .from("client_retainers")
    .select("*")
    .eq("client_id", clientId)
    .is("effective_to", null)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapRetainer(data) : null;
}

export async function upsertClient(input: {
  id?: string;
  name: string;
  slug: string;
  notes?: string;
  isActive?: boolean;
}): Promise<Client> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const payload = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    notes: input.notes?.trim() || null,
    is_active: input.isActive ?? true,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await db
      .from("clients")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) {
      throw error;
    }
    return mapClient(data);
  }

  const { data, error } = await db
    .from("clients")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    throw error;
  }
  return mapClient(data);
}

export async function upsertRetainer(input: {
  clientId: string;
  hoursPerWeek: number;
  hourlyRate: number;
  billingPeriod?: "weekly" | "monthly";
}): Promise<ClientRetainer> {
  const db = createAdminClient();
  if (!db) {
    throw new Error("Database not configured");
  }

  const today = new Date().toISOString().slice(0, 10);

  await db
    .from("client_retainers")
    .update({ effective_to: today, updated_at: new Date().toISOString() })
    .eq("client_id", input.clientId)
    .is("effective_to", null);

  const { data, error } = await db
    .from("client_retainers")
    .insert({
      client_id: input.clientId,
      hours_per_week: input.hoursPerWeek,
      hourly_rate: input.hourlyRate,
      billing_period: input.billingPeriod ?? "weekly",
      effective_from: today,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapRetainer(data);
}
