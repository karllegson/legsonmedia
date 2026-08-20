import { redirect } from "next/navigation";
import { ReportsView } from "@/components/work/ReportsView";
import { getWorkSession, requireWorkManager } from "@/lib/work/auth.server";
import { getMondayOfWeek } from "@/lib/work/roles";
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

  const [clientReport, specialistReport, timeCsv] = await Promise.all([
    getClientUtilizationReport(weekStart),
    getSpecialistUtilizationReport(weekStart),
    getTimeEntriesExport(weekStart),
  ]);

  const billingCsv = buildBillingCsv(clientReport, weekStart);

  return (
    <ReportsView
      weekStart={weekStart}
      clientReport={clientReport}
      specialistReport={specialistReport}
      billingCsv={billingCsv}
      timeCsv={timeCsv}
    />
  );
}
