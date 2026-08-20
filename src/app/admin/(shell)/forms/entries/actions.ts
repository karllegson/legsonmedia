"use server";

import { assertCmsAdminAuth as assertAdminAuth } from "@/lib/admin/cmsAuth.server";
import {
  deleteContactSubmission,
  listContactSubmissions,
  markContactSubmissionRead,
} from "@/lib/contact/submissions.server";
import type { ContactSubmission } from "@/lib/contact/submissions.types";

export async function fetchContactSubmissions(): Promise<{
  available: boolean;
  message?: string;
  submissions: ContactSubmission[];
}> {
  await assertAdminAuth();
  return listContactSubmissions();
}

export async function setContactSubmissionReadAction(
  id: string,
  isRead: boolean,
): Promise<boolean> {
  await assertAdminAuth();
  return markContactSubmissionRead(id, isRead);
}

export async function deleteContactSubmissionAction(id: string): Promise<boolean> {
  await assertAdminAuth();
  return deleteContactSubmission(id);
}
