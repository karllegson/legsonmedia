export type ContactFormType = "estimate" | "contact";

export type ContactSubmissionInput = {
  name: string;
  phone: string;
  city?: string;
  service?: string;
  message?: string;
  pagePath?: string;
  formType?: ContactFormType;
};

export type ContactSubmission = {
  id: string;
  name: string;
  phone: string;
  city: string;
  service: string;
  message: string;
  pagePath: string;
  formType: ContactFormType;
  isRead: boolean;
  createdAt: string;
};

export const CONTACT_FORM_SERVICE_LABELS: Record<string, string> = {
  website: "Website Creation",
  seo: "SEO & Rankings",
  "photo-video": "Photo & Video",
  "real-estate": "Real Estate Media",
  "social-media": "Social Media Management",
  content: "Content Creation",
  other: "Something Else",
};

export function formatContactService(value: string): string {
  if (!value.trim()) {
    return "—";
  }

  return CONTACT_FORM_SERVICE_LABELS[value] ?? value;
}

export function formatContactFormType(formType: ContactFormType): string {
  return formType === "contact" ? "Contact Us" : "Free Estimate";
}
