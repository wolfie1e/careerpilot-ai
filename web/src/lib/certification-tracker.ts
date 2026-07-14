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

export function todayDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isCertificationExpired(record: CertificationRecord, dateKey = todayDateKey()): boolean {
  return Boolean(record.expiresAt && record.expiresAt < dateKey) || record.status === "expired";
}

export function isCertificationActive(record: CertificationRecord, dateKey = todayDateKey()): boolean {
  return record.status === "earned" && !isCertificationExpired(record, dateKey);
}

export function isCertificationExpiring(record: CertificationRecord, dateKey = todayDateKey()): boolean {
  if (!record.expiresAt || !isCertificationActive(record, dateKey)) return false;
  const renewalStart = new Date(`${record.expiresAt}T00:00:00`);
  renewalStart.setDate(renewalStart.getDate() - record.renewalWindowDays);
  return renewalStart.toISOString().slice(0, 10) <= dateKey;
}

const CERTIFICATION_STATUS_WEIGHT: Record<CertificationStatus, number> = {
  studying: 0,
  planned: 1,
  earned: 2,
  expired: 3,
  archived: 4,
};

export function sortCertificationRecords(records: CertificationRecord[]): CertificationRecord[] {
  return [...records].sort((a, b) => {
    if (a.status === "archived" && b.status !== "archived") return 1;
    if (b.status === "archived" && a.status !== "archived") return -1;
    if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
    if (isCertificationExpiring(a) !== isCertificationExpiring(b)) return isCertificationExpiring(a) ? -1 : 1;
    const statusDifference = CERTIFICATION_STATUS_WEIGHT[a.status] - CERTIFICATION_STATUS_WEIGHT[b.status];
    if (statusDifference) return statusDifference;
    const dateA = a.targetDate || a.expiresAt || a.updatedAt;
    const dateB = b.targetDate || b.expiresAt || b.updatedAt;
    return dateA.localeCompare(dateB);
  });
}

export function certificationSummary(record: CertificationRecord): string {
  const details = [record.provider, record.examCode, record.status, `${certificationProgress(record)}%`].filter(Boolean);
  if (record.expiresAt) details.push(`expires ${record.expiresAt}`);
  return `${record.title}${details.length ? ` (${details.join(", ")})` : ""}`;
}

export function certificationPlanText(records: CertificationRecord[]): string {
  return sortCertificationRecords(records)
    .map((record) => {
      const lines = [
        certificationSummary(record),
        record.targetDate ? `Target date: ${record.targetDate}` : "",
        record.issuedAt ? `Issued: ${record.issuedAt}` : "",
        record.credentialUrl ? `Credential: ${record.credentialUrl}` : "",
        record.notes ? `Notes: ${record.notes}` : "",
        record.skills.length ? `Skills: ${record.skills.join(", ")}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    })
    .join("\n\n");
}

export function certificationCategoryCounts(records: CertificationRecord[]): Record<CertificationCategory, number> {
  const counts = CERTIFICATION_CATEGORIES.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {} as Record<CertificationCategory, number>);
  records.forEach((record) => {
    counts[record.category || "other"] += 1;
  });
  return counts;
}

export function certificationSkillCounts(records: CertificationRecord[]): Record<string, number> {
  return records.flatMap((record) => record.skills || []).reduce<Record<string, number>>((counts, skill) => {
    counts[skill] = (counts[skill] || 0) + 1;
    return counts;
  }, {});
}

export function certificationStatusCounts(records: CertificationRecord[]): Record<CertificationStatus, number> {
  const counts = CERTIFICATION_STATUSES.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {} as Record<CertificationStatus, number>);
  records.forEach((record) => {
    counts[record.status || "planned"] += 1;
  });
  return counts;
}

export function certificationRemainingStudyHours(records: CertificationRecord[]): number {
  return records
    .filter((record) => record.status !== "earned" && record.status !== "archived")
    .reduce((total, record) => total + Math.max(0, record.studyHours - record.completedHours), 0);
}

export function certificationTotalCost(records: CertificationRecord[]): number {
  return records
    .filter((record) => record.status !== "archived")
    .reduce((total, record) => total + Math.max(0, record.cost || 0), 0);
}

export function nextCertificationDate(records: CertificationRecord[]): { title: string; date: string; type: "target" | "renewal" } | null {
  const upcoming = records
    .filter((record) => record.status !== "archived")
    .flatMap((record) => [
      record.targetDate ? { title: record.title, date: record.targetDate, type: "target" as const } : null,
      record.expiresAt ? { title: record.title, date: record.expiresAt, type: "renewal" as const } : null,
    ])
    .filter((item): item is { title: string; date: string; type: "target" | "renewal" } => Boolean(item))
    .filter((item) => item.date >= todayDateKey())
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] || null;
}

export function normalizeCertificationRecord(record: Partial<CertificationRecord>): CertificationRecord {
  const base = createCertificationRecord(record.title || "Untitled certification");
  return {
    ...base,
    ...record,
    cost: Math.max(0, Number(record.cost ?? base.cost)),
    studyHours: Math.max(0, Number(record.studyHours ?? base.studyHours)),
    completedHours: Math.max(0, Number(record.completedHours ?? base.completedHours)),
    renewalWindowDays: Math.max(1, Number(record.renewalWindowDays ?? base.renewalWindowDays)),
    skills: record.skills || [],
  };
}

export function mergeCertificationRecords(current: CertificationRecord[], incoming: CertificationRecord[]): CertificationRecord[] {
  const byId = new Map(current.map((record) => [record.id, record]));
  incoming.map(normalizeCertificationRecord).forEach((record) => byId.set(record.id, record));
  return sortCertificationRecords([...byId.values()]);
}

export function earnedCertificationCount(records: CertificationRecord[]): number {
  return records.filter((record) => record.status === "earned").length;
}

export function expiredCertificationCount(records: CertificationRecord[]): number {
  return records.filter((record) => isCertificationExpired(record)).length;
}

export function expiringCertificationCount(records: CertificationRecord[]): number {
  return records.filter((record) => isCertificationExpiring(record)).length;
}

export function averageCertificationProgress(records: CertificationRecord[]): number {
  const visibleRecords = records.filter((record) => record.status !== "archived");
  return visibleRecords.length ? Math.round(visibleRecords.reduce((total, record) => total + certificationProgress(record), 0) / visibleRecords.length) : 0;
}

export function certificationProviderCounts(records: CertificationRecord[]): Record<string, number> {
  return records.filter((record) => record.provider && record.status !== "archived").reduce<Record<string, number>>((counts, record) => {
    counts[record.provider] = (counts[record.provider] || 0) + 1;
    return counts;
  }, {});
}

export function plannedCertificationCount(records: CertificationRecord[]): number {
  return records.filter((record) => record.status === "planned").length;
}

export function studyingCertificationCount(records: CertificationRecord[]): number {
  return records.filter((record) => record.status === "studying").length;
}

export function favoriteCertificationCount(records: CertificationRecord[]): number {
  return records.filter((record) => record.favorite && record.status !== "archived").length;
}

export function certificationCredentialCount(records: CertificationRecord[]): number {
  return records.filter((record) => record.status !== "archived" && Boolean(record.credentialUrl)).length;
}
