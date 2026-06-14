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
