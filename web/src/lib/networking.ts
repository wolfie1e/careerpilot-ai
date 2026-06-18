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
