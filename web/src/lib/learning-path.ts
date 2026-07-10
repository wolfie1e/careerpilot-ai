export type LearningResourceType = "course" | "book" | "article" | "video" | "project" | "practice" | "other";

export type LearningResourceStatus = "planned" | "in_progress" | "completed" | "paused" | "archived";

export type LearningResourcePriority = "low" | "medium" | "high";

export interface LearningResource {
  id: string;
  title: string;
  provider: string;
  type: LearningResourceType;
  status: LearningResourceStatus;
  priority: LearningResourcePriority;
  url: string;
  skillArea: string;
  targetRole: string;
  startedAt: string;
  targetDate: string;
  completedAt: string;
  estimatedHours: number;
  completedHours: number;
  cost: number;
  rating: number;
  notes: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const LEARNING_RESOURCE_TYPES: Array<{ value: LearningResourceType; label: string }> = [
  { value: "course", label: "Course" },
  { value: "book", label: "Book" },
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "project", label: "Project" },
  { value: "practice", label: "Practice" },
  { value: "other", label: "Other" },
];

export const LEARNING_RESOURCE_STATUSES: Array<{ value: LearningResourceStatus; label: string }> = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "archived", label: "Archived" },
];

export const LEARNING_RESOURCE_PRIORITIES: Array<{ value: LearningResourcePriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function createLearningResource(title: string): LearningResource {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    provider: "",
    type: "course",
    status: "planned",
    priority: "medium",
    url: "",
    skillArea: "",
    targetRole: "",
    startedAt: "",
    targetDate: "",
    completedAt: "",
    estimatedHours: 10,
    completedHours: 0,
    cost: 0,
    rating: 0,
    notes: "",
    tags: [],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function learningProgress(resource: LearningResource): number {
  if (resource.status === "completed") return 100;
  if (resource.estimatedHours <= 0) return resource.completedHours > 0 ? 100 : 0;
  return Math.min(100, Math.round((resource.completedHours / resource.estimatedHours) * 100));
}

export function learningTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isLearningResourceOverdue(resource: LearningResource, dateKey = learningTodayKey()): boolean {
  return Boolean(resource.targetDate && resource.targetDate < dateKey && !["completed", "archived"].includes(resource.status));
}

export function isLearningResourceDueSoon(resource: LearningResource, today = new Date()): boolean {
  if (!resource.targetDate || ["completed", "archived"].includes(resource.status)) return false;
  const due = new Date(`${resource.targetDate}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= 7;
}

const LEARNING_PRIORITY_WEIGHT: Record<LearningResourcePriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const LEARNING_STATUS_WEIGHT: Record<LearningResourceStatus, number> = {
  in_progress: 0,
  planned: 1,
  paused: 2,
  completed: 3,
  archived: 4,
};

export function sortLearningResources(resources: LearningResource[]): LearningResource[] {
  return [...resources].sort((a, b) => {
    if (a.status === "archived" && b.status !== "archived") return 1;
    if (b.status === "archived" && a.status !== "archived") return -1;
    if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
    if (isLearningResourceOverdue(a) !== isLearningResourceOverdue(b)) return isLearningResourceOverdue(a) ? -1 : 1;
    const priorityDifference = LEARNING_PRIORITY_WEIGHT[b.priority] - LEARNING_PRIORITY_WEIGHT[a.priority];
    if (priorityDifference) return priorityDifference;
    const statusDifference = LEARNING_STATUS_WEIGHT[a.status] - LEARNING_STATUS_WEIGHT[b.status];
    if (statusDifference) return statusDifference;
    if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
    if (a.targetDate) return -1;
    if (b.targetDate) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function learningResourceSummary(resource: LearningResource): string {
  const details = [resource.provider, resource.type, resource.priority, resource.status, `${learningProgress(resource)}%`].filter(Boolean);
  if (resource.targetDate) details.push(`target ${resource.targetDate}`);
  return `${resource.title}${details.length ? ` (${details.join(", ")})` : ""}`;
}

export function learningPlanText(resources: LearningResource[]): string {
  return sortLearningResources(resources)
    .map((resource) => {
      const lines = [
        learningResourceSummary(resource),
        resource.skillArea ? `Skill: ${resource.skillArea}` : "",
        resource.targetRole ? `Target role: ${resource.targetRole}` : "",
        resource.url ? `URL: ${resource.url}` : "",
        resource.notes ? `Notes: ${resource.notes}` : "",
        resource.tags.length ? `Tags: ${resource.tags.join(", ")}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    })
    .join("\n\n");
}

export function learningTypeCounts(resources: LearningResource[]): Record<LearningResourceType, number> {
  const counts = LEARNING_RESOURCE_TYPES.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {} as Record<LearningResourceType, number>);
  resources.forEach((resource) => {
    counts[resource.type || "other"] += 1;
  });
  return counts;
}

export function learningStatusCounts(resources: LearningResource[]): Record<LearningResourceStatus, number> {
  const counts = LEARNING_RESOURCE_STATUSES.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {} as Record<LearningResourceStatus, number>);
  resources.forEach((resource) => {
    counts[resource.status || "planned"] += 1;
  });
  return counts;
}

export function learningTagCounts(resources: LearningResource[]): Record<string, number> {
  return resources.flatMap((resource) => resource.tags || []).reduce<Record<string, number>>((counts, tag) => {
    counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});
}

export function normalizeLearningResource(resource: Partial<LearningResource>): LearningResource {
  const base = createLearningResource(resource.title || "Untitled learning resource");
  return {
    ...base,
    ...resource,
    estimatedHours: Math.max(0, Number(resource.estimatedHours ?? base.estimatedHours)),
    completedHours: Math.max(0, Number(resource.completedHours ?? base.completedHours)),
    cost: Math.max(0, Number(resource.cost ?? base.cost)),
    rating: Math.min(5, Math.max(0, Number(resource.rating ?? base.rating))),
    tags: resource.tags || [],
  };
}

export function mergeLearningResources(current: LearningResource[], incoming: LearningResource[]): LearningResource[] {
  const byId = new Map(current.map((resource) => [resource.id, resource]));
  incoming.map(normalizeLearningResource).forEach((resource) => byId.set(resource.id, resource));
  return sortLearningResources([...byId.values()]);
}

export function learningRemainingHours(resources: LearningResource[]): number {
  return resources
    .filter((resource) => !["completed", "archived"].includes(resource.status))
    .reduce((total, resource) => total + Math.max(0, resource.estimatedHours - resource.completedHours), 0);
}

export function learningTotalCost(resources: LearningResource[]): number {
  return resources
    .filter((resource) => resource.status !== "archived")
    .reduce((total, resource) => total + Math.max(0, resource.cost || 0), 0);
}

export function nextLearningDate(resources: LearningResource[]): { title: string; date: string } | null {
  const upcoming = resources
    .filter((resource) => resource.status !== "archived" && resource.targetDate >= learningTodayKey())
    .map((resource) => ({ title: resource.title, date: resource.targetDate }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] || null;
}

export function learningOverdueCount(resources: LearningResource[]): number {
  return resources.filter((resource) => isLearningResourceOverdue(resource)).length;
}

export function learningDueSoonCount(resources: LearningResource[]): number {
  return resources.filter((resource) => isLearningResourceDueSoon(resource)).length;
}

export function activeLearningCount(resources: LearningResource[]): number {
  return resources.filter((resource) => !["completed", "archived"].includes(resource.status)).length;
}

export function completedLearningCount(resources: LearningResource[]): number {
  return resources.filter((resource) => resource.status === "completed").length;
}

export function favoriteLearningCount(resources: LearningResource[]): number {
  return resources.filter((resource) => resource.favorite && resource.status !== "archived").length;
}

export function learningSkillAreaCounts(resources: LearningResource[]): Record<string, number> {
  return resources.filter((resource) => resource.skillArea && resource.status !== "archived").reduce<Record<string, number>>((counts, resource) => {
    counts[resource.skillArea] = (counts[resource.skillArea] || 0) + 1;
    return counts;
  }, {});
}

export function learningAverageProgress(resources: LearningResource[]): number {
  const visibleResources = resources.filter((resource) => resource.status !== "archived");
  return visibleResources.length ? Math.round(visibleResources.reduce((total, resource) => total + learningProgress(resource), 0) / visibleResources.length) : 0;
}

export function learningAverageRating(resources: LearningResource[]): number {
  const ratedResources = resources.filter((resource) => resource.status !== "archived" && resource.rating > 0);
  return ratedResources.length ? Math.round((ratedResources.reduce((total, resource) => total + resource.rating, 0) / ratedResources.length) * 10) / 10 : 0;
}
