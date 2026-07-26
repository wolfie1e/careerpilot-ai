import { isPlannerTaskDueSoon, isPlannerTaskOverdue, type PlannerTask } from "@/lib/career-planner";

export type CommandCenterPriority = "critical" | "high" | "medium" | "low";
export type CommandCenterSource =
  | "planner"
  | "applications"
  | "networking"
  | "mentorship"
  | "goals"
  | "learning"
  | "companies"
  | "references"
  | "questions"
  | "portfolio"
  | "offers"
  | "certifications";

export interface CommandCenterAction {
  id: string;
  source: CommandCenterSource;
  title: string;
  detail: string;
  href: string;
  dueDate: string;
  priority: CommandCenterPriority;
  score: number;
  tags: string[];
}

export interface CommandCenterPreferences {
  source: CommandCenterSource | "all";
  priority: CommandCenterPriority | "all";
  showLowPriority: boolean;
}

export const DEFAULT_COMMAND_CENTER_PREFERENCES: CommandCenterPreferences = {
  source: "all",
  priority: "all",
  showLowPriority: true,
};

const PRIORITY_WEIGHT: Record<CommandCenterPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function commandCenterTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function sortCommandCenterActions(actions: CommandCenterAction[]): CommandCenterAction[] {
  return [...actions].sort((a, b) => {
    const priority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (priority) return priority;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.score - a.score || a.title.localeCompare(b.title);
  });
}

export function filterCommandCenterActions(
  actions: CommandCenterAction[],
  preferences: CommandCenterPreferences,
): CommandCenterAction[] {
  return sortCommandCenterActions(actions).filter((action) => {
    if (preferences.source !== "all" && action.source !== preferences.source) return false;
    if (preferences.priority !== "all" && action.priority !== preferences.priority) return false;
    if (!preferences.showLowPriority && action.priority === "low") return false;
    return true;
  });
}

export function commandCenterSummaryText(actions: CommandCenterAction[]): string {
  return sortCommandCenterActions(actions)
    .map((action, index) => `${index + 1}. [${action.priority}] ${action.title}${action.dueDate ? ` (${action.dueDate})` : ""}\n${action.detail}`)
    .join("\n\n");
}

export function commandCenterRows(actions: CommandCenterAction[]) {
  return sortCommandCenterActions(actions).map((action) => ({
    source: action.source,
    priority: action.priority,
    title: action.title,
    detail: action.detail,
    due_date: action.dueDate,
    score: action.score,
    tags: action.tags.join(", "),
    href: action.href,
  }));
}

export function plannerCommandActions(tasks: PlannerTask[]): CommandCenterAction[] {
  return tasks
    .filter((task) => !task.archived && task.status !== "done")
    .filter((task) => isPlannerTaskOverdue(task) || isPlannerTaskDueSoon(task) || task.priority === "high" || task.status === "in_progress")
    .map((task) => ({
      id: `planner:${task.id}`,
      source: "planner" as const,
      title: task.title,
      detail: task.notes || `${task.category} action`,
      href: "/planner",
      dueDate: task.dueDate,
      priority: isPlannerTaskOverdue(task) ? "critical" as const : task.priority === "high" ? "high" as const : task.status === "in_progress" ? "medium" as const : "low" as const,
      score: (isPlannerTaskOverdue(task) ? 100 : 0) + (task.priority === "high" ? 40 : 0) + Math.max(0, task.estimateMinutes || 0),
      tags: ["planner", task.category, task.priority, ...task.tags],
    }));
}
