"use client";

import { useState } from "react";
import { Award, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  createCertificationRecord,
  sortCertificationRecords,
  type CertificationRecord,
} from "@/lib/certification-tracker";

export default function CertificationsPage() {
  const [records, setRecords] = useLocalStorage<CertificationRecord[]>(LOCAL_STORAGE_KEYS.certificationRecords, []);
  const [title, setTitle] = useState("");
  const visibleRecords = sortCertificationRecords(records).filter((record) => record.status !== "archived");

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
