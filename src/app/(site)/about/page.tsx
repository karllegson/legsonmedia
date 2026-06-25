import type { Metadata } from "next";
import PagePlaceholder from "@/components/site/PagePlaceholder";
import { teamMembers } from "@/lib/site/config";
import { buildPageMetadata } from "@/lib/site/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "About Us",
  description:
    "Learn about Legson Media — our story, team, and commitment to quality service.",
  path: "/about",
});

export default function AboutPage() {
  const member = teamMembers[0];

  return (
    <>
      <PagePlaceholder title="About Legson Media" />
      {member ? (
        <div id={member.id} className="site-container scroll-mt-28 pb-24">
          <div className="mx-auto max-w-2xl rounded-2xl border border-solid border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-site-accent">
              {member.role}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-site-text-dark">{member.name}</h2>
            {member.profile?.bio ? (
              <p className="mt-4 leading-relaxed text-site-text">{member.profile.bio}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
