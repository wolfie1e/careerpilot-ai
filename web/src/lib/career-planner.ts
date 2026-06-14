export type PlannerPriority = "low" | "medium" | "high";

export type PlannerStatus = "todo" | "in_progress" | "done";

export interface PlannerTask {
  id: string;
  title: string;
  notes: string;
  priority: PlannerPriority;
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
