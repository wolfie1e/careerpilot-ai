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
