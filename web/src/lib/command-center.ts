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
