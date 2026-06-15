export interface WeeklyReview {
  id: string;
  weekOf: string;
  wins: string;
  challenges: string;
  lessons: string;
  nextFocus: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export function weekStart(date = new Date()): string {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - ((day + 6) % 7));
  return result.toISOString().slice(0, 10);
}

export function createWeeklyReview(date = new Date()): WeeklyReview {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    weekOf: weekStart(date),
    wins: "",
    challenges: "",
    lessons: "",
    nextFocus: "",
    confidence: 5,
    createdAt: now,
    updatedAt: now,
  };
}

export function weeklyReviewCompletion(review: WeeklyReview): number {
  const fields = [review.wins, review.challenges, review.lessons, review.nextFocus];
  return Math.round((fields.filter((field) => field.trim()).length / fields.length) * 100);
}

export function weeklyReviewSummary(review: WeeklyReview): string {
  return [
    `Week of ${review.weekOf} · Confidence ${review.confidence}/10`,
    `Wins: ${review.wins || "Not added"}`,
    `Challenges: ${review.challenges || "Not added"}`,
    `Lessons: ${review.lessons || "Not added"}`,
    `Next focus: ${review.nextFocus || "Not added"}`,
  ].join("\n");
}

export function sortWeeklyReviews(reviews: WeeklyReview[]): WeeklyReview[] {
  return [...reviews].sort((a, b) => b.weekOf.localeCompare(a.weekOf));
}

export function averageReviewConfidence(reviews: WeeklyReview[]): number {
  if (!reviews.length) return 0;
  return Math.round((reviews.reduce((sum, review) => sum + review.confidence, 0) / reviews.length) * 10) / 10;
}

export function normalizeWeeklyReview(review: Partial<WeeklyReview>): WeeklyReview {
  return { ...createWeeklyReview(new Date(`${review.weekOf || weekStart()}T00:00:00`)), ...review };
}
