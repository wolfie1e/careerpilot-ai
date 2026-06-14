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
  contactName: string;
  contactEmail: string;
  notes: string;
  appliedAt: string;
  followUpAt: string;
  createdAt: string;
  updatedAt: string;
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
    contactName: "",
    contactEmail: "",
    notes: "",
    appliedAt: "",
    followUpAt: "",
    createdAt: now,
    updatedAt: now,
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

export function sortApplications(applications: JobApplication[]): JobApplication[] {
  return [...applications].sort((a, b) => {
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

export function companyApplicationCounts(applications: JobApplication[]): Record<string, number> {
  return applications.reduce<Record<string, number>>((counts, application) => {
    counts[application.company] = (counts[application.company] || 0) + 1;
    return counts;
  }, {});
}

export function applicationPipelineText(applications: JobApplication[]): string {
  return sortApplications(applications).map(applicationSummary).join("\n");
}
