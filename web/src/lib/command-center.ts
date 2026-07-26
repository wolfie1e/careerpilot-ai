import { careerGoalProgress, isCareerGoalDueSoon, isCareerGoalOverdue, type CareerGoal } from "@/lib/career-goals";
import { isApplicationFollowUpDue, isApplicationInterviewUpcoming, type JobApplication } from "@/lib/application-tracker";
import { isPlannerTaskDueSoon, isPlannerTaskOverdue, type PlannerTask } from "@/lib/career-planner";
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
