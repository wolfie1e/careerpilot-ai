"use client";

import { useState, type ChangeEvent } from "react";
import { Download, Handshake, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import {
  MENTORSHIP_RELATIONSHIPS,
  MENTORSHIP_STATUSES,
  createMentorshipContact,
  isMentorshipFollowUpDue,
  mentorshipPlanText,
  mentorshipRelationshipCounts,
  mentorshipTopicCounts,
  mergeMentorshipContacts,
  sortMentorshipContacts,
  type MentorshipContact,
  type MentorshipRelationship,
  type MentorshipStatus,
} from "@/lib/mentorship";

export default function MentorshipPage() {
  const [contacts, setContacts] = useLocalStorage<MentorshipContact[]>(LOCAL_STORAGE_KEYS.mentorshipContacts, []);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState<MentorshipRelationship | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MentorshipStatus | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const visibleContacts = sortMentorshipContacts(contacts).filter((contact) => {
    if (!showArchived && contact.status === "archived") return false;
    if (relationshipFilter !== "all" && contact.relationship !== relationshipFilter) return false;
    if (statusFilter !== "all" && contact.status !== statusFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${contact.name} ${contact.role} ${contact.company} ${contact.email} ${contact.goals} ${contact.notes} ${contact.topics.join(" ")}`.toLowerCase().includes(query);
  });
  const activeContacts = contacts.filter((contact) => contact.status === "active");
  const relationshipRows = Object.entries(mentorshipRelationshipCounts(visibleContacts)).map(([relationship, count]) => ({ relationship, count }));
  const topicRows = Object.entries(mentorshipTopicCounts(visibleContacts)).map(([topic, count]) => ({ topic, count }));

  function addContact() {
    if (!name.trim()) return;
    setContacts((current) => [createMentorshipContact(name), ...current]);
    setName("");
    toast.success("Mentorship contact added");
  }

  async function importContacts(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { contacts?: MentorshipContact[] } | MentorshipContact[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.contacts || [];
      setContacts((current) => mergeMentorshipContacts(current, incoming));
      toast.success(`${incoming.length} mentorship contacts imported`);
    } catch {
      toast.error("Could not import mentorship contacts");
    }
  }

  function updateVisibleStatus(status: MentorshipStatus) {
    const visibleIds = new Set(visibleContacts.map((contact) => contact.id));
    setContacts((current) => current.map((contact) => visibleIds.has(contact.id) ? { ...contact, status, updatedAt: new Date().toISOString() } : contact));
    toast.success(`Visible contacts marked ${status}`);
  }

  function clearArchivedContacts() {
    setContacts((current) => current.filter((contact) => contact.status !== "archived"));
    toast.success("Archived mentorship contacts cleared");
  }

  function updateContact(id: string, patch: Partial<MentorshipContact>) {
    setContacts((current) => current.map((contact) => contact.id === id ? { ...contact, ...patch, updatedAt: new Date().toISOString() } : contact));
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Mentorship</h2>
        <p className="mt-1 text-sm text-gray-400">Track mentors, advisors, peers, and recurring career conversations.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Active", activeContacts.length],
          ["Follow-ups", contacts.filter((contact) => isMentorshipFollowUpDue(contact)).length],
          ["Conversations", contacts.reduce((sum, contact) => sum + contact.conversationCount, 0)],
          ["Favorites", contacts.filter((contact) => contact.favorite && contact.status !== "archived").length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input value={name} maxLength={140} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addContact(); }} placeholder="Add a mentor, advisor, peer, or coach" className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addContact} disabled={!name.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => updateVisibleStatus("active")} disabled={!visibleContacts.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Activate visible</button>
        <button onClick={() => updateVisibleStatus("dormant")} disabled={!visibleContacts.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Dormant visible</button>
        <button onClick={() => updateVisibleStatus("archived")} disabled={!visibleContacts.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Archive visible</button>
        <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Archived</button>
        <button onClick={clearArchivedContacts} disabled={!contacts.some((contact) => contact.status === "archived")} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Clear archived</button>
        <select aria-label="Filter mentorship contacts by relationship" value={relationshipFilter} onChange={(event) => setRelationshipFilter(event.target.value as MentorshipRelationship | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300">
          <option value="all">All relationships</option>
          {MENTORSHIP_RELATIONSHIPS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select aria-label="Filter mentorship contacts by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as MentorshipStatus | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300">
          <option value="all">All statuses</option>
          {MENTORSHIP_STATUSES.filter((option) => option.value !== "archived").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search mentorship contacts" className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Upload className="h-4 w-4" />
          Import
          <input type="file" accept=".json,application/json" onChange={importContacts} className="sr-only" />
        </label>
        <CopyButton value={mentorshipPlanText(visibleContacts) || "No mentorship contacts yet"} label="Copy plan" className="rounded-xl px-3" />
        <button onClick={() => downloadJson("careerpilot-mentorship-contacts.json", { contacts })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Download className="h-4 w-4" />
          JSON
        </button>
        <button onClick={() => downloadCsv("careerpilot-mentorship-contacts.csv", visibleContacts.map((contact) => ({
          name: contact.name,
          role: contact.role,
          company: contact.company,
          relationship: contact.relationship,
          status: contact.status,
          last_contact_at: contact.lastContactAt,
          next_contact_at: contact.nextContactAt,
          conversations: contact.conversationCount,
          topics: contact.topics.join(", "),
        })))} disabled={!visibleContacts.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          CSV
        </button>
        <button onClick={() => downloadCsv("careerpilot-mentorship-relationships.csv", relationshipRows)} disabled={!relationshipRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Relationships
        </button>
        <button onClick={() => downloadCsv("careerpilot-mentorship-topics.csv", topicRows)} disabled={!topicRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Topics
        </button>
      </div>

      {visibleContacts.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center">
          <Handshake className="mx-auto mb-3 h-9 w-9 text-gray-600" />
          <p className="text-sm text-gray-400">Add your first mentorship contact to build a stronger support network.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleContacts.map((contact) => (
            <article key={contact.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_170px_150px]">
                <input value={contact.name} maxLength={140} onChange={(event) => updateContact(contact.id, { name: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                <input value={contact.role} maxLength={120} onChange={(event) => updateContact(contact.id, { role: event.target.value })} placeholder="Role" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={contact.company} maxLength={120} onChange={(event) => updateContact(contact.id, { company: event.target.value })} placeholder="Company" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <select value={contact.relationship} onChange={(event) => updateContact(contact.id, { relationship: event.target.value as MentorshipRelationship })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{MENTORSHIP_RELATIONSHIPS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                <select value={contact.status} onChange={(event) => updateContact(contact.id, { status: event.target.value as MentorshipStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{MENTORSHIP_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <input type="email" value={contact.email} maxLength={255} onChange={(event) => updateContact(contact.id, { email: event.target.value })} placeholder="Email" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={contact.linkedInUrl} maxLength={2048} onChange={(event) => updateContact(contact.id, { linkedInUrl: event.target.value })} placeholder="LinkedIn URL" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <input type="date" value={contact.lastContactAt} onChange={(event) => updateContact(contact.id, { lastContactAt: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="date" value={contact.nextContactAt} onChange={(event) => updateContact(contact.id, { nextContactAt: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" min={1} value={contact.cadenceDays} onChange={(event) => updateContact(contact.id, { cadenceDays: Number(event.target.value) })} placeholder="Cadence days" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" min={0} value={contact.conversationCount} onChange={(event) => updateContact(contact.id, { conversationCount: Number(event.target.value) })} placeholder="Conversations" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
