import { isAuthBypassEnabled } from "@/lib/admin/auth";
import { requireCmsAdmin } from "@/lib/work/auth.server";

export async function assertCmsAdminAuth(): Promise<void> {
  if (isAuthBypassEnabled()) {
    return;
  }

  await requireCmsAdmin();
}
