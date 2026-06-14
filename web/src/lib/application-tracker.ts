export type ApplicationStage = "saved" | "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  location: string;
  url: string;
  salary: string;
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
