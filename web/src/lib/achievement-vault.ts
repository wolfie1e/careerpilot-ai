export type AchievementCategory = "leadership" | "technical" | "impact" | "collaboration" | "growth" | "other";

export type AchievementStatus = "draft" | "ready" | "archived";

export interface AchievementStory {
  id: string;
  title: string;
  category: AchievementCategory;
  status: AchievementStatus;
  situation: string;
  task: string;
  action: string;
  result: string;
  metric: string;
  role: string;
  company: string;
  date: string;
  confidence: number;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export const ACHIEVEMENT_CATEGORIES: Array<{ value: AchievementCategory; label: string }> = [
  { value: "leadership", label: "Leadership" },
  { value: "technical", label: "Technical" },
  { value: "impact", label: "Impact" },
  { value: "collaboration", label: "Collaboration" },
  { value: "growth", label: "Growth" },
  { value: "other", label: "Other" },
];

export const ACHIEVEMENT_STATUSES: Array<{ value: AchievementStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready" },
  { value: "archived", label: "Archived" },
];

export function createAchievementStory(title: string): AchievementStory {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    category: "other",
    status: "draft",
    situation: "",
    task: "",
    action: "",
    result: "",
    metric: "",
    role: "",
    company: "",
    date: "",
    confidence: 5,
    favorite: false,
    createdAt: now,
    updatedAt: now,
    tags: [],
  };
}

export function achievementCompletion(story: AchievementStory): number {
  const fields = [story.title, story.situation, story.task, story.action, story.result, story.metric];
  return Math.round((fields.filter((field) => field.trim()).length / fields.length) * 100);
}

export function isAchievementReady(story: AchievementStory): boolean {
  return story.status === "ready" || achievementCompletion(story) >= 85;
}

export function sortAchievementStories(stories: AchievementStory[]): AchievementStory[] {
  return [...stories].sort((a, b) => {
    if (a.status === "archived" && b.status !== "archived") return 1;
    if (b.status === "archived" && a.status !== "archived") return -1;
    if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
    const completionDifference = achievementCompletion(b) - achievementCompletion(a);
    if (completionDifference) return completionDifference;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function achievementStarText(story: AchievementStory): string {
  return [
    `Situation: ${story.situation || "Not captured"}`,
    `Task: ${story.task || "Not captured"}`,
    `Action: ${story.action || "Not captured"}`,
    `Result: ${story.result || "Not captured"}`,
    story.metric ? `Metric: ${story.metric}` : "",
  ].filter(Boolean).join("\n");
}

export function achievementSummary(story: AchievementStory): string {
  const details = [story.category, story.status, `${achievementCompletion(story)}%`];
  if (story.metric) details.push(story.metric);
  return `${story.title} (${details.join(", ")})`;
}

export function achievementPipelineText(stories: AchievementStory[]): string {
  return sortAchievementStories(stories).map((story) => `${achievementSummary(story)}\n${achievementStarText(story)}`).join("\n\n");
}

export function readyAchievementCount(stories: AchievementStory[]): number {
  return stories.filter((story) => isAchievementReady(story) && story.status !== "archived").length;
}

export function favoriteAchievementCount(stories: AchievementStory[]): number {
  return stories.filter((story) => story.favorite && story.status !== "archived").length;
}

export function achievementCategoryCounts(stories: AchievementStory[]): Record<AchievementCategory, number> {
  const counts: Record<AchievementCategory, number> = { leadership: 0, technical: 0, impact: 0, collaboration: 0, growth: 0, other: 0 };
  stories.forEach((story) => { counts[story.category || "other"] += 1; });
  return counts;
}

export function achievementTagCounts(stories: AchievementStory[]): Record<string, number> {
  return stories.flatMap((story) => story.tags || []).reduce<Record<string, number>>((counts, tag) => {
    counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});
}

export function normalizeAchievementStory(story: Partial<AchievementStory>): AchievementStory {
  const base = createAchievementStory(story.title || "Untitled achievement");
  return {
    ...base,
    ...story,
    confidence: Math.min(10, Math.max(1, Number(story.confidence ?? base.confidence))),
    tags: story.tags || [],
  };
}

export function mergeAchievementStories(current: AchievementStory[], incoming: AchievementStory[]): AchievementStory[] {
  const byId = new Map(current.map((story) => [story.id, story]));
  incoming.map(normalizeAchievementStory).forEach((story) => byId.set(story.id, story));
  return sortAchievementStories([...byId.values()]);
}

export function archivedAchievementCount(stories: AchievementStory[]): number {
  return stories.filter((story) => story.status === "archived").length;
}

export function averageAchievementConfidence(stories: AchievementStory[]): number {
  const activeStories = stories.filter((story) => story.status !== "archived");
  return activeStories.length ? Math.round(activeStories.reduce((total, story) => total + story.confidence, 0) / activeStories.length) : 0;
}

export function achievementRoleCounts(stories: AchievementStory[]): Record<string, number> {
  return stories.filter((story) => story.role && story.status !== "archived").reduce<Record<string, number>>((counts, story) => {
    counts[story.role] = (counts[story.role] || 0) + 1;
    return counts;
  }, {});
}

export function achievementCompanyCounts(stories: AchievementStory[]): Record<string, number> {
  return stories.filter((story) => story.company && story.status !== "archived").reduce<Record<string, number>>((counts, story) => {
    counts[story.company] = (counts[story.company] || 0) + 1;
    return counts;
  }, {});
}

export function draftAchievementCount(stories: AchievementStory[]): number {
  return stories.filter((story) => story.status === "draft").length;
}

export function averageAchievementCompletion(stories: AchievementStory[]): number {
  const activeStories = stories.filter((story) => story.status !== "archived");
  return activeStories.length ? Math.round(activeStories.reduce((total, story) => total + achievementCompletion(story), 0) / activeStories.length) : 0;
}

export function achievementMetricCount(stories: AchievementStory[]): number {
  return stories.filter((story) => story.status !== "archived" && Boolean(story.metric)).length;
}

export function lowConfidenceAchievementCount(stories: AchievementStory[], threshold = 5): number {
  return stories.filter((story) => story.status !== "archived" && story.confidence <= threshold).length;
}
