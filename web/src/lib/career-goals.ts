export type CareerGoalStatus = "active" | "paused" | "completed" | "archived";

export type CareerGoalHorizon = "30_days" | "90_days" | "six_months" | "year";

export interface CareerGoal {
  id: string;
  title: string;
  description: string;
  status: CareerGoalStatus;
  horizon: CareerGoalHorizon;
  category: "resume" | "interview" | "networking" | "applications" | "learning" | "portfolio" | "other";
  targetDate: string;
  progress: number;
  priority: "low" | "medium" | "high";
  metricLabel: string;
  currentValue: number;
  targetValue: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  tags: string[];
}

export const CAREER_GOAL_STATUSES: Array<{ value: CareerGoalStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export const CAREER_GOAL_HORIZONS: Array<{ value: CareerGoalHorizon; label: string }> = [
  { value: "30_days", label: "30 days" },
  { value: "90_days", label: "90 days" },
  { value: "six_months", label: "6 months" },
  { value: "year", label: "1 year" },
];

export function createCareerGoal(title: string): CareerGoal {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: "",
    status: "active",
    horizon: "90_days",
    category: "other",
    targetDate: "",
    progress: 0,
    priority: "medium",
    metricLabel: "",
    currentValue: 0,
    targetValue: 1,
    notes: "",
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    tags: [],
  };
}

export function careerGoalProgress(goal: CareerGoal): number {
  if (goal.targetValue > 0) {
    return Math.min(100, Math.max(0, Math.round((goal.currentValue / goal.targetValue) * 100)));
  }
  return Math.min(100, Math.max(0, Math.round(goal.progress || 0)));
}

export function updateCareerGoalStatus(goal: CareerGoal, status: CareerGoalStatus): CareerGoal {
  return {
    ...goal,
    status,
    progress: status === "completed" ? 100 : goal.progress,
    completedAt: status === "completed" ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };
}

export function isCareerGoalOverdue(goal: CareerGoal, today = new Date()): boolean {
  if (!goal.targetDate || goal.status === "completed" || goal.status === "archived") return false;
  return goal.targetDate < today.toISOString().slice(0, 10);
}

export function isCareerGoalDueSoon(goal: CareerGoal, today = new Date()): boolean {
  if (!goal.targetDate || goal.status === "completed" || goal.status === "archived") return false;
  const target = new Date(`${goal.targetDate}T00:00:00`);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= 14;
}
