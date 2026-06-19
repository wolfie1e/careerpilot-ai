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

export function activeCareerGoalCount(goals: CareerGoal[]): number {
  return goals.filter((goal) => goal.status === "active").length;
}

export function completedCareerGoalCount(goals: CareerGoal[]): number {
  return goals.filter((goal) => goal.status === "completed").length;
}

export function overdueCareerGoalCount(goals: CareerGoal[]): number {
  return goals.filter((goal) => isCareerGoalOverdue(goal)).length;
}

export function careerGoalPriorityWeight(priority: CareerGoal["priority"]): number {
  return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

export function sortCareerGoals(goals: CareerGoal[]): CareerGoal[] {
  return [...goals].sort((a, b) => {
    if (a.status === "archived" && b.status !== "archived") return 1;
    if (b.status === "archived" && a.status !== "archived") return -1;
    const aOverdue = isCareerGoalOverdue(a);
    const bOverdue = isCareerGoalOverdue(b);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    const priorityDifference = careerGoalPriorityWeight(b.priority) - careerGoalPriorityWeight(a.priority);
    if (priorityDifference) return priorityDifference;
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
    if (a.targetDate) return -1;
    if (b.targetDate) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function careerGoalSummary(goal: CareerGoal): string {
  const details = [goal.status, goal.priority, `${careerGoalProgress(goal)}%`];
  if (goal.targetDate) details.push(`target ${goal.targetDate}`);
  return `${goal.title} (${details.join(", ")})${goal.description ? `\n${goal.description}` : ""}`;
}

export function careerGoalPipelineText(goals: CareerGoal[]): string {
  return sortCareerGoals(goals).map(careerGoalSummary).join("\n\n");
}

export function careerGoalCategoryCounts(goals: CareerGoal[]): Record<CareerGoal["category"], number> {
  const counts: Record<CareerGoal["category"], number> = { resume: 0, interview: 0, networking: 0, applications: 0, learning: 0, portfolio: 0, other: 0 };
  goals.forEach((goal) => { counts[goal.category || "other"] += 1; });
  return counts;
}

export function careerGoalTagCounts(goals: CareerGoal[]): Record<string, number> {
  return goals.flatMap((goal) => goal.tags || []).reduce<Record<string, number>>((counts, tag) => {
    counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});
}

export function normalizeCareerGoal(goal: Partial<CareerGoal>): CareerGoal {
  const base = createCareerGoal(goal.title || "Untitled goal");
  return {
    ...base,
    ...goal,
    progress: Math.min(100, Math.max(0, Number(goal.progress ?? base.progress))),
    currentValue: Number(goal.currentValue ?? base.currentValue),
    targetValue: Math.max(1, Number(goal.targetValue ?? base.targetValue)),
    tags: goal.tags || [],
  };
}

export function mergeCareerGoals(current: CareerGoal[], incoming: CareerGoal[]): CareerGoal[] {
  const byId = new Map(current.map((goal) => [goal.id, goal]));
  incoming.map(normalizeCareerGoal).forEach((goal) => byId.set(goal.id, goal));
  return sortCareerGoals([...byId.values()]);
}

export function averageCareerGoalProgress(goals: CareerGoal[]): number {
  const visibleGoals = goals.filter((goal) => goal.status !== "archived");
  if (!visibleGoals.length) return 0;
  return Math.round(visibleGoals.reduce((total, goal) => total + careerGoalProgress(goal), 0) / visibleGoals.length);
}
