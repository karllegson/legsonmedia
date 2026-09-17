"use client";

import { ExternalLink, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkNotifications } from "@/components/work/WorkNotifications";
import { workPageMeta } from "@/lib/work/config";

type WorkTopbarProps = {
  activeClientName: string | null;
};

export function WorkTopbar({ activeClientName }: WorkTopbarProps) {
  const pathname = usePathname();
  const meta =
    workPageMeta[pathname] ??
    (pathname.startsWith("/work/clients/")
      ? { title: "Client hours", eyebrow: "Weekly breakdown" }
      : { title: "Work", eyebrow: "Portal" });
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const onClockPage = pathname === "/work/clock";

  return (
    <header className="wk-topbar">
      <div className="wk-topbar-titles">
        <p className="wk-topbar-eyebrow">{meta.eyebrow}</p>
        <h1 className="wk-topbar-title">{meta.title}</h1>
      </div>

      <div className="wk-topbar-right">
        <span className="wk-badge" title={today}>
          {today}
        </span>

        {activeClientName ? (
          <Link href="/work/clock" className="wk-badge wk-badge-accent">
            <Timer size={13} strokeWidth={2.1} aria-hidden />
            On the clock &middot; {activeClientName}
          </Link>
        ) : onClockPage ? null : (
          <Link href="/work/clock" className="wk-btn wk-btn-ghost">
            <Timer size={15} strokeWidth={2} aria-hidden />
            Clock in
          </Link>
        )}

        <WorkNotifications />

        <Link
          href="/"
          target="_blank"
          className="wk-icon-btn"
          title="View website"
          aria-label="View website"
        >
          <ExternalLink size={15} strokeWidth={1.9} aria-hidden />
        </Link>
      </div>
    </header>
  );
}
