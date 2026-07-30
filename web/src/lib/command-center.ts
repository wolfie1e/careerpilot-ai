import { careerGoalProgress, isCareerGoalDueSoon, isCareerGoalOverdue, type CareerGoal } from "@/lib/career-goals";
import { isApplicationFollowUpDue, isApplicationInterviewUpcoming, type JobApplication } from "@/lib/application-tracker";
import { isPlannerTaskDueSoon, isPlannerTaskOverdue, type PlannerTask } from "@/lib/career-planner";
import { certificationProgress, isCertificationExpiring, type CertificationRecord } from "@/lib/certification-tracker";
import { isLearningResourceDueSoon, isLearningResourceOverdue, learningProgress, type LearningResource } from "@/lib/learning-path";
import { isMentorshipFollowUpDue, isMentorshipFollowUpSoon, suggestedMentorshipNextContact, type MentorshipContact } from "@/lib/mentorship";
import { isNetworkingFollowUpDue, isNetworkingFollowUpSoon, networkingStaleCount, type NetworkingContact } from "@/lib/networking";
import { isOfferDeadlineOverdue, isOfferDeadlineSoon, offerDecisionScore, offerTotalCompensation, type OfferComparison } from "@/lib/offer-tracker";
import { isPortfolioProjectOverdue, portfolioProjectReadiness, type PortfolioProject } from "@/lib/portfolio-projects";
import { isReferenceActionDue, isReferenceActionSoon, referenceProfileCompletion, type ProfessionalReference } from "@/lib/professional-references";
import { isQuestionReviewDue, questionAnswerCompletion, type QuestionBankItem } from "@/lib/question-bank";
import { companyReadinessScore, isCompanyActionDue, isCompanyActionSoon, type TargetCompany } from "@/lib/target-companies";

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
  query: string;
  hiddenActionIds: string[];
  snoozedUntilById: Record<string, string>;
}

export interface CommandCenterData {
  plannerTasks: PlannerTask[];
  applications: JobApplication[];
  networkingContacts: NetworkingContact[];
  mentorshipContacts: MentorshipContact[];
  careerGoals: CareerGoal[];
  learningResources: LearningResource[];
  targetCompanies: TargetCompany[];
  professionalReferences: ProfessionalReference[];
  questionBank: QuestionBankItem[];
  portfolioProjects: PortfolioProject[];
  offers: OfferComparison[];
  certifications: CertificationRecord[];
}

export const DEFAULT_COMMAND_CENTER_PREFERENCES: CommandCenterPreferences = {
  source: "all",
  priority: "all",
  showLowPriority: true,
  query: "",
  hiddenActionIds: [],
  snoozedUntilById: {},
};

const PRIORITY_WEIGHT: Record<CommandCenterPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function commandCenterTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function dateKeyToUtcMs(dateKey: string): number | null {
  const [year, month, day] = dateKey.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return Date.UTC(year, month - 1, day);
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

export function normalizeCommandCenterPreferences(
  preferences?: Partial<CommandCenterPreferences> | null,
): CommandCenterPreferences {
  return {
    ...DEFAULT_COMMAND_CENTER_PREFERENCES,
    ...preferences,
    hiddenActionIds: Array.isArray(preferences?.hiddenActionIds) ? preferences.hiddenActionIds : [],
    snoozedUntilById: preferences?.snoozedUntilById && typeof preferences.snoozedUntilById === "object"
      ? preferences.snoozedUntilById
      : {},
  };
}

export function isCommandActionSnoozed(
  action: CommandCenterAction,
  preferences: CommandCenterPreferences,
  date = new Date(),
): boolean {
  const snoozedUntil = preferences.snoozedUntilById?.[action.id];
  return Boolean(snoozedUntil && snoozedUntil > commandCenterTodayKey(date));
}

export function activeCommandCenterSnoozes(
  preferences: CommandCenterPreferences,
  date = new Date(),
): Array<[string, string]> {
  const today = commandCenterTodayKey(date);
  return Object.entries(preferences.snoozedUntilById || {}).filter(([, snoozedUntil]) => snoozedUntil > today);
}

export function commandCenterDueLabel(action: CommandCenterAction, date = new Date()): string {
  if (!action.dueDate) return "";
  const todayMs = dateKeyToUtcMs(commandCenterTodayKey(date));
  const dueMs = dateKeyToUtcMs(action.dueDate);
  if (todayMs === null || dueMs === null) return action.dueDate;
  const days = Math.round((dueMs - todayMs) / DAY_MS);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due in ${days}d`;
  return action.dueDate;
}

export function filterCommandCenterActions(
  actions: CommandCenterAction[],
  preferences: CommandCenterPreferences,
): CommandCenterAction[] {
  const normalizedPreferences = normalizeCommandCenterPreferences(preferences);
  const hiddenActionIds = new Set(normalizedPreferences.hiddenActionIds);
  return sortCommandCenterActions(actions).filter((action) => {
    if (hiddenActionIds.has(action.id)) return false;
    if (isCommandActionSnoozed(action, normalizedPreferences)) return false;
    if (normalizedPreferences.source !== "all" && action.source !== normalizedPreferences.source) return false;
    if (normalizedPreferences.priority !== "all" && action.priority !== normalizedPreferences.priority) return false;
    if (!normalizedPreferences.showLowPriority && action.priority === "low") return false;
    const query = normalizedPreferences.query.trim().toLowerCase();
    if (query && !`${action.title} ${action.detail} ${action.tags.join(" ")}`.toLowerCase().includes(query)) return false;
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

export function commandCenterPriorityRows(actions: CommandCenterAction[]) {
  const counts = commandCenterPriorityCounts(actions);
  return (["critical", "high", "medium", "low"] as const).map((priority) => ({
    priority,
    actions: counts[priority],
  }));
}

export function commandCenterSourceRows(actions: CommandCenterAction[]) {
  return Object.entries(commandCenterSourceCounts(actions))
    .sort((a, b) => b[1] - a[1])
    .map(([source, actions]) => ({
      source,
      actions,
    }));
}

export function commandCenterPlanningRows(actions: CommandCenterAction[], tasks: PlannerTask[]) {
  return sortCommandCenterActions(actions).map((action) => ({
    source: action.source,
    priority: action.priority,
    title: action.title,
    due_date: action.dueDate,
    planned: isCommandActionPlanned(action, tasks) ? "yes" : "no",
    planner_tag: commandActionPlannerTag(action),
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

export function learningCommandActions(resources: LearningResource[]): CommandCenterAction[] {
  return resources
    .filter((resource) => !["completed", "archived"].includes(resource.status))
    .filter((resource) => isLearningResourceOverdue(resource) || isLearningResourceDueSoon(resource) || resource.priority === "high" || learningProgress(resource) < 25)
    .map((resource) => {
      const overdue = isLearningResourceOverdue(resource);
      const dueSoon = isLearningResourceDueSoon(resource);
      const progress = learningProgress(resource);
      return {
        id: `learning:${resource.id}`,
        source: "learning" as const,
        title: resource.title,
        detail: [resource.provider, resource.skillArea, `${progress}% complete`].filter(Boolean).join(" · "),
        href: "/learning",
        dueDate: resource.targetDate,
        priority: overdue ? "critical" as const : dueSoon || resource.priority === "high" ? "high" as const : progress < 25 ? "medium" as const : "low" as const,
        score: (overdue ? 100 : 0) + (dueSoon ? 60 : 0) + (resource.priority === "high" ? 30 : 0) + (100 - progress),
        tags: ["learning", resource.type, resource.priority, resource.skillArea, ...resource.tags].filter(Boolean),
      };
    });
}

export function companyCommandActions(companies: TargetCompany[]): CommandCenterAction[] {
  return companies
    .filter((company) => company.stage !== "archived")
    .filter((company) => isCompanyActionDue(company) || isCompanyActionSoon(company) || company.stage === "ready" || companyReadinessScore(company) < 50)
    .map((company) => {
      const due = isCompanyActionDue(company);
      const soon = isCompanyActionSoon(company);
      const readiness = companyReadinessScore(company);
      return {
        id: `companies:${company.id}`,
        source: "companies" as const,
        title: company.name,
        detail: company.nextAction || company.researchNotes || `${readiness}% company readiness`,
        href: "/companies",
        dueDate: company.nextActionDate,
        priority: due ? "critical" as const : soon || company.stage === "ready" ? "high" as const : readiness < 50 ? "medium" as const : "low" as const,
        score: (due ? 100 : 0) + (soon ? 70 : 0) + (company.stage === "ready" ? 40 : 0) + (100 - readiness),
        tags: ["companies", company.stage, company.priority, company.industry, company.targetRole, ...company.tags].filter(Boolean),
      };
    });
}

export function referenceCommandActions(references: ProfessionalReference[]): CommandCenterAction[] {
  return references
    .filter((reference) => reference.status !== "archived")
    .filter((reference) => isReferenceActionDue(reference) || isReferenceActionSoon(reference) || reference.status === "permission_requested" || (reference.status === "used" && !reference.thankYouSent) || referenceProfileCompletion(reference) < 70)
    .map((reference) => {
      const due = isReferenceActionDue(reference);
      const soon = isReferenceActionSoon(reference);
      const completion = referenceProfileCompletion(reference);
      return {
        id: `references:${reference.id}`,
        source: "references" as const,
        title: reference.name,
        detail: reference.nextAction || reference.supportingStories || `${completion}% profile completion`,
        href: "/references",
        dueDate: reference.nextActionDate,
        priority: due || (reference.status === "used" && !reference.thankYouSent) ? "critical" as const : soon || reference.status === "permission_requested" ? "high" as const : completion < 70 ? "medium" as const : "low" as const,
        score: (due ? 100 : 0) + (soon ? 60 : 0) + (reference.status === "used" && !reference.thankYouSent ? 80 : 0) + (100 - completion),
        tags: ["references", reference.relationship, reference.status, ...reference.strengths],
      };
    });
}

export function questionCommandActions(items: QuestionBankItem[]): CommandCenterAction[] {
  return items
    .filter((item) => item.status !== "archived")
    .filter((item) => isQuestionReviewDue(item) || item.confidence <= 5 || item.difficulty >= 8 || questionAnswerCompletion(item) < 70)
    .map((item) => {
      const due = isQuestionReviewDue(item);
      const completion = questionAnswerCompletion(item);
      return {
        id: `questions:${item.id}`,
        source: "questions" as const,
        title: item.question,
        detail: item.answerOutline || `${completion}% answer completion · confidence ${item.confidence}/10`,
        href: "/question-bank",
        dueDate: item.nextReviewAt,
        priority: due ? "critical" as const : item.confidence <= 5 || item.difficulty >= 8 ? "high" as const : completion < 70 ? "medium" as const : "low" as const,
        score: (due ? 100 : 0) + (item.difficulty >= 8 ? 40 : 0) + (10 - item.confidence) * 5 + (100 - completion),
        tags: ["questions", item.category, item.status, item.targetRole, ...item.tags].filter(Boolean),
      };
    });
}

export function portfolioCommandActions(projects: PortfolioProject[]): CommandCenterAction[] {
  return projects
    .filter((project) => !["published", "archived"].includes(project.status))
    .filter((project) => isPortfolioProjectOverdue(project) || !project.nextAction.trim() || (!project.repositoryUrl && !project.liveUrl && !project.caseStudyUrl) || portfolioProjectReadiness(project) < 70)
    .map((project) => {
      const overdue = isPortfolioProjectOverdue(project);
      const readiness = portfolioProjectReadiness(project);
      return {
        id: `portfolio:${project.id}`,
        source: "portfolio" as const,
        title: project.name,
        detail: project.nextAction || project.summary || `${readiness}% portfolio readiness`,
        href: "/portfolio",
        dueDate: project.targetDate,
        priority: overdue ? "critical" as const : project.priority === "high" ? "high" as const : readiness < 70 ? "medium" as const : "low" as const,
        score: (overdue ? 100 : 0) + (project.priority === "high" ? 40 : 0) + (100 - readiness),
        tags: ["portfolio", project.status, project.priority, project.targetRole, ...project.skills, ...project.tags].filter(Boolean),
      };
    });
}

export function offerCommandActions(offers: OfferComparison[]): CommandCenterAction[] {
  return offers
    .filter((offer) => !["accepted", "declined", "archived"].includes(offer.status))
    .filter((offer) => isOfferDeadlineOverdue(offer) || isOfferDeadlineSoon(offer) || offer.status === "negotiating" || offerTotalCompensation(offer) === 0)
    .map((offer) => {
      const overdue = isOfferDeadlineOverdue(offer);
      const soon = isOfferDeadlineSoon(offer);
      return {
        id: `offers:${offer.id}`,
        source: "offers" as const,
        title: `${offer.company} — ${offer.role || "Offer"}`,
        detail: offer.negotiationNotes || offer.notes || `Decision score ${offerDecisionScore(offer)}`,
        href: "/offers",
        dueDate: offer.decisionDeadline,
        priority: overdue ? "critical" as const : soon || offer.status === "negotiating" ? "high" as const : "medium" as const,
        score: (overdue ? 100 : 0) + (soon ? 70 : 0) + (offer.status === "negotiating" ? 40 : 0) + offerDecisionScore(offer),
        tags: ["offers", offer.status, offer.workMode, offer.currency, ...offer.tags].filter(Boolean),
      };
    });
}

export function certificationCommandActions(records: CertificationRecord[]): CommandCenterAction[] {
  return records
    .filter((record) => record.status !== "archived")
    .filter((record) => isCertificationExpiring(record) || record.status === "studying" || (record.status === "earned" && !record.credentialUrl) || (record.status === "planned" && record.targetDate))
    .map((record) => {
      const expiring = isCertificationExpiring(record);
      const progress = certificationProgress(record);
      return {
        id: `certifications:${record.id}`,
        source: "certifications" as const,
        title: record.title,
        detail: record.notes || [record.provider, record.examCode, `${progress}% complete`].filter(Boolean).join(" · "),
        href: "/certifications",
        dueDate: record.targetDate || record.expiresAt,
        priority: expiring ? "critical" as const : record.status === "studying" ? "high" as const : !record.credentialUrl && record.status === "earned" ? "medium" as const : "low" as const,
        score: (expiring ? 100 : 0) + (record.status === "studying" ? 50 : 0) + (100 - progress),
        tags: ["certifications", record.category, record.status, record.provider, ...record.skills].filter(Boolean),
      };
    });
}

export function buildCommandCenterActions(data: CommandCenterData): CommandCenterAction[] {
  return sortCommandCenterActions([
    ...plannerCommandActions(data.plannerTasks),
    ...applicationCommandActions(data.applications),
    ...networkingCommandActions(data.networkingContacts),
    ...mentorshipCommandActions(data.mentorshipContacts),
    ...careerGoalCommandActions(data.careerGoals),
    ...learningCommandActions(data.learningResources),
    ...companyCommandActions(data.targetCompanies),
    ...referenceCommandActions(data.professionalReferences),
    ...questionCommandActions(data.questionBank),
    ...portfolioCommandActions(data.portfolioProjects),
    ...offerCommandActions(data.offers),
    ...certificationCommandActions(data.certifications),
  ]);
}

export function commandCenterPriorityCounts(actions: CommandCenterAction[]): Record<CommandCenterPriority, number> {
  const counts: Record<CommandCenterPriority, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  actions.forEach((action) => { counts[action.priority] += 1; });
  return counts;
}

export function commandCenterSourceCounts(actions: CommandCenterAction[]): Record<CommandCenterSource, number> {
  return actions.reduce<Record<CommandCenterSource, number>>((counts, action) => {
    counts[action.source] = (counts[action.source] || 0) + 1;
    return counts;
  }, {} as Record<CommandCenterSource, number>);
}

export function topCommandCenterActions(actions: CommandCenterAction[], limit = 5): CommandCenterAction[] {
  return sortCommandCenterActions(actions).slice(0, limit);
}

export function commandActionPlannerTag(action: CommandCenterAction): string {
  return `command:${action.id}`;
}

export function isCommandActionPlanned(action: CommandCenterAction, tasks: PlannerTask[]): boolean {
  const commandTag = commandActionPlannerTag(action);
  return tasks.some((task) => task.tags.includes(commandTag) && !task.archived && task.status !== "done");
}

export function plannedCommandActionCount(actions: CommandCenterAction[], tasks: PlannerTask[]): number {
  return actions.filter((action) => isCommandActionPlanned(action, tasks)).length;
}

export function commandActionToPlannerTask(action: CommandCenterAction): PlannerTask {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: action.title,
    notes: `${action.detail}\nSource: ${action.source}`,
    priority: action.priority === "critical" || action.priority === "high" ? "high" : action.priority === "medium" ? "medium" : "low",
    category: action.source === "applications" ? "application" : action.source === "learning" || action.source === "portfolio" || action.source === "certifications" ? "learning" : action.source === "networking" || action.source === "mentorship" || action.source === "references" ? "networking" : "other",
    estimateMinutes: action.priority === "critical" ? 45 : 30,
    resourceUrl: action.href,
    status: "todo",
    dueDate: action.dueDate,
    createdAt: now,
    completedAt: null,
    archived: false,
    tags: ["command-center", commandActionPlannerTag(action), action.source, ...action.tags.slice(0, 5)],
    recurrence: "none",
  };
}
