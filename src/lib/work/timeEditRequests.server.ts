import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDuration } from "./roles";

export type TimeEditRequestStatus = "pending" | "approved" | "denied";

export type TimeEditRequest = {
  id: string;
  entryId: string;
  requesterId: string;
  requesterName: string | null;
  clientName: string;
  status: TimeEditRequestStatus;
  currentMinutes: number;
  proposedHours: number;
  proposedMinutes: number;
  proposedNotes: string;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
};

type StoredRequest = {
  id: string;
  entryId: string;
  requesterId: string;
  clientName: string;
  status: TimeEditRequestStatus;
  currentMinutes: number;
  proposedHours: number;
  proposedMinutes: number;
  proposedNotes: string;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
};

type RequestStore = {
  requests: StoredRequest[];
};

const BUCKET = "work-clock";
const STORE_PATH = "time-edit-requests.json";

function emptyStore(): RequestStore {
  return { requests: [] };
}

async function ensureBucket(
  db: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const { data: buckets } = await db.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.name === BUCKET)) {
    return;
  }
  const { error } = await db.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: "2MB",
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(error.message);
  }
}

async function readStore(
  db: ReturnType<typeof createAdminClient>,
): Promise<RequestStore> {
  await ensureBucket(db);
  const { data, error } = await db.storage.from(BUCKET).download(STORE_PATH);
  if (error) {
    if (
      /not found|does not exist|404/i.test(error.message) ||
      error.message.includes("Object not found")
    ) {
      return emptyStore();
    }
    throw new Error(error.message);
  }
  try {
    const parsed = JSON.parse(await data.text()) as RequestStore;
    return {
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(
  db: ReturnType<typeof createAdminClient>,
  store: RequestStore,
): Promise<void> {
  await ensureBucket(db);
  const { error } = await db.storage.from(BUCKET).upload(
    STORE_PATH,
    JSON.stringify(store, null, 2),
    { contentType: "application/json", upsert: true },
  );
  if (error) {
    throw new Error(error.message);
  }
}

async function loadNames(
  db: ReturnType<typeof createAdminClient>,
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

function mapRequest(
  row: StoredRequest,
  names: Map<string, string | null>,
): TimeEditRequest {
  return {
    ...row,
    requesterName: names.get(row.requesterId) ?? null,
  };
}

export async function createTimeEditRequest(input: {
  entryId: string;
  requesterId: string;
  proposedHours: number;
  proposedMinutes: number;
  proposedNotes: string;
  reason: string;
}): Promise<TimeEditRequest> {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Explain what needs to change");
  }

  const hours = Number(input.proposedHours) || 0;
  const minutesPart = Number(input.proposedMinutes) || 0;
  const totalMinutes = Math.round(hours * 60 + minutesPart);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    throw new Error("Proposed time must be greater than 0");
  }

  const db = createAdminClient();
  const { data: entry, error } = await db
    .from("time_entries")
    .select("id, user_id, clock_out, duration_minutes, notes, clients(name)")
    .eq("id", input.entryId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!entry) {
    throw new Error("Time entry not found");
  }
  if (entry.user_id !== input.requesterId) {
    throw new Error("You can only request edits on your own time");
  }
  if (!entry.clock_out) {
    throw new Error("Clock out first, then request an edit");
  }

  const clients = entry.clients as
    | { name: string }
    | { name: string }[]
    | null;
  const clientName = Array.isArray(clients)
    ? clients[0]?.name
    : clients?.name;

  const store = await readStore(db);
  const existingPending = store.requests.find(
    (item) =>
      item.entryId === input.entryId &&
      item.requesterId === input.requesterId &&
      item.status === "pending",
  );
  if (existingPending) {
    throw new Error("You already have a pending request for this entry");
  }

  const now = new Date().toISOString();
  const row: StoredRequest = {
    id: randomUUID(),
    entryId: input.entryId,
    requesterId: input.requesterId,
    clientName: clientName ?? "Client",
    status: "pending",
    currentMinutes: Number(entry.duration_minutes ?? 0),
    proposedHours: hours,
    proposedMinutes: minutesPart,
    proposedNotes: input.proposedNotes.trim() || String(entry.notes ?? ""),
    reason,
    createdAt: now,
    resolvedAt: null,
    resolvedBy: null,
    resolutionNote: null,
  };

  store.requests.unshift(row);
  await writeStore(db, store);

  const names = await loadNames(db, [input.requesterId]);
  return mapRequest(row, names);
}

export async function listPendingTimeEditRequests(): Promise<TimeEditRequest[]> {
  const db = createAdminClient();
  const store = await readStore(db);
  const pending = store.requests.filter((item) => item.status === "pending");
  const names = await loadNames(
    db,
    pending.map((item) => item.requesterId),
  );
  return pending.map((item) => mapRequest(item, names));
}

export async function listTimeEditRequestsForUser(
  userId: string,
): Promise<TimeEditRequest[]> {
  const db = createAdminClient();
  const store = await readStore(db);
  const mine = store.requests.filter((item) => item.requesterId === userId);
  const names = await loadNames(db, [userId]);
  return mine.map((item) => mapRequest(item, names));
}

export async function getTimeEditRequest(
  requestId: string,
): Promise<TimeEditRequest | null> {
  const db = createAdminClient();
  const store = await readStore(db);
  const row = store.requests.find((item) => item.id === requestId);
  if (!row) {
    return null;
  }
  const names = await loadNames(db, [row.requesterId]);
  return mapRequest(row, names);
}

export async function resolveTimeEditRequest(input: {
  requestId: string;
  resolverId: string;
  status: "approved" | "denied";
  resolutionNote?: string;
}): Promise<TimeEditRequest> {
  const db = createAdminClient();
  const store = await readStore(db);
  const row = store.requests.find((item) => item.id === input.requestId);
  if (!row) {
    throw new Error("Request not found");
  }
  if (row.status !== "pending") {
    throw new Error("This request was already resolved");
  }

  row.status = input.status;
  row.resolvedAt = new Date().toISOString();
  row.resolvedBy = input.resolverId;
  row.resolutionNote = input.resolutionNote?.trim() || null;

  await writeStore(db, store);
  const names = await loadNames(db, [row.requesterId]);
  return mapRequest(row, names);
}

export function describeEditRequest(request: TimeEditRequest): string {
  const proposed = formatDuration(
    Math.round(request.proposedHours * 60 + request.proposedMinutes),
  );
  const current = formatDuration(request.currentMinutes);
  return `${current} → ${proposed}`;
}
