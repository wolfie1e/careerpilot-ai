export type ApplicationStage = "saved" | "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  location: string;
  url: string;
  salary: string;
  source: string;
  employmentType: string;
  priority: "low" | "medium" | "high";
  favorite: boolean;
  archived: boolean;
  contactName: string;
  contactEmail: string;
  notes: string;
  appliedAt: string;
  followUpAt: string;
  createdAt: string;
  updatedAt: string;
  nextAction: string;
  interviewAt: string;
  tags: string[];
}

export function createJobApplication(company: string, role: string): JobApplication {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    company: company.trim(),
    role: role.trim(),
    stage: "saved",
    location: "",
    url: "",
    salary: "",
    source: "",
    employmentType: "",
    priority: "medium",
    favorite: false,
    archived: false,
    contactName: "",
    contactEmail: "",
    notes: "",
    appliedAt: "",
    followUpAt: "",
    createdAt: now,
    updatedAt: now,
    nextAction: "",
    interviewAt: "",
    tags: [],
  };
}

export const APPLICATION_STAGES: Array<{ value: ApplicationStage; label: string }> = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

export function updateApplicationStage(application: JobApplication, stage: ApplicationStage): JobApplication {
  const today = new Date().toISOString().slice(0, 10);
  return {
    ...application,
    stage,
    appliedAt: stage === "applied" && !application.appliedAt ? today : application.appliedAt,
    updatedAt: new Date().toISOString(),
  };
}

export function applicationStageCounts(applications: JobApplication[]): Record<ApplicationStage, number> {
  const counts: Record<ApplicationStage, number> = { saved: 0, applied: 0, screening: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 };
  applications.forEach((application) => { counts[application.stage] += 1; });
  return counts;
}

export function applicationResponseRate(applications: JobApplication[]): number {
  const submitted = applications.filter((application) => application.stage !== "saved");
  if (!submitted.length) return 0;
  const responses = submitted.filter((application) => ["screening", "interview", "offer"].includes(application.stage));
  return Math.round((responses.length / submitted.length) * 100);
}

export function isApplicationFollowUpDue(application: JobApplication, today = new Date()): boolean {
  if (!application.followUpAt || ["offer", "rejected", "withdrawn"].includes(application.stage)) return false;
  return application.followUpAt <= today.toISOString().slice(0, 10);
}

export function isApplicationInterviewUpcoming(application: JobApplication, today = new Date()): boolean {
  if (!application.interviewAt) return false;
  const interview = new Date(application.interviewAt);
  const hours = (interview.getTime() - today.getTime()) / 3_600_000;
  return hours >= 0 && hours <= 168;
}

export function sortApplications(applications: JobApplication[]): JobApplication[] {
  return [...applications].sort((a, b) => {
    if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
    const aDue = isApplicationFollowUpDue(a);
    const bDue = isApplicationFollowUpDue(b);
    if (aDue !== bDue) return aDue ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function applicationSummary(application: JobApplication): string {
  const details = [application.stage, application.location, application.salary].filter(Boolean);
  return `${application.company} — ${application.role}${details.length ? ` (${details.join(", ")})` : ""}`;
}

export function applicationActiveCount(applications: JobApplication[]): number {
  return applications.filter((application) => !["offer", "rejected", "withdrawn"].includes(application.stage)).length;
}

export function applicationInterviewRate(applications: JobApplication[]): number {
  const submitted = applications.filter((application) => application.stage !== "saved");
  if (!submitted.length) return 0;
  const interviews = submitted.filter((application) => ["interview", "offer"].includes(application.stage));
  return Math.round((interviews.length / submitted.length) * 100);
}

export function applicationsThisMonth(applications: JobApplication[], today = new Date()): number {
  const month = today.toISOString().slice(0, 7);
  return applications.filter((application) => application.appliedAt.startsWith(month)).length;
}

export function applicationContactCount(applications: JobApplication[]): number {
  return applications.filter((application) => application.contactName || application.contactEmail).length;
}

export function favoriteApplicationCount(applications: JobApplication[]): number {
  return applications.filter((application) => application.favorite).length;
}

export function archivedApplicationCount(applications: JobApplication[]): number {
  return applications.filter((application) => application.archived).length;
}

export function highPriorityApplicationCount(applications: JobApplication[]): number {
  return applications.filter((application) => application.priority === "high" && !application.archived).length;
}

export function upcomingInterviewCount(applications: JobApplication[]): number {
  return applications.filter((application) => isApplicationInterviewUpcoming(application)).length;
}

export function applicationNextActionCount(applications: JobApplication[]): number {
  return applications.filter((application) => application.nextAction && !application.archived).length;
}

export function applicationsWithFollowUps(applications: JobApplication[]): JobApplication[] {
  return sortApplications(applications.filter((application) => application.followUpAt && !application.archived));
}

export function applicationFollowUpDueCount(applications: JobApplication[]): number {
  return applications.filter((application) => isApplicationFollowUpDue(application)).length;
}

export function staleApplicationCount(applications: JobApplication[], days = 14, today = new Date()): number {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);
  return applications.filter((application) => !application.archived && !["offer", "rejected", "withdrawn"].includes(application.stage) && new Date(application.updatedAt) < cutoff).length;
}

export function companyApplicationCounts(applications: JobApplication[]): Record<string, number> {
  return applications.reduce<Record<string, number>>((counts, application) => {
    counts[application.company] = (counts[application.company] || 0) + 1;
    return counts;
  }, {});
}

export function applicationSourceCounts(applications: JobApplication[]): Record<string, number> {
  return applications.filter((application) => application.source && !application.archived).reduce<Record<string, number>>((counts, application) => {
    counts[application.source] = (counts[application.source] || 0) + 1;
    return counts;
  }, {});
}

export function applicationLocationCounts(applications: JobApplication[]): Record<string, number> {
  return applications.filter((application) => application.location && !application.archived).reduce<Record<string, number>>((counts, application) => {
    counts[application.location] = (counts[application.location] || 0) + 1;
    return counts;
  }, {});
}

export function applicationEmploymentTypeCounts(applications: JobApplication[]): Record<string, number> {
  return applications.filter((application) => application.employmentType && !application.archived).reduce<Record<string, number>>((counts, application) => {
    counts[application.employmentType] = (counts[application.employmentType] || 0) + 1;
    return counts;
  }, {});
}

export function applicationsMissingNextActionCount(applications: JobApplication[]): number {
  return applications.filter((application) => !application.archived && !["offer", "rejected", "withdrawn"].includes(application.stage) && !application.nextAction.trim()).length;
}

export function applicationsWithoutContactCount(applications: JobApplication[]): number {
  return applications.filter((application) => !application.archived && !application.contactName && !application.contactEmail).length;
}

export function nextApplicationFollowUp(applications: JobApplication[]): JobApplication | null {
  return applicationsWithFollowUps(applications).sort((a, b) => a.followUpAt.localeCompare(b.followUpAt))[0] || null;
}

export function applicationPipelineText(applications: JobApplication[]): string {
  return sortApplications(applications).map(applicationSummary).join("\n");
}

export function normalizeJobApplication(application: Partial<JobApplication>): JobApplication {
  const base = createJobApplication(application.company || "Unknown company", application.role || "Untitled role");
  return { ...base, ...application, tags: application.tags || [], nextAction: application.nextAction || "", interviewAt: application.interviewAt || "" };
}

export function mergeJobApplications(current: JobApplication[], incoming: JobApplication[]): JobApplication[] {
  const byId = new Map(current.map((application) => [application.id, application]));
  incoming.map(normalizeJobApplication).forEach((application) => byId.set(application.id, application));
  return sortApplications([...byId.values()]);
}

export function applicationPriorityCounts(applications: JobApplication[]): Record<JobApplication["priority"], number> {
  const counts: Record<JobApplication["priority"], number> = { low: 0, medium: 0, high: 0 };
  applications.filter((application) => !application.archived).forEach((application) => { counts[application.priority] += 1; });
  return counts;
}

export function applicationTagCounts(applications: JobApplication[]): Record<string, number> {
  return applications.filter((application) => !application.archived).flatMap((application) => application.tags || []).reduce<Record<string, number>>((counts, tag) => {
    counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});
}

export function applicationOfferRate(applications: JobApplication[]): number {
  const submitted = applications.filter((application) => !application.archived && application.stage !== "saved");
  if (!submitted.length) return 0;
  return Math.round((submitted.filter((application) => application.stage === "offer").length / submitted.length) * 100);
}

export function applicationsMissingSalaryCount(applications: JobApplication[]): number {
  return applications.filter((application) => !application.archived && !["rejected", "withdrawn"].includes(application.stage) && !application.salary.trim()).length;
}
