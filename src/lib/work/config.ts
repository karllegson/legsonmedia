import type { WorkRole } from "./types";
import { isManagerRole } from "./roles";

export type WorkNavItem = {
  href: string;
  label: string;
  icon: string;
  group: "workspace" | "operations";
  managerOnly?: boolean;
};

export const workNavItems: WorkNavItem[] = [
  {
    href: "/work",
    label: "Dashboard",
    icon: "dashboard",
    group: "workspace",
  },
  {
    href: "/work/clock",
    label: "Time Clock",
    icon: "clock",
    group: "workspace",
  },
  {
    href: "/work/tasks",
    label: "Tasks",
    icon: "tasks",
    group: "workspace",
  },
  {
    href: "/work/messages",
    label: "Messages",
    icon: "messages",
    group: "workspace",
  },
  {
    href: "/work/clients",
    label: "Clients",
    icon: "clients",
    group: "operations",
    managerOnly: true,
  },
  {
    href: "/work/planning",
    label: "Planning",
    icon: "planning",
    group: "operations",
    managerOnly: true,
  },
  {
    href: "/work/team",
    label: "Team",
    icon: "team",
    group: "operations",
    managerOnly: true,
  },
  {
    href: "/work/reports",
    label: "Reports",
    icon: "reports",
    group: "operations",
    managerOnly: true,
  },
];

export const workNavGroupLabels: Record<WorkNavItem["group"], string> = {
  workspace: "My Workspace",
  operations: "Operations",
};

type PageMeta = { title: string; eyebrow: string };

export const workPageMeta: Record<string, PageMeta> = {
  "/work": { title: "Dashboard", eyebrow: "Overview" },
  "/work/clock": { title: "Time Clock", eyebrow: "Track your hours" },
  "/work/tasks": { title: "Tasks", eyebrow: "Your work queue" },
  "/work/messages": { title: "Messages", eyebrow: "Team chat" },
  "/work/clients": { title: "Clients", eyebrow: "Retainers & contracts" },
  "/work/planning": { title: "Weekly Planning", eyebrow: "Allocate retainer hours" },
  "/work/team": { title: "Team", eyebrow: "Roster & live activity" },
  "/work/reports": { title: "Reports", eyebrow: "Utilization & billing" },
};

export function getWorkNavForRole(role: WorkRole): WorkNavItem[] {
  if (isManagerRole(role)) {
    return workNavItems;
  }

  return workNavItems.filter((item) => !item.managerOnly);
}
