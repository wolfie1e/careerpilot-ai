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

export function mentorshipTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function suggestedMentorshipNextContact(contact: MentorshipContact): string {
  if (!contact.lastContactAt || contact.cadenceDays <= 0) return contact.nextContactAt;
  const date = new Date(`${contact.lastContactAt}T00:00:00`);
  date.setDate(date.getDate() + contact.cadenceDays);
  return date.toISOString().slice(0, 10);
}

export function isMentorshipFollowUpDue(contact: MentorshipContact, dateKey = mentorshipTodayKey()): boolean {
  const nextContact = contact.nextContactAt || suggestedMentorshipNextContact(contact);
  return Boolean(nextContact && nextContact <= dateKey && contact.status !== "archived");
}

export function isMentorshipFollowUpSoon(contact: MentorshipContact, today = new Date()): boolean {
  const nextContact = contact.nextContactAt || suggestedMentorshipNextContact(contact);
  if (!nextContact || contact.status === "archived") return false;
  const due = new Date(`${nextContact}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= 7;
}

const MENTORSHIP_STATUS_WEIGHT: Record<MentorshipStatus, number> = {
  active: 0,
  dormant: 1,
  archived: 2,
};

export function sortMentorshipContacts(contacts: MentorshipContact[]): MentorshipContact[] {
  return [...contacts].sort((a, b) => {
    if (a.status === "archived" && b.status !== "archived") return 1;
    if (b.status === "archived" && a.status !== "archived") return -1;
    if (Boolean(a.favorite) !== Boolean(b.favorite)) return a.favorite ? -1 : 1;
    if (isMentorshipFollowUpDue(a) !== isMentorshipFollowUpDue(b)) return isMentorshipFollowUpDue(a) ? -1 : 1;
    const statusDifference = MENTORSHIP_STATUS_WEIGHT[a.status] - MENTORSHIP_STATUS_WEIGHT[b.status];
    if (statusDifference) return statusDifference;
    const nextA = a.nextContactAt || suggestedMentorshipNextContact(a);
    const nextB = b.nextContactAt || suggestedMentorshipNextContact(b);
    if (nextA && nextB) return nextA.localeCompare(nextB);
    if (nextA) return -1;
    if (nextB) return 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}
