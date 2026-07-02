export type PortfolioProjectStatus = "idea" | "planning" | "building" | "polishing" | "published" | "archived";
export type PortfolioProjectPriority = "low" | "medium" | "high";
export interface PortfolioProject {
  id: string; name: string; summary: string; status: PortfolioProjectStatus; priority: PortfolioProjectPriority;
  targetRole: string; problem: string; solution: string; impact: string; techStack: string[]; skills: string[];
  repositoryUrl: string; liveUrl: string; caseStudyUrl: string; imageUrl: string; startDate: string; targetDate: string;
  progress: number; hoursSpent: number; milestoneCount: number; completedMilestones: number; nextAction: string;
  tags: string[]; notes: string; featured: boolean; createdAt: string; updatedAt: string;
}
export const PORTFOLIO_PROJECT_STATUSES: Array<{ value: PortfolioProjectStatus; label: string }> = [
  { value: "idea", label: "Idea" }, { value: "planning", label: "Planning" }, { value: "building", label: "Building" },
  { value: "polishing", label: "Polishing" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" },
];
export const PORTFOLIO_PROJECT_PRIORITIES: Array<{ value: PortfolioProjectPriority; label: string }> = [
  { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" },
];
export function createPortfolioProject(name: string): PortfolioProject { const now = new Date().toISOString(); return { id: crypto.randomUUID(), name: name.trim(), summary: "", status: "idea", priority: "medium", targetRole: "", problem: "", solution: "", impact: "", techStack: [], skills: [], repositoryUrl: "", liveUrl: "", caseStudyUrl: "", imageUrl: "", startDate: "", targetDate: "", progress: 0, hoursSpent: 0, milestoneCount: 0, completedMilestones: 0, nextAction: "", tags: [], notes: "", featured: false, createdAt: now, updatedAt: now }; }
export function portfolioTodayKey(date = new Date()): string { return date.toISOString().slice(0, 10); }
export function isPortfolioProjectOverdue(project: PortfolioProject, today = portfolioTodayKey()): boolean { return Boolean(project.targetDate && project.targetDate < today && !["published", "archived"].includes(project.status)); }
const STATUS_WEIGHT: Record<PortfolioProjectStatus, number> = { building: 0, polishing: 1, planning: 2, idea: 3, published: 4, archived: 5 };
const PRIORITY_WEIGHT: Record<PortfolioProjectPriority, number> = { high: 0, medium: 1, low: 2 };
export function sortPortfolioProjects(projects: PortfolioProject[]): PortfolioProject[] { return [...projects].sort((a, b) => { if (a.status === "archived" && b.status !== "archived") return 1; if (b.status === "archived" && a.status !== "archived") return -1; if (a.featured !== b.featured) return a.featured ? -1 : 1; if (isPortfolioProjectOverdue(a) !== isPortfolioProjectOverdue(b)) return isPortfolioProjectOverdue(a) ? -1 : 1; return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority] || STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status] || b.updatedAt.localeCompare(a.updatedAt); }); }
export function normalizePortfolioProject(project: Partial<PortfolioProject>): PortfolioProject { const base = createPortfolioProject(project.name || "Untitled project"); return { ...base, ...project, progress: Math.min(100, Math.max(0, Number(project.progress || 0))), hoursSpent: Math.max(0, Number(project.hoursSpent || 0)), milestoneCount: Math.max(0, Number(project.milestoneCount || 0)), completedMilestones: Math.max(0, Number(project.completedMilestones || 0)), techStack: project.techStack || [], skills: project.skills || [], tags: project.tags || [] }; }
export function mergePortfolioProjects(current: PortfolioProject[], incoming: PortfolioProject[]): PortfolioProject[] { const byId = new Map(current.map((project) => [project.id, project])); incoming.map(normalizePortfolioProject).forEach((project) => byId.set(project.id, project)); return sortPortfolioProjects([...byId.values()]); }
export function portfolioStatusCounts(projects: PortfolioProject[]): Record<PortfolioProjectStatus, number> { const counts = PORTFOLIO_PROJECT_STATUSES.reduce((result, item) => ({ ...result, [item.value]: 0 }), {} as Record<PortfolioProjectStatus, number>); projects.forEach((project) => { counts[project.status] += 1; }); return counts; }
export function portfolioSkillCounts(projects: PortfolioProject[]): Record<string, number> { return projects.flatMap((project) => project.skills).reduce<Record<string, number>>((counts, skill) => { counts[skill] = (counts[skill] || 0) + 1; return counts; }, {}); }
export function portfolioTechCounts(projects: PortfolioProject[]): Record<string, number> { return projects.flatMap((project) => project.techStack).reduce<Record<string, number>>((counts, tech) => { counts[tech] = (counts[tech] || 0) + 1; return counts; }, {}); }
export function portfolioProjectText(projects: PortfolioProject[]): string { return sortPortfolioProjects(projects).map((project) => [`${project.name} (${project.status}, ${project.progress}%)`, project.summary, project.nextAction ? `Next: ${project.nextAction}` : "", project.skills.length ? `Skills: ${project.skills.join(", ")}` : "", project.liveUrl || project.repositoryUrl].filter(Boolean).join("\n")).join("\n\n"); }
export function portfolioActiveCount(projects: PortfolioProject[]): number { return projects.filter((project) => !["published", "archived"].includes(project.status)).length; }
export function portfolioPublishedCount(projects: PortfolioProject[]): number { return projects.filter((project) => project.status === "published").length; }
export function portfolioOverdueCount(projects: PortfolioProject[]): number { return projects.filter((project) => isPortfolioProjectOverdue(project)).length; }
export function portfolioTotalHours(projects: PortfolioProject[]): number { return projects.reduce((sum, project) => sum + project.hoursSpent, 0); }
export function portfolioAverageProgress(projects: PortfolioProject[]): number { const active = projects.filter((project) => project.status !== "archived"); return active.length ? Math.round(active.reduce((sum, project) => sum + project.progress, 0) / active.length) : 0; }
export function portfolioFeaturedCount(projects: PortfolioProject[]): number { return projects.filter((project) => project.featured && project.status !== "archived").length; }
export function portfolioSkillCoverage(projects: PortfolioProject[]): number { return new Set(projects.filter((project) => project.status !== "archived").flatMap((project) => project.skills)).size; }
export function portfolioTechCoverage(projects: PortfolioProject[]): number { return new Set(projects.filter((project) => project.status !== "archived").flatMap((project) => project.techStack)).size; }
export function portfolioProjectCompletion(project: PortfolioProject): number { const checks = [project.summary, project.problem, project.solution, project.impact, project.skills.length, project.techStack.length, project.repositoryUrl || project.liveUrl]; return Math.round((checks.filter(Boolean).length / checks.length) * 100); }
export function portfolioProjectReadiness(project: PortfolioProject): number { return Math.round(project.progress * 0.6 + portfolioProjectCompletion(project) * 0.4); }
