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
