export type QuestionCategory = "behavioral" | "technical" | "system_design" | "leadership" | "product" | "hr" | "other";
export type QuestionStatus = "new" | "drafting" | "practicing" | "ready" | "archived";

export interface QuestionBankItem {
  id: string; question: string; category: QuestionCategory; status: QuestionStatus; targetRole: string;
  company: string; answerOutline: string; sampleAnswer: string; keyPoints: string[]; tags: string[];
  confidence: number; difficulty: number; practiceCount: number; lastPracticedAt: string; nextReviewAt: string;
  sourceUrl: string; notes: string; favorite: boolean; createdAt: string; updatedAt: string;
}

export const QUESTION_CATEGORIES: Array<{ value: QuestionCategory; label: string }> = [
  { value: "behavioral", label: "Behavioral" }, { value: "technical", label: "Technical" },
  { value: "system_design", label: "System design" }, { value: "leadership", label: "Leadership" },
  { value: "product", label: "Product" }, { value: "hr", label: "HR / General" }, { value: "other", label: "Other" },
];
export const QUESTION_STATUSES: Array<{ value: QuestionStatus; label: string }> = [
  { value: "new", label: "New" }, { value: "drafting", label: "Drafting" }, { value: "practicing", label: "Practicing" },
  { value: "ready", label: "Ready" }, { value: "archived", label: "Archived" },
];

export function createQuestionBankItem(question: string): QuestionBankItem {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), question: question.trim(), category: "behavioral", status: "new", targetRole: "", company: "", answerOutline: "", sampleAnswer: "", keyPoints: [], tags: [], confidence: 5, difficulty: 5, practiceCount: 0, lastPracticedAt: "", nextReviewAt: "", sourceUrl: "", notes: "", favorite: false, createdAt: now, updatedAt: now };
}
export function questionTodayKey(date = new Date()): string { return date.toISOString().slice(0, 10); }
export function isQuestionReviewDue(item: QuestionBankItem, today = questionTodayKey()): boolean { return Boolean(item.nextReviewAt && item.nextReviewAt <= today && item.status !== "archived"); }
const STATUS_WEIGHT: Record<QuestionStatus, number> = { practicing: 0, drafting: 1, new: 2, ready: 3, archived: 4 };
export function sortQuestionBank(items: QuestionBankItem[]): QuestionBankItem[] {
  return [...items].sort((a, b) => {
    if (a.status === "archived" && b.status !== "archived") return 1; if (b.status === "archived" && a.status !== "archived") return -1;
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    if (isQuestionReviewDue(a) !== isQuestionReviewDue(b)) return isQuestionReviewDue(a) ? -1 : 1;
    return STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status] || a.confidence - b.confidence || b.updatedAt.localeCompare(a.updatedAt);
  });
}
export function normalizeQuestionBankItem(item: Partial<QuestionBankItem>): QuestionBankItem {
  const base = createQuestionBankItem(item.question || "Untitled question");
  return { ...base, ...item, confidence: Math.min(10, Math.max(1, Number(item.confidence ?? 5))), difficulty: Math.min(10, Math.max(1, Number(item.difficulty ?? 5))), practiceCount: Math.max(0, Number(item.practiceCount || 0)), keyPoints: item.keyPoints || [], tags: item.tags || [] };
}
export function mergeQuestionBank(current: QuestionBankItem[], incoming: QuestionBankItem[]): QuestionBankItem[] {
  const byId = new Map(current.map((item) => [item.id, item])); incoming.map(normalizeQuestionBankItem).forEach((item) => byId.set(item.id, item)); return sortQuestionBank([...byId.values()]);
}
export function questionStatusCounts(items: QuestionBankItem[]): Record<QuestionStatus, number> {
  const counts = QUESTION_STATUSES.reduce((result, item) => ({ ...result, [item.value]: 0 }), {} as Record<QuestionStatus, number>); items.forEach((item) => { counts[item.status] += 1; }); return counts;
}
export function questionCategoryCounts(items: QuestionBankItem[]): Record<QuestionCategory, number> {
  const counts = QUESTION_CATEGORIES.reduce((result, item) => ({ ...result, [item.value]: 0 }), {} as Record<QuestionCategory, number>); items.forEach((item) => { counts[item.category] += 1; }); return counts;
}
export function questionTagCounts(items: QuestionBankItem[]): Record<string, number> { return items.flatMap((item) => item.tags).reduce<Record<string, number>>((counts, tag) => { counts[tag] = (counts[tag] || 0) + 1; return counts; }, {}); }
export function averageQuestionConfidence(items: QuestionBankItem[]): number { const active = items.filter((item) => item.status !== "archived"); return active.length ? Math.round(active.reduce((sum, item) => sum + item.confidence, 0) / active.length) : 0; }
export function questionBankText(items: QuestionBankItem[]): string { return sortQuestionBank(items).map((item) => [`${item.question} (${item.category}, ${item.status}, confidence ${item.confidence}/10)`, item.answerOutline ? `Outline: ${item.answerOutline}` : "", item.keyPoints.length ? `Key points: ${item.keyPoints.join(", ")}` : "", item.nextReviewAt ? `Review: ${item.nextReviewAt}` : ""].filter(Boolean).join("\n")).join("\n\n"); }
export function questionReviewDueCount(items: QuestionBankItem[]): number { return items.filter((item) => isQuestionReviewDue(item)).length; }
