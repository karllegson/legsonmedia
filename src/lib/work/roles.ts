import type { WorkRole } from "./types";

export const WORK_ROLES: WorkRole[] = [
  "owner",
  "operations_manager",
  "specialist",
];

export function isManagerRole(role: WorkRole): boolean {
  return role === "owner" || role === "operations_manager";
}

export function isOwnerRole(role: WorkRole): boolean {
  return role === "owner";
}

export function formatWorkRole(role: WorkRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "operations_manager":
      return "Operations Manager";
    case "specialist":
      return "Specialist";
  }
}

export function getMondayOfWeek(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function addWeeks(isoDate: string, weeks: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

export function formatHours(hours: number): string {
  if (Number.isInteger(hours)) {
    return `${hours}h`;
  }
  return `${hours.toFixed(1)}h`;
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) {
    return `${m}m`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
