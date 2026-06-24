"use client";

import { useState } from "react";
import { Award, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_STATUSES,
  createCertificationRecord,
  isCertificationActive,
  isCertificationExpiring,
  sortCertificationRecords,
  type CertificationCategory,
  type CertificationRecord,
  type CertificationStatus,
} from "@/lib/certification-tracker";

export default function CertificationsPage() {
  const [records, setRecords] = useLocalStorage<CertificationRecord[]>(LOCAL_STORAGE_KEYS.certificationRecords, []);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CertificationCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CertificationStatus | "all">("all");
  const visibleRecords = sortCertificationRecords(records).filter((record) => {
    if (record.status === "archived") return false;
    if (categoryFilter !== "all" && record.category !== categoryFilter) return false;
    if (statusFilter !== "all" && record.status !== statusFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${record.title} ${record.provider} ${record.examCode} ${record.notes} ${record.skills.join(" ")}`.toLowerCase().includes(query);
  });
  const activeRecords = records.filter((record) => isCertificationActive(record));
  const expiringRecords = records.filter((record) => isCertificationExpiring(record));

  function addRecord() {
    if (!title.trim()) return;
    setRecords((current) => [createCertificationRecord(title), ...current]);
    setTitle("");
    toast.success("Certification added");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Certification Tracker</h2>
        <p className="mt-1 text-sm text-gray-400">Plan, earn, and renew credentials that support your next role.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Tracked", records.filter((record) => record.status !== "archived").length],
          ["Studying", records.filter((record) => record.status === "studying").length],
          ["Active", activeRecords.length],
          ["Renewals", expiringRecords.length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input
            value={title}
            maxLength={140}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") addRecord(); }}
            placeholder="Add a certification or credential"
            className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          />
          <button onClick={addRecord} disabled={!title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select aria-label="Filter certifications by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CertificationCategory | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300">
          <option value="all">All categories</option>
          {CERTIFICATION_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select aria-label="Filter certifications by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CertificationStatus | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300">
          <option value="all">All statuses</option>
          {CERTIFICATION_STATUSES.filter((option) => option.value !== "archived").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search certifications" className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" />
        </label>
      </div>

      {visibleRecords.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center">
          <Award className="mx-auto mb-3 h-9 w-9 text-gray-600" />
          <p className="text-sm text-gray-400">Add your first certification to build a credential roadmap.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleRecords.map((record) => (
            <article key={record.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="font-semibold text-white">{record.title}</div>
              <div className="mt-1 text-xs text-gray-500">{record.provider || "Provider not set"} · {record.status}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
