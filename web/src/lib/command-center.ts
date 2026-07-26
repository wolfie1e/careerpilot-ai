import { careerGoalProgress, isCareerGoalDueSoon, isCareerGoalOverdue, type CareerGoal } from "@/lib/career-goals";
import { isApplicationFollowUpDue, isApplicationInterviewUpcoming, type JobApplication } from "@/lib/application-tracker";
import { isPlannerTaskDueSoon, isPlannerTaskOverdue, type PlannerTask } from "@/lib/career-planner";
import { isMentorshipFollowUpDue, isMentorshipFollowUpSoon, suggestedMentorshipNextContact, type MentorshipContact } from "@/lib/mentorship";
import { isNetworkingFollowUpDue, isNetworkingFollowUpSoon, networkingStaleCount, type NetworkingContact } from "@/lib/networking";

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

export function applicationCommandActions(applications: JobApplication[]): CommandCenterAction[] {
  return applications
    .filter((application) => !application.archived && !["offer", "rejected", "withdrawn"].includes(application.stage))
    .filter((application) => isApplicationFollowUpDue(application) || isApplicationInterviewUpcoming(application) || application.priority === "high" || !application.nextAction.trim())
    .map((application) => {
      const interviewSoon = isApplicationInterviewUpcoming(application);
      const followUpDue = isApplicationFollowUpDue(application);
      return {
        id: `applications:${application.id}`,
        source: "applications" as const,
        title: `${application.company} — ${application.role}`,
        detail: application.nextAction || application.notes || `Current stage: ${application.stage}`,
        href: "/applications",
        dueDate: application.followUpAt || application.interviewAt.slice(0, 10),
        priority: followUpDue || interviewSoon ? "critical" as const : application.priority === "high" ? "high" as const : "medium" as const,
        score: (followUpDue ? 100 : 0) + (interviewSoon ? 90 : 0) + (application.priority === "high" ? 30 : 0),
        tags: ["applications", application.stage, application.priority, ...application.tags],
      };
    });
}

export function networkingCommandActions(contacts: NetworkingContact[]): CommandCenterAction[] {
  return contacts
    .filter((contact) => !contact.archived)
    .filter((contact) => isNetworkingFollowUpDue(contact) || isNetworkingFollowUpSoon(contact) || !contact.nextFollowUpAt || !contact.lastContactedAt)
    .slice(0, Math.max(10, networkingStaleCount(contacts)))
    .map((contact) => {
      const due = isNetworkingFollowUpDue(contact);
      const soon = isNetworkingFollowUpSoon(contact);
      return {
        id: `networking:${contact.id}`,
        source: "networking" as const,
        title: `Follow up with ${contact.name}`,
        detail: [contact.role, contact.company, contact.notes].filter(Boolean).join(" · ") || "Keep this relationship warm",
        href: "/networking",
        dueDate: contact.nextFollowUpAt,
        priority: due ? "critical" as const : soon ? "high" as const : contact.strength === "strong" ? "medium" as const : "low" as const,
        score: (due ? 100 : 0) + (soon ? 60 : 0) + (contact.strength === "strong" ? 20 : 0),
        tags: ["networking", contact.strength, ...contact.tags],
      };
    });
}

export function mentorshipCommandActions(contacts: MentorshipContact[]): CommandCenterAction[] {
  return contacts
    .filter((contact) => contact.status !== "archived")
    .filter((contact) => isMentorshipFollowUpDue(contact) || isMentorshipFollowUpSoon(contact) || contact.favorite || contact.confidence <= 5)
    .map((contact) => {
      const due = isMentorshipFollowUpDue(contact);
      const soon = isMentorshipFollowUpSoon(contact);
      return {
        id: `mentorship:${contact.id}`,
        source: "mentorship" as const,
        title: `Mentorship touchpoint: ${contact.name}`,
        detail: contact.goals || contact.notes || [contact.relationship, contact.role, contact.company].filter(Boolean).join(" · "),
        href: "/mentorship",
        dueDate: contact.nextContactAt || suggestedMentorshipNextContact(contact),
        priority: due ? "critical" as const : soon || contact.favorite ? "high" as const : contact.confidence <= 5 ? "medium" as const : "low" as const,
        score: (due ? 100 : 0) + (soon ? 70 : 0) + (contact.favorite ? 30 : 0) + Math.max(0, 10 - contact.confidence),
        tags: ["mentorship", contact.relationship, contact.status, ...contact.topics],
      };
    });
}

export function careerGoalCommandActions(goals: CareerGoal[]): CommandCenterAction[] {
  return goals
    .filter((goal) => goal.status === "active")
    .filter((goal) => isCareerGoalOverdue(goal) || isCareerGoalDueSoon(goal) || goal.priority === "high" || careerGoalProgress(goal) < 25)
    .map((goal) => {
      const overdue = isCareerGoalOverdue(goal);
      const dueSoon = isCareerGoalDueSoon(goal);
      const progress = careerGoalProgress(goal);
      return {
        id: `goals:${goal.id}`,
        source: "goals" as const,
        title: goal.title,
        detail: goal.description || goal.notes || `${progress}% complete`,
        href: "/goals",
        dueDate: goal.targetDate,
        priority: overdue ? "critical" as const : dueSoon || goal.priority === "high" ? "high" as const : progress < 25 ? "medium" as const : "low" as const,
        score: (overdue ? 100 : 0) + (dueSoon ? 70 : 0) + (goal.priority === "high" ? 30 : 0) + (100 - progress),
        tags: ["goals", goal.category, goal.priority, goal.horizon, ...goal.tags],
      };
    });
}
