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
