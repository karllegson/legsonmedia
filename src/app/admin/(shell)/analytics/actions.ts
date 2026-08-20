"use server";

import { assertCmsAdminAuth as assertAdminAuth } from "@/lib/admin/cmsAuth.server";
import { getSiteAnalyticsSummary } from "@/lib/analytics/server";
import type { SiteAnalyticsSummary } from "@/lib/analytics/types";

export async function fetchAnalyticsSummary(periodDays = 30): Promise<SiteAnalyticsSummary> {
  await assertAdminAuth();
  return getSiteAnalyticsSummary(periodDays);
}
