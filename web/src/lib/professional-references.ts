export type ReferenceRelationship = "manager" | "colleague" | "client" | "mentor" | "professor" | "report" | "other";
export type ReferenceStatus = "potential" | "permission_requested" | "confirmed" | "used" | "archived";

export interface ProfessionalReference {
  id: string;
  name: string;
  title: string;
  company: string;
  relationship: ReferenceRelationship;
  status: ReferenceStatus;
  email: string;
  phone: string;
  linkedInUrl: string;
  preferredContact: "email" | "phone" | "linkedin";
  workedTogether: string;
  strengths: string[];
  supportingStories: string;
  permissionAskedAt: string;
  lastUsedAt: string;
  nextAction: string;
  nextActionDate: string;
  thankYouSent: boolean;
  notes: string;
  confidence: number;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const REFERENCE_RELATIONSHIPS: Array<{ value: ReferenceRelationship; label: string }> = [
  { value: "manager", label: "Manager" }, { value: "colleague", label: "Colleague" },
  { value: "client", label: "Client" }, { value: "mentor", label: "Mentor" },
  { value: "professor", label: "Professor" }, { value: "report", label: "Direct report" },
  { value: "other", label: "Other" },
];

export const REFERENCE_STATUSES: Array<{ value: ReferenceStatus; label: string }> = [
  { value: "potential", label: "Potential" }, { value: "permission_requested", label: "Permission requested" },
  { value: "confirmed", label: "Confirmed" }, { value: "used", label: "Recently used" },
  { value: "archived", label: "Archived" },
];

export function createProfessionalReference(name: string): ProfessionalReference {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), name: name.trim(), title: "", company: "", relationship: "manager", status: "potential",
    email: "", phone: "", linkedInUrl: "", preferredContact: "email", workedTogether: "", strengths: [],
    supportingStories: "", permissionAskedAt: "", lastUsedAt: "", nextAction: "", nextActionDate: "",
    thankYouSent: false, notes: "", confidence: 5, favorite: false, createdAt: now, updatedAt: now,
  };
}

export function referenceTodayKey(date = new Date()): string { return date.toISOString().slice(0, 10); }
export function isReferenceActionDue(reference: ProfessionalReference, today = referenceTodayKey()): boolean {
  return Boolean(reference.nextActionDate && reference.nextActionDate <= today && reference.status !== "archived");
}
export function isReferenceActionSoon(reference: ProfessionalReference, today = new Date()): boolean {
  if (!reference.nextActionDate || reference.status === "archived") return false;
  const due = new Date(reference.nextActionDate + "T00:00:00");
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= 7;
}

const STATUS_WEIGHT: Record<ReferenceStatus, number> = { confirmed: 0, permission_requested: 1, potential: 2, used: 3, archived: 4 };
export function sortProfessionalReferences(references: ProfessionalReference[]): ProfessionalReference[] {
  return [...references].sort((a, b) => {
    if (a.status === "archived" && b.status !== "archived") return 1;
    if (b.status === "archived" && a.status !== "archived") return -1;
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    if (isReferenceActionDue(a) !== isReferenceActionDue(b)) return isReferenceActionDue(a) ? -1 : 1;
    const status = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
    return status || b.confidence - a.confidence || b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function normalizeProfessionalReference(reference: Partial<ProfessionalReference>): ProfessionalReference {
  const base = createProfessionalReference(reference.name || "Untitled reference");
  return { ...base, ...reference, strengths: reference.strengths || [], confidence: Math.min(10, Math.max(1, Number(reference.confidence ?? 5))) };
}

export function mergeProfessionalReferences(current: ProfessionalReference[], incoming: ProfessionalReference[]): ProfessionalReference[] {
  const byId = new Map(current.map((reference) => [reference.id, reference]));
  incoming.map(normalizeProfessionalReference).forEach((reference) => byId.set(reference.id, reference));
  return sortProfessionalReferences([...byId.values()]);
}

export function referenceStatusCounts(references: ProfessionalReference[]): Record<ReferenceStatus, number> {
  const counts = REFERENCE_STATUSES.reduce((result, item) => ({ ...result, [item.value]: 0 }), {} as Record<ReferenceStatus, number>);
  references.forEach((reference) => { counts[reference.status] += 1; });
  return counts;
}

export function referenceRelationshipCounts(references: ProfessionalReference[]): Record<ReferenceRelationship, number> {
  const counts = REFERENCE_RELATIONSHIPS.reduce((result, item) => ({ ...result, [item.value]: 0 }), {} as Record<ReferenceRelationship, number>);
  references.forEach((reference) => { counts[reference.relationship] += 1; });
  return counts;
}
export function referenceContactMethodCounts(references: ProfessionalReference[]): Record<ProfessionalReference["preferredContact"], number> {
  const counts = { email: 0, phone: 0, linkedin: 0 };
  references.filter((reference) => reference.status !== "archived").forEach((reference) => { counts[reference.preferredContact] += 1; });
  return counts;
}

export function referenceStrengthCounts(references: ProfessionalReference[]): Record<string, number> {
  return references.flatMap((reference) => reference.strengths).reduce<Record<string, number>>((counts, strength) => { counts[strength] = (counts[strength] || 0) + 1; return counts; }, {});
}
export function referenceCompanyCounts(references: ProfessionalReference[]): Record<string, number> {
  return references.filter((reference) => reference.company && reference.status !== "archived").reduce<Record<string, number>>((counts, reference) => { counts[reference.company] = (counts[reference.company] || 0) + 1; return counts; }, {});
}

export function referenceAverageConfidence(references: ProfessionalReference[]): number {
  const active = references.filter((reference) => reference.status !== "archived");
  return active.length ? Math.round(active.reduce((sum, reference) => sum + reference.confidence, 0) / active.length) : 0;
}
export function confirmedReferenceCount(references: ProfessionalReference[]): number {
  return references.filter((reference) => reference.status === "confirmed").length;
}
export function pendingReferencePermissionCount(references: ProfessionalReference[]): number {
  return references.filter((reference) => reference.status === "permission_requested").length;
}
export function recentlyUsedReferenceCount(references: ProfessionalReference[]): number {
  return references.filter((reference) => reference.status === "used").length;
}
export function referenceThankYouDueCount(references: ProfessionalReference[]): number {
  return references.filter((reference) => reference.status === "used" && !reference.thankYouSent).length;
}
export function referencesNeedingThanks(references: ProfessionalReference[]): ProfessionalReference[] {
  return sortProfessionalReferences(references.filter((reference) => reference.status === "used" && !reference.thankYouSent));
}
export function nextReferenceAction(references: ProfessionalReference[]): { name: string; action: string; date: string } | null {
  return references.filter((reference) => reference.status !== "archived" && reference.nextActionDate)
    .map((reference) => ({ name: reference.name, action: reference.nextAction || "Contact reference", date: reference.nextActionDate }))
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
}
export function strongestProfessionalReference(references: ProfessionalReference[]): ProfessionalReference | null {
  return [...references].filter((reference) => reference.status !== "archived").sort((a, b) => b.confidence - a.confidence || Number(b.status === "confirmed") - Number(a.status === "confirmed"))[0] || null;
}
export function referenceProfileCompletion(reference: ProfessionalReference): number {
  const checks = [reference.title, reference.company, reference.email || reference.phone || reference.linkedInUrl, reference.workedTogether, reference.supportingStories, reference.strengths.length, reference.nextAction];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
export function contactableReferenceCount(references: ProfessionalReference[]): number {
  return references.filter((reference) => reference.status !== "archived" && Boolean(reference.email || reference.phone || reference.linkedInUrl)).length;
}
export function referenceStrengthCoverage(references: ProfessionalReference[]): number {
  return new Set(references.filter((reference) => reference.status !== "archived").flatMap((reference) => reference.strengths)).size;
}

export function referencePlanText(references: ProfessionalReference[]): string {
  return sortProfessionalReferences(references).map((reference) => [
    `${reference.name} (${reference.relationship}, ${reference.status}, confidence ${reference.confidence}/10)`,
    [reference.title, reference.company].filter(Boolean).join(" at "),
    reference.nextAction ? `Next: ${reference.nextAction}${reference.nextActionDate ? ` by ${reference.nextActionDate}` : ""}` : "",
    reference.strengths.length ? `Can speak to: ${reference.strengths.join(", ")}` : "",
  ].filter(Boolean).join("\n")).join("\n\n");
}
export function referenceRequestText(reference: ProfessionalReference): string {
  const context = reference.workedTogether ? " from our work together on " + reference.workedTogether : "";
  return "Hi " + reference.name + ", I am preparing for upcoming opportunities and would be grateful if you would serve as a professional reference" + context + ". I can share role details and a short brief to make the process easy.";
}
export function referenceBriefText(reference: ProfessionalReference): string {
  return [reference.name, [reference.title, reference.company].filter(Boolean).join(" at "), reference.workedTogether, reference.strengths.join(", "), reference.supportingStories].filter(Boolean).join("\n");
}
export function referenceReadinessScore(reference: ProfessionalReference): number {
  const statusScore = reference.status === "confirmed" ? 30 : reference.status === "permission_requested" ? 15 : 0;
  return Math.min(100, statusScore + reference.confidence * 4 + Math.round(referenceProfileCompletion(reference) * 0.3));
}
