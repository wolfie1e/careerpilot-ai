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

export function mentorshipContactSummary(contact: MentorshipContact): string {
  const details = [contact.relationship, contact.status, contact.role, contact.company].filter(Boolean);
  const nextContact = contact.nextContactAt || suggestedMentorshipNextContact(contact);
  if (nextContact) details.push(`next ${nextContact}`);
  return `${contact.name}${details.length ? ` (${details.join(", ")})` : ""}`;
}

export function mentorshipPlanText(contacts: MentorshipContact[]): string {
  return sortMentorshipContacts(contacts)
    .map((contact) => {
      const lines = [
        mentorshipContactSummary(contact),
        contact.email ? `Email: ${contact.email}` : "",
        contact.linkedInUrl ? `LinkedIn: ${contact.linkedInUrl}` : "",
        contact.goals ? `Goals: ${contact.goals}` : "",
        contact.notes ? `Notes: ${contact.notes}` : "",
        contact.topics.length ? `Topics: ${contact.topics.join(", ")}` : "",
      ];
      return lines.filter(Boolean).join("\n");
    })
    .join("\n\n");
}

export function mentorshipRelationshipCounts(contacts: MentorshipContact[]): Record<MentorshipRelationship, number> {
  const counts = MENTORSHIP_RELATIONSHIPS.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {} as Record<MentorshipRelationship, number>);
  contacts.forEach((contact) => {
    counts[contact.relationship || "other"] += 1;
  });
  return counts;
}

export function mentorshipStatusCounts(contacts: MentorshipContact[]): Record<MentorshipStatus, number> {
  const counts = MENTORSHIP_STATUSES.reduce((acc, option) => ({ ...acc, [option.value]: 0 }), {} as Record<MentorshipStatus, number>);
  contacts.forEach((contact) => {
    counts[contact.status || "active"] += 1;
  });
  return counts;
}

export function mentorshipTopicCounts(contacts: MentorshipContact[]): Record<string, number> {
  return contacts.flatMap((contact) => contact.topics || []).reduce<Record<string, number>>((counts, topic) => {
    counts[topic] = (counts[topic] || 0) + 1;
    return counts;
  }, {});
}

export function normalizeMentorshipContact(contact: Partial<MentorshipContact>): MentorshipContact {
  const base = createMentorshipContact(contact.name || "Untitled contact");
  return {
    ...base,
    ...contact,
    cadenceDays: Math.max(1, Number(contact.cadenceDays ?? base.cadenceDays)),
    conversationCount: Math.max(0, Number(contact.conversationCount ?? base.conversationCount)),
    confidence: Math.min(10, Math.max(1, Number(contact.confidence ?? base.confidence))),
    topics: contact.topics || [],
  };
}

export function mergeMentorshipContacts(current: MentorshipContact[], incoming: MentorshipContact[]): MentorshipContact[] {
  const byId = new Map(current.map((contact) => [contact.id, contact]));
  incoming.map(normalizeMentorshipContact).forEach((contact) => byId.set(contact.id, contact));
  return sortMentorshipContacts([...byId.values()]);
}

export function mentorshipConversationTotal(contacts: MentorshipContact[]): number {
  return contacts.reduce((total, contact) => total + Math.max(0, contact.conversationCount || 0), 0);
}

export function nextMentorshipContact(contacts: MentorshipContact[]): { name: string; date: string } | null {
  const upcoming = contacts
    .filter((contact) => contact.status !== "archived")
    .map((contact) => ({ name: contact.name, date: contact.nextContactAt || suggestedMentorshipNextContact(contact) }))
    .filter((item) => item.date && item.date >= mentorshipTodayKey())
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] || null;
}

export function mentorshipFollowUpDueCount(contacts: MentorshipContact[]): number {
  return contacts.filter((contact) => isMentorshipFollowUpDue(contact)).length;
}

export function mentorshipAverageConfidence(contacts: MentorshipContact[]): number {
  const activeContacts = contacts.filter((contact) => contact.status !== "archived");
  if (!activeContacts.length) return 0;
  return Math.round(activeContacts.reduce((total, contact) => total + contact.confidence, 0) / activeContacts.length);
}

export function activeMentorshipCount(contacts: MentorshipContact[]): number {
  return contacts.filter((contact) => contact.status === "active").length;
}

export function dormantMentorshipCount(contacts: MentorshipContact[]): number {
  return contacts.filter((contact) => contact.status === "dormant").length;
}

export function favoriteMentorshipCount(contacts: MentorshipContact[]): number {
  return contacts.filter((contact) => contact.favorite && contact.status !== "archived").length;
}

export function mentorshipCompanyCounts(contacts: MentorshipContact[]): Record<string, number> {
  return contacts.filter((contact) => contact.company && contact.status !== "archived").reduce<Record<string, number>>((counts, contact) => {
    counts[contact.company] = (counts[contact.company] || 0) + 1;
    return counts;
  }, {});
}
