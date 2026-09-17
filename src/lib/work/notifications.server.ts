import { createAdminClient } from "@/lib/supabase/admin";
import { listMessageThreadsForUser, markThreadRead } from "./messages.server";
import { isOwnerRole } from "./roles";
import {
  describeEditRequest,
  listPendingTimeEditRequests,
  listTimeEditRequestsForUser,
} from "./timeEditRequests.server";
import type { WorkRole } from "./types";
import type { WorkNotification } from "./notifications";

const BUCKET = "work-clock";
const READ_PREFIX = "notif-read";

async function ensureBucket(
  db: ReturnType<typeof createAdminClient>,
): Promise<void> {
  const { data: buckets } = await db.storage.listBuckets();
  if (buckets?.some((bucket) => bucket.name === BUCKET)) {
    return;
  }
  const { error } = await db.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: "1MB",
  });
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(error.message);
  }
}

async function readDismissedIds(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<Set<string>> {
  await ensureBucket(db);
  const { data, error } = await db.storage
    .from(BUCKET)
    .download(`${READ_PREFIX}/${userId}.json`);
  if (error || !data) {
    return new Set();
  }
  try {
    const parsed = JSON.parse(await data.text()) as { ids?: string[] };
    return new Set(Array.isArray(parsed.ids) ? parsed.ids : []);
  } catch {
    return new Set();
  }
}

async function writeDismissedIds(
  db: ReturnType<typeof createAdminClient>,
  userId: string,
  ids: Set<string>,
): Promise<void> {
  await ensureBucket(db);
  const trimmed = Array.from(ids).slice(0, 200);
  const { error } = await db.storage.from(BUCKET).upload(
    `${READ_PREFIX}/${userId}.json`,
    JSON.stringify({ ids: trimmed }),
    { contentType: "application/json", upsert: true },
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function listWorkNotifications(input: {
  userId: string;
  role: WorkRole;
}): Promise<WorkNotification[]> {
  const db = createAdminClient();
  const dismissed = await readDismissedIds(db, input.userId);
  const items: WorkNotification[] = [];

  try {
    const threads = await listMessageThreadsForUser(input.userId);
    for (const thread of threads) {
      if (!thread.unread) {
        continue;
      }
      const last = thread.messages[thread.messages.length - 1];
      if (!last || last.mine) {
        continue;
      }
      const id = `msg:${thread.id}:${last.id}`;
      items.push({
        id,
        title: thread.title,
        body: `${last.author}: ${last.body}`,
        href: `/work/messages?thread=${thread.id}`,
        createdAt: last.createdAt,
        read: dismissed.has(id),
        kind: "message",
      });
    }
  } catch {
    // Messaging unavailable — skip message notifications.
  }

  if (isOwnerRole(input.role)) {
    try {
      const pending = await listPendingTimeEditRequests();
      for (const request of pending) {
        const id = `edit-pending:${request.id}`;
        items.push({
          id,
          title: "Time edit request",
          body: `${request.requesterName || "Teammate"} · ${request.clientName} · ${describeEditRequest(request)}`,
          href: "/work/clock#time-approvals",
          createdAt: request.createdAt,
          read: dismissed.has(id),
          kind: "time",
        });
      }
    } catch {
      // Ignore store errors.
    }
  } else {
    try {
      const mine = await listTimeEditRequestsForUser(input.userId);
      for (const request of mine) {
        if (request.status === "pending" || !request.resolvedAt) {
          continue;
        }
        const id = `edit-result:${request.id}`;
        items.push({
          id,
          title:
            request.status === "approved"
              ? "Time edit approved"
              : "Time edit denied",
          body: `${request.clientName} · ${describeEditRequest(request)}`,
          href: "/work/clock#my-time",
          createdAt: request.resolvedAt,
          read: dismissed.has(id),
          kind: "time",
        });
      }
    } catch {
      // Ignore store errors.
    }
  }

  return items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function markWorkNotificationsRead(input: {
  userId: string;
  ids: string[];
}): Promise<void> {
  if (input.ids.length === 0) {
    return;
  }
  const db = createAdminClient();
  const dismissed = await readDismissedIds(db, input.userId);
  for (const id of input.ids) {
    dismissed.add(id);
    if (id.startsWith("msg:")) {
      const threadId = id.split(":")[1];
      if (threadId) {
        try {
          await markThreadRead({ threadId, userId: input.userId });
        } catch {
          // Ignore thread read failures.
        }
      }
    }
  }
  await writeDismissedIds(db, input.userId, dismissed);
}
