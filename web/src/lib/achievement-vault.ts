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

export function achievementStarText(story: AchievementStory): string {
  return [
    `Situation: ${story.situation || "Not captured"}`,
    `Task: ${story.task || "Not captured"}`,
    `Action: ${story.action || "Not captured"}`,
    `Result: ${story.result || "Not captured"}`,
    story.metric ? `Metric: ${story.metric}` : "",
  ].filter(Boolean).join("\n");
}
