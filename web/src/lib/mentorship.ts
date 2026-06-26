export type MentorshipRelationship = "mentor" | "peer" | "advisor" | "coach" | "alumni" | "recruiter" | "other";

export type MentorshipStatus = "active" | "dormant" | "archived";

export interface MentorshipContact {
  id: string;
  name: string;
  role: string;
  company: string;
  relationship: MentorshipRelationship;
  status: MentorshipStatus;
  email: string;
  linkedInUrl: string;
  lastContactAt: string;
  nextContactAt: string;
  cadenceDays: number;
  conversationCount: number;
  confidence: number;
  goals: string;
  notes: string;
  topics: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MENTORSHIP_RELATIONSHIPS: Array<{ value: MentorshipRelationship; label: string }> = [
  { value: "mentor", label: "Mentor" },
  { value: "peer", label: "Peer" },
  { value: "advisor", label: "Advisor" },
  { value: "coach", label: "Coach" },
  { value: "alumni", label: "Alumni" },
  { value: "recruiter", label: "Recruiter" },
  { value: "other", label: "Other" },
];

export const MENTORSHIP_STATUSES: Array<{ value: MentorshipStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "dormant", label: "Dormant" },
  { value: "archived", label: "Archived" },
];

export function createMentorshipContact(name: string): MentorshipContact {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    role: "",
    company: "",
    relationship: "mentor",
    status: "active",
    email: "",
    linkedInUrl: "",
    lastContactAt: "",
    nextContactAt: "",
    cadenceDays: 30,
    conversationCount: 0,
    confidence: 5,
    goals: "",
    notes: "",
    topics: [],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  };
}
