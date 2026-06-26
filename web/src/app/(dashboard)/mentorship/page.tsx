"use client";

import { useState } from "react";
import { Handshake, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  createMentorshipContact,
  isMentorshipFollowUpDue,
  sortMentorshipContacts,
  type MentorshipContact,
} from "@/lib/mentorship";

export default function MentorshipPage() {
  const [contacts, setContacts] = useLocalStorage<MentorshipContact[]>(LOCAL_STORAGE_KEYS.mentorshipContacts, []);
  const [name, setName] = useState("");
  const visibleContacts = sortMentorshipContacts(contacts).filter((contact) => contact.status !== "archived");
  const activeContacts = contacts.filter((contact) => contact.status === "active");

  function addContact() {
    if (!name.trim()) return;
    setContacts((current) => [createMentorshipContact(name), ...current]);
    setName("");
    toast.success("Mentorship contact added");
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

      {visibleContacts.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center">
          <Handshake className="mx-auto mb-3 h-9 w-9 text-gray-600" />
          <p className="text-sm text-gray-400">Add your first mentorship contact to build a stronger support network.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleContacts.map((contact) => (
            <article key={contact.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="font-semibold text-white">{contact.name}</div>
              <div className="mt-1 text-xs text-gray-500">{contact.role || "Role not set"} · {contact.relationship}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
