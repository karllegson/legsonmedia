import { notFound, redirect } from "next/navigation";
import { ClientWeekDetail } from "@/components/work/ClientWeekDetail";
import { getWorkSession, requireWorkManager } from "@/lib/work/auth.server";
import {
  getClientBySlug,
  getClientWeekBreakdown,
} from "@/lib/work/clientDetail.server";
import { getMondayOfWeek } from "@/lib/work/roles";

type ClientDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ week?: string }>;
};

export default async function WorkClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  try {
    await requireWorkManager();
  } catch {
    redirect("/work");
  }

  const { slug } = await params;
  const query = await searchParams;
  const weekStart = query.week ?? getMondayOfWeek();

  const client = await getClientBySlug(slug);
  if (!client) {
    notFound();
  }

  const breakdown = await getClientWeekBreakdown(client.id, weekStart);
  if (!breakdown) {
    notFound();
  }

  return (
    <ClientWeekDetail
      breakdown={breakdown}
      weekStart={weekStart}
      role={session.profile.role}
    />
  );
}
