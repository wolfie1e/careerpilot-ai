export type PlannerPriority = "low" | "medium" | "high";

export type PlannerStatus = "todo" | "in_progress" | "done";

export type PlannerCategory = "resume" | "interview" | "networking" | "learning" | "application" | "other";

export interface PlannerTask {
  id: string;
  title: string;
  notes: string;
  priority: PlannerPriority;
  category: PlannerCategory;
  estimateMinutes: number;
  resourceUrl: string;
  status: PlannerStatus;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
}

export function createPlannerTask(title: string): PlannerTask {
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    notes: "",
    priority: "medium",
    category: "other",
    estimateMinutes: 30,
    resourceUrl: "",
    status: "todo",
    dueDate: "",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

export function updatePlannerTaskStatus(task: PlannerTask, status: PlannerStatus): PlannerTask {
  return {
    ...task,
    status,
    completedAt: status === "done" ? new Date().toISOString() : null,
  };
}

export function isPlannerTaskOverdue(task: PlannerTask, today = new Date()): boolean {
  if (!task.dueDate || task.status === "done") return false;
  return task.dueDate < today.toISOString().slice(0, 10);
}

export function isPlannerTaskDueSoon(task: PlannerTask, today = new Date()): boolean {
  if (!task.dueDate || task.status === "done") return false;
  const due = new Date(`${task.dueDate}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= 7;
}

export function plannerCompletionRate(tasks: PlannerTask[]): number {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter((task) => task.status === "done").length / tasks.length) * 100);
}

export function plannerOpenMinutes(tasks: PlannerTask[]): number {
  return tasks
    .filter((task) => task.status !== "done")
    .reduce((total, task) => total + (task.estimateMinutes || 0), 0);
}

export function plannerCompletedThisWeek(tasks: PlannerTask[], today = new Date()): number {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - 7);
  return tasks.filter((task) => task.completedAt && new Date(task.completedAt) >= cutoff).length;
}

export function plannerPriorityWeight(priority: PlannerPriority): number {
  return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

export function sortPlannerTasks(tasks: PlannerTask[]): PlannerTask[] {
  return [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (b.status === "done" && a.status !== "done") return -1;
    const priorityDifference = plannerPriorityWeight(b.priority) - plannerPriorityWeight(a.priority);
    if (priorityDifference) return priorityDifference;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function plannerTaskSummary(task: PlannerTask): string {
  const details = [task.priority, task.status.replace("_", " ")];
  if (task.dueDate) details.push(`due ${task.dueDate}`);
  return `${task.title} (${details.join(", ")})${task.notes ? `\n${task.notes}` : ""}`;
}

export const PLANNER_TEMPLATES = [
  "Tailor resume for target role",
  "Practice five interview questions",
  "Reach out to three professional contacts",
  "Research target companies",
  "Complete one portfolio improvement",
] as const;
