export type OfferStatus = "draft" | "negotiating" | "accepted" | "declined" | "archived";

export interface OfferComparison {
  id: string;
  company: string;
  role: string;
  status: OfferStatus;
  location: string;
  workMode: "remote" | "hybrid" | "onsite" | "";
  baseSalary: number;
  bonus: number;
  equity: number;
  benefitsValue: number;
  signingBonus: number;
  currency: string;
  startDate: string;
  decisionDeadline: string;
  commuteMinutes: number;
  growthScore: number;
  cultureScore: number;
  learningScore: number;
  stabilityScore: number;
  notes: string;
  negotiationNotes: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export const OFFER_STATUSES: Array<{ value: OfferStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "negotiating", label: "Negotiating" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "archived", label: "Archived" },
];

export function createOfferComparison(company: string, role = ""): OfferComparison {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    company: company.trim(),
    role: role.trim(),
    status: "draft",
    location: "",
    workMode: "",
    baseSalary: 0,
    bonus: 0,
    equity: 0,
    benefitsValue: 0,
    signingBonus: 0,
    currency: "USD",
    startDate: "",
    decisionDeadline: "",
    commuteMinutes: 0,
    growthScore: 5,
    cultureScore: 5,
    learningScore: 5,
    stabilityScore: 5,
    notes: "",
    negotiationNotes: "",
    createdAt: now,
    updatedAt: now,
    tags: [],
  };
}

export function offerTotalCompensation(offer: OfferComparison): number {
  return (offer.baseSalary || 0) + (offer.bonus || 0) + (offer.equity || 0) + (offer.benefitsValue || 0) + (offer.signingBonus || 0);
}

export function offerQualityScore(offer: OfferComparison): number {
  const score = [offer.growthScore, offer.cultureScore, offer.learningScore, offer.stabilityScore]
    .reduce((total, value) => total + Math.min(10, Math.max(0, value || 0)), 0);
  return Math.round((score / 40) * 100);
}

export function offerDecisionScore(offer: OfferComparison): number {
  const compensationScore = Math.min(100, Math.round(offerTotalCompensation(offer) / 2_500));
  const commutePenalty = Math.min(20, Math.round((offer.commuteMinutes || 0) / 6));
  return Math.max(0, Math.round((compensationScore * 0.45) + (offerQualityScore(offer) * 0.55) - commutePenalty));
}

export function isOfferDeadlineSoon(offer: OfferComparison, today = new Date()): boolean {
  if (!offer.decisionDeadline || ["accepted", "declined", "archived"].includes(offer.status)) return false;
  const deadline = new Date(`${offer.decisionDeadline}T00:00:00`);
  const days = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= 7;
}

export function isOfferDeadlineOverdue(offer: OfferComparison, today = new Date()): boolean {
  if (!offer.decisionDeadline || ["accepted", "declined", "archived"].includes(offer.status)) return false;
  return offer.decisionDeadline < today.toISOString().slice(0, 10);
}

export function activeOfferCount(offers: OfferComparison[]): number {
  return offers.filter((offer) => !["accepted", "declined", "archived"].includes(offer.status)).length;
}

export function negotiatingOfferCount(offers: OfferComparison[]): number {
  return offers.filter((offer) => offer.status === "negotiating").length;
}

export function bestOffer(offers: OfferComparison[]): OfferComparison | null {
  return offers
    .filter((offer) => offer.status !== "archived")
    .sort((a, b) => offerDecisionScore(b) - offerDecisionScore(a))[0] || null;
}

export function sortOffers(offers: OfferComparison[]): OfferComparison[] {
  return [...offers].sort((a, b) => {
    if (a.status === "archived" && b.status !== "archived") return 1;
    if (b.status === "archived" && a.status !== "archived") return -1;
    const aOverdue = isOfferDeadlineOverdue(a);
    const bOverdue = isOfferDeadlineOverdue(b);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    return offerDecisionScore(b) - offerDecisionScore(a) || b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function offerSummary(offer: OfferComparison): string {
  const details = [offer.status, `${offer.currency} ${offerTotalCompensation(offer).toLocaleString()}`, `score ${offerDecisionScore(offer)}`];
  if (offer.decisionDeadline) details.push(`deadline ${offer.decisionDeadline}`);
  return `${offer.company} — ${offer.role || "Offer"} (${details.join(", ")})`;
}

export function offerPipelineText(offers: OfferComparison[]): string {
  return sortOffers(offers).map(offerSummary).join("\n");
}

export function normalizeOfferComparison(offer: Partial<OfferComparison>): OfferComparison {
  const base = createOfferComparison(offer.company || "Unknown company", offer.role || "");
  return {
    ...base,
    ...offer,
    baseSalary: Number(offer.baseSalary ?? base.baseSalary),
    bonus: Number(offer.bonus ?? base.bonus),
    equity: Number(offer.equity ?? base.equity),
    benefitsValue: Number(offer.benefitsValue ?? base.benefitsValue),
    signingBonus: Number(offer.signingBonus ?? base.signingBonus),
    tags: offer.tags || [],
  };
}

export function mergeOfferComparisons(current: OfferComparison[], incoming: OfferComparison[]): OfferComparison[] {
  const byId = new Map(current.map((offer) => [offer.id, offer]));
  incoming.map(normalizeOfferComparison).forEach((offer) => byId.set(offer.id, offer));
  return sortOffers([...byId.values()]);
}

export function offerStatusCounts(offers: OfferComparison[]): Record<OfferStatus, number> {
  const counts = OFFER_STATUSES.reduce((result, status) => ({ ...result, [status.value]: 0 }), {} as Record<OfferStatus, number>);
  offers.forEach((offer) => { counts[offer.status] += 1; });
  return counts;
}

export function offerTagCounts(offers: OfferComparison[]): Record<string, number> {
  return offers.flatMap((offer) => offer.tags || []).reduce<Record<string, number>>((counts, tag) => {
    counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});
}
