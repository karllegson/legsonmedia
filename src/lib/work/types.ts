export type WorkRole = "owner" | "operations_manager" | "specialist";

export type WorkProfile = {
  id: string;
  displayName: string | null;
  role: WorkRole;
  isActive: boolean;
};

export type ServiceCategory = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

export type Client = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  notes: string | null;
};

export type ClientRetainer = {
  id: string;
  clientId: string;
  hoursPerWeek: number;
  hourlyRate: number;
  billingPeriod: "weekly" | "monthly";
  effectiveFrom: string;
  effectiveTo: string | null;
};

export type WeeklyPlanStatus = "draft" | "published";

export type WeeklyPlan = {
  id: string;
  clientId: string;
  weekStart: string;
  status: WeeklyPlanStatus;
  notes: string | null;
};

export type WeeklyPlanLine = {
  id: string;
  weeklyPlanId: string;
  serviceCategoryId: string;
  plannedHours: number;
};

export type SpecialistAllocation = {
  id: string;
  weeklyPlanId: string;
  userId: string;
  serviceCategoryId: string;
  allocatedHours: number;
  notes: string | null;
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "normal" | "high";

export type WorkTask = {
  id: string;
  clientId: string;
  assignedTo: string;
  serviceCategoryId: string | null;
  weeklyPlanId: string | null;
  title: string;
  description: string | null;
  estimatedHours: number | null;
  status: TaskStatus;
  dueDate: string | null;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
};

export type TimeEntry = {
  id: string;
  userId: string;
  clientId: string;
  taskId: string | null;
  serviceCategoryId: string | null;
  clockIn: string;
  clockOut: string | null;
  durationMinutes: number | null;
  notes: string | null;
};

export type TeamMember = {
  id: string;
  displayName: string | null;
  email: string;
  role: WorkRole;
  isActive: boolean;
};

export type ClientWithRetainer = Client & {
  retainer: ClientRetainer | null;
};

export type ClientUtilization = {
  clientId: string;
  clientSlug: string;
  clientName: string;
  retainerHours: number;
  hourlyRate: number;
  plannedHours: number;
  loggedHours: number;
  remainingHours: number;
  billableAmount: number;
};

export type SpecialistUtilization = {
  userId: string;
  displayName: string | null;
  allocatedHours: number;
  loggedHours: number;
  utilizationPct: number;
};

export type ActiveClockEntry = TimeEntry & {
  clientName: string;
  taskTitle: string | null;
};
