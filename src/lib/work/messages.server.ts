import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWorkDevBypass } from "./auth.server";
import type { TeamMember } from "./types";

export type WorkChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  author: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type WorkChatThread = {
  id: string;
  title: string;
  participants: string[];
  memberIds: string[];
  preview: string;
  updatedAt: string;
  unread: boolean;
  messages: WorkChatMessage[];
};

type StoredMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
};

type StoredThread = {
  id: string;
  title: string;
  createdBy: string;
  memberIds: string[];
  updatedAt: string;
  createdAt: string;
  messages: StoredMessage[];
  lastReadAt: Record<string, string>;
};

type MessageStore = {
  threads: StoredThread[];
};

const BUCKET = "work-chat";
const STORE_PATH = "messages-store.json";

function emptyStore(): MessageStore {
  return { threads: [] };
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
): Promise<MessageStore> {
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

  const text = await data.text();
  if (!text.trim()) {
    return emptyStore();
  }

  try {
    const parsed = JSON.parse(text) as MessageStore;
    return {
      threads: Array.isArray(parsed.threads) ? parsed.threads : [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(
  db: ReturnType<typeof createAdminClient>,
  store: MessageStore,
): Promise<void> {
  await ensureBucket(db);
  const payload = JSON.stringify(store, null, 2);
  const { error } = await db.storage.from(BUCKET).upload(STORE_PATH, payload, {
    contentType: "application/json",
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function profileNamesById(
  db: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) {
    return new Map();
  }

  const { data } = await db
    .from("profiles")
    .select("id, display_name")
    .in("id", unique);

  return new Map(
    (data ?? []).map((row) => [
      row.id as string,
      ((row.display_name as string | null)?.trim() || "Teammate"),
    ]),
  );
}

function mapThread(
  thread: StoredThread,
  userId: string,
  names: Map<string, string>,
): WorkChatThread {
  const messages = thread.messages.map((message) => ({
    id: message.id,
    threadId: thread.id,
    senderId: message.senderId,
    author: names.get(message.senderId) ?? "Teammate",
    body: message.body,
    createdAt: message.createdAt,
    mine: message.senderId === userId,
  }));

  const lastMessage = messages[messages.length - 1];
  const lastReadAt = thread.lastReadAt[userId];
  const unread = Boolean(
    lastMessage &&
      !lastMessage.mine &&
      (!lastReadAt ||
        new Date(lastMessage.createdAt).getTime() >
          new Date(lastReadAt).getTime()),
  );

  return {
    id: thread.id,
    title: thread.title,
    participants: thread.memberIds.map(
      (id) => names.get(id) ?? "Teammate",
    ),
    memberIds: thread.memberIds,
    preview: lastMessage?.body ?? "No messages yet",
    updatedAt: thread.updatedAt,
    unread,
    messages,
  };
}

export async function listMessageThreadsForUser(
  userId: string,
): Promise<WorkChatThread[]> {
  if (isWorkDevBypass()) {
    return [];
  }

  const db = createAdminClient();
  const store = await readStore(db);
  const mine = store.threads
    .filter((thread) => thread.memberIds.includes(userId))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const names = await profileNamesById(
    db,
    mine.flatMap((thread) => [
      ...thread.memberIds,
      ...thread.messages.map((message) => message.senderId),
    ]),
  );

  return mine.map((thread) => mapThread(thread, userId, names));
}

export async function listActiveTeammates(): Promise<
  Array<Pick<TeamMember, "id" | "displayName" | "email">>
> {
  const db = createAdminClient();
  const { data: profiles, error } = await db
    .from("profiles")
    .select("id, display_name")
    .eq("is_active", true)
    .order("display_name");

  if (error) {
    throw error;
  }

  const { data: authData } = await db.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const emailById = new Map(
    (authData?.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );

  return (profiles ?? []).map((row) => ({
    id: row.id as string,
    displayName: (row.display_name as string | null) ?? null,
    email: emailById.get(row.id as string) ?? "",
  }));
}

export async function createGroupChat(input: {
  title: string;
  createdBy: string;
  memberIds: string[];
}): Promise<string> {
  if (isWorkDevBypass()) {
    throw new Error("Sign in with a real account to use messaging.");
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error("Enter a group name");
  }

  const memberIds = Array.from(
    new Set([input.createdBy, ...input.memberIds.filter(Boolean)]),
  );

  if (memberIds.length < 2) {
    throw new Error("Add at least one teammate to the group");
  }

  const db = createAdminClient();
  const store = await readStore(db);
  const now = new Date().toISOString();
  const threadId = randomUUID();

  store.threads.unshift({
    id: threadId,
    title,
    createdBy: input.createdBy,
    memberIds,
    createdAt: now,
    updatedAt: now,
    messages: [],
    lastReadAt: { [input.createdBy]: now },
  });

  await writeStore(db, store);
  return threadId;
}

export async function sendThreadMessage(input: {
  threadId: string;
  senderId: string;
  body: string;
}): Promise<void> {
  if (isWorkDevBypass()) {
    throw new Error("Sign in with a real account to use messaging.");
  }

  const body = input.body.trim();
  if (!body) {
    throw new Error("Message can’t be empty");
  }

  const db = createAdminClient();
  const store = await readStore(db);
  const thread = store.threads.find((item) => item.id === input.threadId);

  if (!thread) {
    throw new Error("Chat not found");
  }

  if (!thread.memberIds.includes(input.senderId)) {
    throw new Error("You’re not in this chat");
  }

  const createdAt = new Date().toISOString();
  thread.messages.push({
    id: randomUUID(),
    senderId: input.senderId,
    body,
    createdAt,
  });
  thread.updatedAt = createdAt;
  thread.lastReadAt[input.senderId] = createdAt;

  await writeStore(db, store);
}

export async function markThreadRead(input: {
  threadId: string;
  userId: string;
}): Promise<void> {
  if (isWorkDevBypass()) {
    return;
  }

  const db = createAdminClient();
  const store = await readStore(db);
  const thread = store.threads.find((item) => item.id === input.threadId);

  if (!thread || !thread.memberIds.includes(input.userId)) {
    return;
  }

  thread.lastReadAt[input.userId] = new Date().toISOString();
  await writeStore(db, store);
}

export async function deleteGroupChat(input: {
  threadId: string;
  userId: string;
}): Promise<void> {
  if (isWorkDevBypass()) {
    throw new Error("Sign in with a real account to use messaging.");
  }

  const db = createAdminClient();
  const store = await readStore(db);
  const thread = store.threads.find((item) => item.id === input.threadId);

  if (!thread) {
    throw new Error("Chat not found");
  }

  if (!thread.memberIds.includes(input.userId)) {
    throw new Error("You’re not in this chat");
  }

  store.threads = store.threads.filter((item) => item.id !== input.threadId);
  await writeStore(db, store);
}
