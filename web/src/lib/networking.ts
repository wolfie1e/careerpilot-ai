export type ContactStrength = "new" | "warm" | "strong";

export interface NetworkingContact {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  linkedin: string;
  location: string;
  strength: ContactStrength;
  source: string;
  notes: string;
  tags: string[];
  lastContactedAt: string;
  nextFollowUpAt: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

export function createNetworkingContact(name: string): NetworkingContact {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    role: "",
    company: "",
    email: "",
    linkedin: "",
    location: "",
    strength: "new",
    source: "",
    notes: "",
    tags: [],
    lastContactedAt: "",
    nextFollowUpAt: "",
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
}

export function isNetworkingFollowUpDue(contact: NetworkingContact, today = new Date()): boolean {
  if (!contact.nextFollowUpAt || contact.archived) return false;
  return contact.nextFollowUpAt <= today.toISOString().slice(0, 10);
}

export function networkingStrengthWeight(strength: ContactStrength): number {
  return strength === "strong" ? 3 : strength === "warm" ? 2 : 1;
}

export function sortNetworkingContacts(contacts: NetworkingContact[]): NetworkingContact[] {
  return [...contacts].sort((a, b) => {
    const dueA = isNetworkingFollowUpDue(a);
    const dueB = isNetworkingFollowUpDue(b);
    if (dueA !== dueB) return dueA ? -1 : 1;
    const strength = networkingStrengthWeight(b.strength) - networkingStrengthWeight(a.strength);
    if (strength) return strength;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function networkingFollowUpCount(contacts: NetworkingContact[]): number {
  return contacts.filter((contact) => isNetworkingFollowUpDue(contact)).length;
}

export function networkingActiveCount(contacts: NetworkingContact[]): number {
  return contacts.filter((contact) => !contact.archived).length;
}

export function networkingContactSummary(contact: NetworkingContact): string {
  const details = [contact.role, contact.company, contact.strength].filter(Boolean);
  return `${contact.name}${details.length ? ` (${details.join(", ")})` : ""}${contact.nextFollowUpAt ? `\nFollow up: ${contact.nextFollowUpAt}` : ""}`;
}

export function networkingPipelineText(contacts: NetworkingContact[]): string {
  return sortNetworkingContacts(contacts).map(networkingContactSummary).join("\n\n");
}

export function networkingTagCounts(contacts: NetworkingContact[]): Record<string, number> {
  return contacts.flatMap((contact) => contact.tags || []).reduce<Record<string, number>>((counts, tag) => {
    counts[tag] = (counts[tag] || 0) + 1;
    return counts;
  }, {});
}

export function normalizeNetworkingContact(contact: Partial<NetworkingContact>): NetworkingContact {
  const base = createNetworkingContact(contact.name || "Unnamed contact");
  return { ...base, ...contact, tags: contact.tags || [] };
}

export function mergeNetworkingContacts(current: NetworkingContact[], incoming: NetworkingContact[]): NetworkingContact[] {
  const byId = new Map(current.map((contact) => [contact.id, contact]));
  incoming.map(normalizeNetworkingContact).forEach((contact) => byId.set(contact.id, contact));
  return sortNetworkingContacts([...byId.values()]);
}

export function scheduleNetworkingFollowUp(contact: NetworkingContact, days = 14): NetworkingContact {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return { ...contact, nextFollowUpAt: date.toISOString().slice(0, 10), updatedAt: new Date().toISOString() };
}

export function markNetworkingContacted(contact: NetworkingContact): NetworkingContact {
  const today = new Date().toISOString().slice(0, 10);
  return { ...contact, lastContactedAt: today, updatedAt: new Date().toISOString() };
}

export function networkingStrengthCounts(contacts: NetworkingContact[]): Record<ContactStrength, number> {
  const counts: Record<ContactStrength, number> = { new: 0, warm: 0, strong: 0 };
  contacts.filter((contact) => !contact.archived).forEach((contact) => { counts[contact.strength] += 1; });
  return counts;
}

export function networkingCompanyCounts(contacts: NetworkingContact[]): Record<string, number> {
  return contacts.filter((contact) => contact.company && !contact.archived).reduce<Record<string, number>>((counts, contact) => {
    counts[contact.company] = (counts[contact.company] || 0) + 1;
    return counts;
  }, {});
}

export function networkingLocationCounts(contacts: NetworkingContact[]): Record<string, number> {
  return contacts.filter((contact) => contact.location && !contact.archived).reduce<Record<string, number>>((counts, contact) => {
    counts[contact.location] = (counts[contact.location] || 0) + 1;
    return counts;
  }, {});
}

export function networkingContactableCount(contacts: NetworkingContact[]): number {
  return contacts.filter((contact) => !contact.archived && Boolean(contact.email || contact.linkedin)).length;
}

export function networkingStaleCount(contacts: NetworkingContact[], days = 30, today = new Date()): number {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);
  return contacts.filter((contact) => !contact.archived && (!contact.lastContactedAt || new Date(contact.lastContactedAt) < cutoff)).length;
}

export function networkingRecentlyContactedCount(contacts: NetworkingContact[], days = 14, today = new Date()): number {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - days);
  return contacts.filter((contact) => !contact.archived && contact.lastContactedAt && new Date(contact.lastContactedAt) >= cutoff).length;
}

export function networkingEmailCount(contacts: NetworkingContact[]): number {
  return contacts.filter((contact) => !contact.archived && Boolean(contact.email)).length;
}

export function networkingLinkedInCount(contacts: NetworkingContact[]): number {
  return contacts.filter((contact) => !contact.archived && Boolean(contact.linkedin)).length;
}

export function isNetworkingFollowUpSoon(contact: NetworkingContact, today = new Date()): boolean {
  if (!contact.nextFollowUpAt || contact.archived) return false;
  const followUp = new Date(`${contact.nextFollowUpAt}T00:00:00`);
  const days = Math.ceil((followUp.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 && days <= 7;
}
