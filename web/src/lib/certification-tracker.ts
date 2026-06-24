export type CertificationCategory =
  | "cloud"
  | "security"
  | "data"
  | "ai"
  | "project_management"
  | "product"
  | "design"
  | "engineering"
  | "other";

export type CertificationStatus = "planned" | "studying" | "earned" | "expired" | "archived";

export interface CertificationRecord {
  id: string;
  title: string;
  provider: string;
  category: CertificationCategory;
  status: CertificationStatus;
  examCode: string;
  targetDate: string;
  issuedAt: string;
  expiresAt: string;
  credentialUrl: string;
  cost: number;
  studyHours: number;
  completedHours: number;
  score: string;
  renewalWindowDays: number;
  notes: string;
  skills: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CERTIFICATION_CATEGORIES: Array<{ value: CertificationCategory; label: string }> = [
  { value: "cloud", label: "Cloud" },
  { value: "security", label: "Security" },
  { value: "data", label: "Data" },
  { value: "ai", label: "AI" },
  { value: "project_management", label: "Project management" },
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "other", label: "Other" },
];

export const CERTIFICATION_STATUSES: Array<{ value: CertificationStatus; label: string }> = [
  { value: "planned", label: "Planned" },
  { value: "studying", label: "Studying" },
  { value: "earned", label: "Earned" },
  { value: "expired", label: "Expired" },
  { value: "archived", label: "Archived" },
];

export function createCertificationRecord(title: string): CertificationRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    provider: "",
    category: "other",
    status: "planned",
    examCode: "",
    targetDate: "",
    issuedAt: "",
    expiresAt: "",
    credentialUrl: "",
    cost: 0,
    studyHours: 20,
    completedHours: 0,
    score: "",
    renewalWindowDays: 90,
    notes: "",
    skills: [],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function certificationProgress(record: CertificationRecord): number {
  if (record.status === "earned") return 100;
  if (record.studyHours <= 0) return record.completedHours > 0 ? 100 : 0;
  return Math.min(100, Math.round((record.completedHours / record.studyHours) * 100));
}
