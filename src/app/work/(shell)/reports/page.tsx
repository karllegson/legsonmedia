import { redirect } from "next/navigation";
import { ReportsView } from "@/components/work/ReportsView";
import { getWorkSession, requireWorkManager } from "@/lib/work/auth.server";
import { getMondayOfWeek, isOwnerRole } from "@/lib/work/roles";
import {
  buildBillingCsv,
  getClientUtilizationReport,
  getSpecialistUtilizationReport,
  getTimeEntriesExport,
} from "@/lib/work/reports.server";

type ReportsPageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function WorkReportsPage({ searchParams }: ReportsPageProps) {
  const session = await getWorkSession();
  if (!session) {
    return null;
  }

  try {
    await requireWorkManager();
  } catch {
    redirect("/work");
  }

  const params = await searchParams;
  const weekStart = params.week ?? getMondayOfWeek();
  const isOwner = isOwnerRole(session.profile.role);

  const [clientReportRaw, specialistReport, timeCsv] = await Promise.all([
    getClientUtilizationReport(weekStart),
    getSpecialistUtilizationReport(weekStart),
    getTimeEntriesExport(weekStart),
  ]);

  const clientReport = isOwner
    ? clientReportRaw
    : clientReportRaw.map((row) => ({
        ...row,
        hourlyRate: 0,
        billableAmount: 0,
      }));

  const billingCsv = isOwner
    ? buildBillingCsv(clientReportRaw, weekStart)
    : "";

  return (
    <ReportsView
      weekStart={weekStart}
      clientReport={clientReport}
      specialistReport={specialistReport}
      billingCsv={billingCsv}
      timeCsv={timeCsv}
      role={session.profile.role}
    />
  );
}
