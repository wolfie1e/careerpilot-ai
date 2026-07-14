export type CompanyStage = "watching" | "researching" | "networking" | "ready" | "archived";
export type CompanyPriority = "low" | "medium" | "high";

export interface TargetCompany {
  id: string;
  name: string;
  industry: string;
  location: string;
  website: string;
  careersUrl: string;
  stage: CompanyStage;
  priority: CompanyPriority;
  fitScore: number;
  interestScore: number;
  openRoles: number;
  contactCount: number;
  targetRole: string;
  nextAction: string;
  nextActionDate: string;
  cultureNotes: string;
  researchNotes: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const COMPANY_STAGES: Array<{ value: CompanyStage; label: string }> = [
  { value: "watching", label: "Watching" },
  { value: "researching", label: "Researching" },
  { value: "networking", label: "Networking" },
  { value: "ready", label: "Ready to apply" },
  { value: "archived", label: "Archived" },
];

export const COMPANY_PRIORITIES: Array<{ value: CompanyPriority; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function createTargetCompany(name: string): TargetCompany {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), name: name.trim(), industry: "", location: "", website: "", careersUrl: "",
    stage: "watching", priority: "medium", fitScore: 5, interestScore: 5, openRoles: 0, contactCount: 0,
    targetRole: "", nextAction: "", nextActionDate: "", cultureNotes: "", researchNotes: "", tags: [],
    favorite: false, createdAt: now, updatedAt: now,
  };
}

export function companyTodayKey(date = new Date()): string { return date.toISOString().slice(0, 10); }
export function isCompanyActionDue(company: TargetCompany, today = companyTodayKey()): boolean {
  return Boolean(company.nextActionDate && company.nextActionDate <= today && company.stage !== "archived");
}
export function isCompanyActionSoon(company: TargetCompany, today = new Date()): boolean {
  if (!company.nextActionDate || company.stage === "archived") return false;
  const due = new Date(company.nextActionDate + "T00:00:00");
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= 7;
}

const STAGE_WEIGHT: Record<CompanyStage, number> = { ready: 0, networking: 1, researching: 2, watching: 3, archived: 4 };
const PRIORITY_WEIGHT: Record<CompanyPriority, number> = { high: 0, medium: 1, low: 2 };

export function sortTargetCompanies(companies: TargetCompany[]): TargetCompany[] {
  return [...companies].sort((a, b) => {
    if (a.stage === "archived" && b.stage !== "archived") return 1;
    if (b.stage === "archived" && a.stage !== "archived") return -1;
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    if (isCompanyActionDue(a) !== isCompanyActionDue(b)) return isCompanyActionDue(a) ? -1 : 1;
    const priority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (priority) return priority;
    const stage = STAGE_WEIGHT[a.stage] - STAGE_WEIGHT[b.stage];
    if (stage) return stage;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function normalizeTargetCompany(company: Partial<TargetCompany>): TargetCompany {
  const base = createTargetCompany(company.name || "Untitled company");
  return { ...base, ...company, fitScore: Math.min(10, Math.max(1, Number(company.fitScore ?? 5))), interestScore: Math.min(10, Math.max(1, Number(company.interestScore ?? 5))), openRoles: Math.max(0, Number(company.openRoles || 0)), contactCount: Math.max(0, Number(company.contactCount || 0)), tags: company.tags || [] };
}

export function mergeTargetCompanies(current: TargetCompany[], incoming: TargetCompany[]): TargetCompany[] {
  const byId = new Map(current.map((company) => [company.id, company]));
  incoming.map(normalizeTargetCompany).forEach((company) => byId.set(company.id, company));
  return sortTargetCompanies([...byId.values()]);
}

export function companyStageCounts(companies: TargetCompany[]): Record<CompanyStage, number> {
  const counts = COMPANY_STAGES.reduce((result, item) => ({ ...result, [item.value]: 0 }), {} as Record<CompanyStage, number>);
  companies.forEach((company) => { counts[company.stage] += 1; });
  return counts;
}
export function companyPriorityCounts(companies: TargetCompany[]): Record<CompanyPriority, number> {
  const counts: Record<CompanyPriority, number> = { high: 0, medium: 0, low: 0 };
  companies.filter((company) => company.stage !== "archived").forEach((company) => { counts[company.priority] += 1; });
  return counts;
}

export function companyTagCounts(companies: TargetCompany[]): Record<string, number> {
  return companies.flatMap((company) => company.tags).reduce<Record<string, number>>((counts, tag) => { counts[tag] = (counts[tag] || 0) + 1; return counts; }, {});
}
export function companyIndustryCounts(companies: TargetCompany[]): Record<string, number> {
  return companies.filter((company) => company.industry && company.stage !== "archived").reduce<Record<string, number>>((counts, company) => { counts[company.industry] = (counts[company.industry] || 0) + 1; return counts; }, {});
}
export function companyLocationCounts(companies: TargetCompany[]): Record<string, number> {
  return companies.filter((company) => company.location && company.stage !== "archived").reduce<Record<string, number>>((counts, company) => { counts[company.location] = (counts[company.location] || 0) + 1; return counts; }, {});
}

export function companyAverageFit(companies: TargetCompany[]): number {
  const active = companies.filter((company) => company.stage !== "archived");
  return active.length ? Math.round(active.reduce((sum, company) => sum + company.fitScore, 0) / active.length) : 0;
}

export function companyAverageInterest(companies: TargetCompany[]): number {
  const active = companies.filter((company) => company.stage !== "archived");
  return active.length ? Math.round(active.reduce((sum, company) => sum + company.interestScore, 0) / active.length) : 0;
}
export function companyOpenRoleTotal(companies: TargetCompany[]): number {
  return companies.filter((company) => company.stage !== "archived").reduce((sum, company) => sum + company.openRoles, 0);
}
export function companyContactTotal(companies: TargetCompany[]): number {
  return companies.filter((company) => company.stage !== "archived").reduce((sum, company) => sum + company.contactCount, 0);
}
export function topTargetCompany(companies: TargetCompany[]): TargetCompany | null {
  return [...companies].filter((company) => company.stage !== "archived").sort((a, b) => (b.fitScore + b.interestScore) - (a.fitScore + a.interestScore))[0] || null;
}
export function nextCompanyAction(companies: TargetCompany[]): { name: string; action: string; date: string } | null {
  return companies.filter((company) => company.stage !== "archived" && company.nextActionDate)
    .map((company) => ({ name: company.name, action: company.nextAction || "Research company", date: company.nextActionDate }))
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
}
export function companyResearchCompletion(company: TargetCompany): number {
  const checks = [company.industry, company.location, company.website, company.targetRole, company.cultureNotes, company.researchNotes, company.nextAction];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
export function companyReadinessScore(company: TargetCompany): number {
  return Math.round((company.fitScore * 4 + company.interestScore * 3 + companyResearchCompletion(company) * 0.3) / 10);
}

export function companyPlanText(companies: TargetCompany[]): string {
  return sortTargetCompanies(companies).map((company) => [
    `${company.name} (${company.stage}, ${company.priority} priority, fit ${company.fitScore}/10)`,
    company.targetRole ? `Target role: ${company.targetRole}` : "",
    company.nextAction ? `Next action: ${company.nextAction}${company.nextActionDate ? ` by ${company.nextActionDate}` : ""}` : "",
    company.researchNotes ? `Research: ${company.researchNotes}` : "",
  ].filter(Boolean).join("\n")).join("\n\n");
}

export function favoriteTargetCompanyCount(companies: TargetCompany[]): number {
  return companies.filter((company) => company.favorite && company.stage !== "archived").length;
}
