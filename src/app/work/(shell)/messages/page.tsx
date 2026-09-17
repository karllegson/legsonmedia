import { MessagesView } from "@/components/work/MessagesView";
import { getWorkSession } from "@/lib/work/auth.server";
import {
  listActiveTeammates,
  listMessageThreadsForUser,
} from "@/lib/work/messages.server";

type WorkMessagesPageProps = {
  searchParams: Promise<{ thread?: string }>;
};

export default async function WorkMessagesPage({
  searchParams,
}: WorkMessagesPageProps) {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  const query = await searchParams;
  const currentUserName =
    session.profile.displayName ||
    session.email?.split("@")[0] ||
    "You";

  let threads: Awaited<ReturnType<typeof listMessageThreadsForUser>> = [];
  let teammates: Awaited<ReturnType<typeof listActiveTeammates>> = [];

  try {
    [threads, teammates] = await Promise.all([
      listMessageThreadsForUser(session.userId),
      listActiveTeammates(),
    ]);
  } catch {
    threads = [];
    teammates = [];
  }

  return (
    <MessagesView
      currentUserId={session.userId}
      currentUserName={currentUserName}
      initialThreads={threads}
      teammates={teammates}
      initialThreadId={query.thread}
    />
  );
}
