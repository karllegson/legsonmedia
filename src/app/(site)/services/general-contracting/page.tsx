import type { Metadata } from "next";
import PagePlaceholder from "@/components/site/PagePlaceholder";
import { buildPageMetadata } from "@/lib/site/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "General Contracting",
  description:
    "Full-service general contracting — project management, new construction, and remodeling from a licensed contractor.",
  path: "/services/general-contracting",
});

export default function GeneralContractingPage() {
  return <PagePlaceholder title="General Contracting" />;
}
