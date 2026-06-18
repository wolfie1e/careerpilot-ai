"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Archive, Download, ExternalLink, Mail, Plus, Search, Trash2, Upload, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import type { PlannerTask } from "@/lib/career-planner";
import {
  createNetworkingContact,
  isNetworkingFollowUpDue,
  markNetworkingContacted,
  mergeNetworkingContacts,
  networkingActiveCount,
  networkingFollowUpCount,
  networkingPipelineText,
  networkingTagCounts,
  scheduleNetworkingFollowUp,
  sortNetworkingContacts,
  type ContactStrength,
  type NetworkingContact,
} from "@/lib/networking";
import { cn } from "@/lib/utils";

const STRENGTH_OPTIONS: Array<{ value: ContactStrength; label: string }> = [
  { value: "new", label: "New" },
  { value: "warm", label: "Warm" },
  { value: "strong", label: "Strong" },
];

export default function NetworkingPage() {
  const [contacts, setContacts] = useLocalStorage<NetworkingContact[]>(LOCAL_STORAGE_KEYS.networkingContacts, []);
  const [plannerTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [strengthFilter, setStrengthFilter] = useState<ContactStrength | "all">("all");
  const [tagFilter, setTagFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const availableTags = [...new Set(contacts.flatMap((contact) => contact.tags || []))].sort();
  const availableSources = [...new Set(contacts.map((contact) => contact.source).filter(Boolean))].sort();
  const availableCompanies = [...new Set(contacts.map((contact) => contact.company).filter(Boolean))].sort();
  const followUpContacts = contacts.filter((contact) => contact.nextFollowUpAt && !contact.archived);
  const dueFollowUpContacts = contacts.filter(isNetworkingFollowUpDue);
  const followUpText = followUpContacts.map((contact) => `${contact.nextFollowUpAt}: ${contact.name}${contact.company ? ` at ${contact.company}` : ""}`).join("\n");
  const visibleContacts = useMemo(() => sortNetworkingContacts(contacts).filter((contact) => {
    if (!showArchived && contact.archived) return false;
    if (strengthFilter !== "all" && contact.strength !== strengthFilter) return false;
    if (tagFilter && !(contact.tags || []).includes(tagFilter)) return false;
    if (sourceFilter && contact.source !== sourceFilter) return false;
    if (companyFilter && contact.company !== companyFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${contact.name} ${contact.role} ${contact.company} ${contact.notes} ${contact.tags?.join(" ")}`.toLowerCase().includes(query);
  }), [companyFilter, contacts, search, showArchived, sourceFilter, strengthFilter, tagFilter]);
  const emailContacts = visibleContacts.filter((contact) => contact.email);
  const strongContacts = contacts.filter((contact) => contact.strength === "strong" && !contact.archived);
  const tagRows = Object.entries(networkingTagCounts(visibleContacts)).map(([tag, count]) => ({ tag, count }));
  const emailListText = emailContacts.map((contact) => `${contact.name} <${contact.email}>`).join(", ");

  function addContact() {
    if (!name.trim()) return;
    setContacts((current) => [createNetworkingContact(name), ...current]);
    setName("");
    toast.success("Contact added");
  }

  function updateContact(id: string, patch: Partial<NetworkingContact>) {
    setContacts((current) => current.map((contact) => contact.id === id ? { ...contact, ...patch, updatedAt: new Date().toISOString() } : contact));
  }

  function removeContact(id: string) {
    setContacts((current) => current.filter((contact) => contact.id !== id));
  }

  function markContacted(id: string) {
    setContacts((current) => current.map((contact) => contact.id === id ? markNetworkingContacted(scheduleNetworkingFollowUp(contact)) : contact));
    toast.success("Contact marked and follow-up scheduled");
  }

  function duplicateContact(contact: NetworkingContact) {
    setContacts((current) => [{ ...contact, id: crypto.randomUUID(), name: `${contact.name} copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current]);
    toast.success("Contact duplicated");
  }

  function addFollowUpTask(contact: NetworkingContact) {
    const task: PlannerTask = {
      id: crypto.randomUUID(),
      title: `Follow up with ${contact.name}`,
      notes: [contact.role, contact.company, contact.email].filter(Boolean).join(" · "),
      priority: "medium",
      category: "networking",
      estimateMinutes: 20,
      resourceUrl: contact.linkedin || "",
      status: "todo",
      dueDate: contact.nextFollowUpAt || "",
      createdAt: new Date().toISOString(),
      completedAt: null,
      archived: false,
      tags: ["networking"],
      recurrence: "none",
    };
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.plannerTasks, JSON.stringify([task, ...plannerTasks]));
    toast.success("Follow-up added to planner");
  }

  async function importContacts(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { contacts?: NetworkingContact[] } | NetworkingContact[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.contacts || [];
      setContacts((current) => mergeNetworkingContacts(current, incoming));
      toast.success(`${incoming.length} contacts imported`);
    } catch {
      toast.error("Could not import contacts");
    }
  }

  function archiveVisibleContacts() {
    const visibleIds = new Set(visibleContacts.map((contact) => contact.id));
    setContacts((current) => current.map((contact) => visibleIds.has(contact.id) ? { ...contact, archived: true } : contact));
    toast.success("Visible contacts archived");
  }

  function clearArchivedContacts() {
    setContacts((current) => current.filter((contact) => !contact.archived));
    toast.success("Archived contacts cleared");
  }

  function scheduleVisibleFollowUps() {
    const visibleIds = new Set(visibleContacts.map((contact) => contact.id));
    setContacts((current) => current.map((contact) => visibleIds.has(contact.id) ? scheduleNetworkingFollowUp(contact) : contact));
    toast.success("Visible follow-ups scheduled");
  }

  function warmVisibleContacts() {
    const visibleIds = new Set(visibleContacts.map((contact) => contact.id));
    setContacts((current) => current.map((contact) => visibleIds.has(contact.id) ? { ...contact, strength: "warm" } : contact));
    toast.success("Visible contacts marked warm");
  }

  function markVisibleContacted() {
    const visibleIds = new Set(visibleContacts.map((contact) => contact.id));
    setContacts((current) => current.map((contact) => visibleIds.has(contact.id) ? markNetworkingContacted(scheduleNetworkingFollowUp(contact)) : contact));
    toast.success("Visible contacts marked contacted");
  }

  function strengthenVisibleContacts() {
    const visibleIds = new Set(visibleContacts.map((contact) => contact.id));
    setContacts((current) => current.map((contact) => visibleIds.has(contact.id) ? { ...contact, strength: "strong", updatedAt: new Date().toISOString() } : contact));
    toast.success("Visible contacts marked strong");
  }

  function clearDueFollowUps() {
    const dueIds = new Set(dueFollowUpContacts.map((contact) => contact.id));
    setContacts((current) => current.map((contact) => dueIds.has(contact.id) ? { ...contact, nextFollowUpAt: "", updatedAt: new Date().toISOString() } : contact));
    toast.success("Due follow-ups cleared");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Networking</h2>
        <p className="mt-1 text-sm text-gray-400">Track relationships, follow-ups, and warm introductions.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        {[
          ["Active contacts", networkingActiveCount(contacts)],
          ["Follow-ups due", networkingFollowUpCount(contacts)],
          ["Warm contacts", contacts.filter((contact) => contact.strength === "warm").length],
          ["Strong contacts", contacts.filter((contact) => contact.strength === "strong").length],
          ["Tagged", contacts.filter((contact) => contact.tags?.length).length],
          ["Sources", availableSources.length],
          ["Companies", availableCompanies.length],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-xl font-bold text-white">{value}</div></div>)}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addContact(); }} placeholder="Add a contact" className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addContact} disabled={!name.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Add contact</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setSearch(""); setStrengthFilter("all"); setTagFilter(""); setSourceFilter(""); setCompanyFilter(""); setShowArchived(false); }} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Clear filters</button>
        <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className={cn("rounded-xl border px-3 text-sm font-medium", showArchived ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-gray-700 text-gray-300")}>Archived</button>
        <button onClick={archiveVisibleContacts} disabled={!visibleContacts.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Archive visible</button>
        <button onClick={clearArchivedContacts} disabled={!contacts.some((contact) => contact.archived)} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Clear archived</button>
        <button onClick={scheduleVisibleFollowUps} disabled={!visibleContacts.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Schedule visible</button>
        <button onClick={warmVisibleContacts} disabled={!visibleContacts.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Warm visible</button>
        <button onClick={markVisibleContacted} disabled={!visibleContacts.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Contacted visible</button>
        <button onClick={strengthenVisibleContacts} disabled={!visibleContacts.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Strong visible</button>
        <button onClick={clearDueFollowUps} disabled={!dueFollowUpContacts.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Clear due</button>
        <select aria-label="Filter by relationship strength" value={strengthFilter} onChange={(event) => setStrengthFilter(event.target.value as ContactStrength | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="all">All strengths</option>{STRENGTH_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <select aria-label="Filter networking by tag" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="">All tags</option>{availableTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select>
        <select aria-label="Filter networking by source" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="">All sources</option>{availableSources.map((source) => <option key={source} value={source}>{source}</option>)}</select>
        <select aria-label="Filter networking by company" value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="">All companies</option>{availableCompanies.map((company) => <option key={company} value={company}>{company}</option>)}</select>
        <label className="relative min-w-64 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts" className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" /></label>
        <CopyButton value={networkingPipelineText(visibleContacts) || "No networking contacts yet"} label="Copy contacts" className="rounded-xl px-3" />
        <CopyButton value={followUpText || "No networking follow-ups scheduled"} label="Copy follow-ups" className="rounded-xl px-3" />
        <CopyButton value={emailListText || "No visible contacts have email addresses"} label="Copy emails" className="rounded-xl px-3" />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Upload className="h-4 w-4" />Import<input type="file" accept=".json,application/json" onChange={importContacts} className="sr-only" /></label>
        <button onClick={() => downloadJson("careerpilot-networking-contacts.json", { contacts })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Download className="h-4 w-4" />JSON</button>
        <button onClick={() => downloadCsv("careerpilot-networking-contacts.csv", visibleContacts.map((contact) => ({ name: contact.name, role: contact.role, company: contact.company, strength: contact.strength, email: contact.email, linkedin: contact.linkedin, next_follow_up: contact.nextFollowUpAt, tags: contact.tags.join(", "), notes: contact.notes })))} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Download className="h-4 w-4" />CSV</button>
        <button onClick={() => downloadCsv("careerpilot-networking-follow-ups.csv", followUpContacts.map((contact) => ({ name: contact.name, company: contact.company, next_follow_up: contact.nextFollowUpAt, email: contact.email, linkedin: contact.linkedin })))} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Download className="h-4 w-4" />Follow-ups</button>
        <button onClick={() => downloadCsv("careerpilot-networking-emails.csv", emailContacts.map((contact) => ({ name: contact.name, email: contact.email, company: contact.company, role: contact.role, strength: contact.strength })))} disabled={!emailContacts.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />Emails</button>
        <button onClick={() => downloadCsv("careerpilot-networking-strong-contacts.csv", strongContacts.map((contact) => ({ name: contact.name, company: contact.company, role: contact.role, email: contact.email, linkedin: contact.linkedin, tags: contact.tags.join(", ") })))} disabled={!strongContacts.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />Strong</button>
        <button onClick={() => downloadCsv("careerpilot-networking-tags.csv", tagRows)} disabled={!tagRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />Tags</button>
      </div>

      {visibleContacts.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center"><UsersRound className="mx-auto mb-3 h-9 w-9 text-gray-600" /><p className="text-sm text-gray-400">{contacts.length ? "No contacts match these filters." : "Add your first networking contact to start tracking follow-ups."}</p></div>
      ) : (
        <div className="space-y-3">
          {visibleContacts.map((contact) => (
            <article key={contact.id} className={cn("rounded-2xl border bg-gray-900 p-5", isNetworkingFollowUpDue(contact) ? "border-amber-500/50" : "border-gray-800")}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    <input value={contact.name} maxLength={120} onChange={(event) => updateContact(contact.id, { name: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                    <input value={contact.role} maxLength={120} onChange={(event) => updateContact(contact.id, { role: event.target.value })} placeholder="Role" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <input value={contact.company} maxLength={120} onChange={(event) => updateContact(contact.id, { company: event.target.value })} placeholder="Company" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <select aria-label={`Strength for ${contact.name}`} value={contact.strength} onChange={(event) => updateContact(contact.id, { strength: event.target.value as ContactStrength })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{STRENGTH_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                    <input value={contact.location} maxLength={120} onChange={(event) => updateContact(contact.id, { location: event.target.value })} placeholder="Location" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <input value={contact.source} maxLength={120} onChange={(event) => updateContact(contact.id, { source: event.target.value })} placeholder="Source" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <input type="date" aria-label={`Follow-up date for ${contact.name}`} value={contact.nextFollowUpAt} onChange={(event) => updateContact(contact.id, { nextFollowUpAt: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <input type="email" value={contact.email} maxLength={254} onChange={(event) => updateContact(contact.id, { email: event.target.value })} placeholder="Email" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <input type="url" value={contact.linkedin} maxLength={2048} onChange={(event) => updateContact(contact.id, { linkedin: event.target.value })} placeholder="LinkedIn URL" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                  </div>
                  <input value={(contact.tags || []).join(", ")} onChange={(event) => updateContact(contact.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="Tags, comma separated" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                  <textarea value={contact.notes} maxLength={2000} onChange={(event) => updateContact(contact.id, { notes: event.target.value })} rows={2} placeholder="Conversation notes or warm intro context" className="w-full resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
                  <div className="flex flex-wrap gap-3 text-xs">
                    {isNetworkingFollowUpDue(contact) && <span className="font-semibold text-amber-300">Follow-up due</span>}
                    <button onClick={() => markContacted(contact.id)} className="font-medium text-emerald-400 hover:text-emerald-300">Mark contacted</button>
                    <button onClick={() => addFollowUpTask(contact)} className="font-medium text-blue-400 hover:text-blue-300">Add planner task</button>
                    {contact.email && <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 font-medium text-violet-400 hover:text-violet-300"><Mail className="h-3.5 w-3.5" />Email</a>}
                    {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300"><ExternalLink className="h-3.5 w-3.5" />LinkedIn</a>}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => duplicateContact(contact)} aria-label={`Duplicate ${contact.name}`} className="text-gray-600 hover:text-emerald-400"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => updateContact(contact.id, { archived: !contact.archived })} aria-label={contact.archived ? `Restore ${contact.name}` : `Archive ${contact.name}`} className="text-gray-600 hover:text-blue-400"><Archive className="h-4 w-4" /></button>
                  <button onClick={() => removeContact(contact.id)} aria-label={`Delete ${contact.name}`} className="text-gray-600 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
