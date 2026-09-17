"use client";

import {
  BarChart3,
  Briefcase,
  CalendarRange,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { workLogout } from "@/app/work/actions";
import { workNavGroupLabels, type WorkNavItem } from "@/lib/work/config";
import { formatWorkRole } from "@/lib/work/roles";
import type { WorkRole } from "@/lib/work/types";

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  clock: Timer,
  tasks: ListChecks,
  messages: MessageSquare,
  clients: Briefcase,
  planning: CalendarRange,
  team: Users,
  reports: BarChart3,
};

type WorkSidebarProps = {
  navItems: WorkNavItem[];
  displayName: string | null;
  userEmail: string | null;
  role: WorkRole;
  openTaskCount: number;
  isClockedIn: boolean;
};

function getInitials(displayName: string | null, email: string | null) {
  const source = displayName || email || "T";
  const parts = source.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function isActive(href: string, pathname: string) {
  if (href === "/work") {
    return pathname === "/work";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkSidebar({
  navItems,
  displayName,
  userEmail,
  role,
  openTaskCount,
  isClockedIn,
}: WorkSidebarProps) {
  const pathname = usePathname();
  const groups = ["workspace", "operations"] as const;

  return (
    <aside className="wk-sidebar">
      <Link href="/work" className="wk-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="wk-brand-mark" />
        <span className="wk-brand-text">
          <span className="wk-brand-name">Legson Media</span>
          <span className="wk-brand-sub">Work Portal</span>
        </span>
      </Link>

      <nav className="wk-nav" aria-label="Work portal navigation">
        {groups.map((group) => {
          const items = navItems.filter((item) => item.group === group);
          if (!items.length) {
            return null;
          }

          return (
            <div key={group}>
              <p className="wk-nav-group-label">{workNavGroupLabels[group]}</p>
              {items.map((item) => {
                const Icon = iconMap[item.icon];
                const active = isActive(item.href, pathname);
                const showTaskCount = item.href === "/work/tasks" && openTaskCount > 0;
                const showClockDot = item.href === "/work/clock" && isClockedIn;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={`wk-nav-link${active ? " is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {Icon ? <Icon size={17} strokeWidth={1.9} aria-hidden /> : null}
                    <span>{item.label}</span>
                    {showTaskCount ? (
                      <span className="wk-nav-badge">{openTaskCount}</span>
                    ) : null}
                    {showClockDot ? (
                      <span className="wk-nav-badge" aria-label="Clocked in">
                        ●
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="wk-sidebar-foot">
        <div className="wk-user">
          <span className="wk-avatar" aria-hidden>
            {getInitials(displayName, userEmail)}
          </span>
          <span className="wk-user-meta">
            <span className="wk-user-name">
              {displayName || userEmail?.split("@")[0] || "Team member"}
            </span>
            <span className="wk-user-role">{formatWorkRole(role)}</span>
          </span>
        </div>

        <form action={workLogout}>
          <button type="submit" className="wk-signout">
            <LogOut size={15} strokeWidth={1.9} aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
