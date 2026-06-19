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
