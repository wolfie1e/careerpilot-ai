"use client";

import { useState, type ChangeEvent } from "react";
import { Archive, Award, Download, Plus, Search, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import type { PlannerTask } from "@/lib/career-planner";
import {
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_STATUSES,
  certificationCategoryCounts,
  certificationPlanText,
  certificationProgress,
  certificationRemainingStudyHours,
  certificationSkillCounts,
  certificationStatusCounts,
  certificationTotalCost,
  createCertificationRecord,
  isCertificationActive,
  isCertificationExpired,
  isCertificationExpiring,
  mergeCertificationRecords,
  nextCertificationDate,
  sortCertificationRecords,
  type CertificationCategory,
  type CertificationRecord,
  type CertificationStatus,
} from "@/lib/certification-tracker";

export default function CertificationsPage() {
  const [records, setRecords] = useLocalStorage<CertificationRecord[]>(LOCAL_STORAGE_KEYS.certificationRecords, []);
  const [plannerTasks, setPlannerTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CertificationCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CertificationStatus | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const visibleRecords = sortCertificationRecords(records).filter((record) => {
    if (!showArchived && record.status === "archived") return false;
    if (categoryFilter !== "all" && record.category !== categoryFilter) return false;
    if (statusFilter !== "all" && record.status !== statusFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${record.title} ${record.provider} ${record.examCode} ${record.notes} ${record.skills.join(" ")}`.toLowerCase().includes(query);
  });
  const activeRecords = records.filter((record) => isCertificationActive(record));
  const expiringRecords = records.filter((record) => isCertificationExpiring(record));
  const categoryRows = Object.entries(certificationCategoryCounts(visibleRecords)).map(([category, count]) => ({ category, count }));
  const skillRows = Object.entries(certificationSkillCounts(visibleRecords)).map(([skill, count]) => ({ skill, count }));
  const statusRows = Object.entries(certificationStatusCounts(visibleRecords)).map(([status, count]) => ({ status, count }));
  const certificationBudget = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(certificationTotalCost(records));
  const nextDate = nextCertificationDate(records);

  function addRecord() {
    if (!title.trim()) return;
    setRecords((current) => [createCertificationRecord(title), ...current]);
    setTitle("");
    toast.success("Certification added");
  }

  async function importRecords(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { certifications?: CertificationRecord[] } | CertificationRecord[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.certifications || [];
      setRecords((current) => mergeCertificationRecords(current, incoming));
      toast.success(`${incoming.length} certifications imported`);
    } catch {
      toast.error("Could not import certifications");
    }
  }

  function exportRecords() {
    downloadJson("careerpilot-certifications.json", { certifications: records });
  }

  function updateVisibleStatus(status: CertificationStatus) {
    const visibleIds = new Set(visibleRecords.map((record) => record.id));
    setRecords((current) => current.map((record) => visibleIds.has(record.id) ? { ...record, status, updatedAt: new Date().toISOString() } : record));
    toast.success(`Visible certifications marked ${status}`);
  }

  function clearArchivedRecords() {
    setRecords((current) => current.filter((record) => record.status !== "archived"));
    toast.success("Archived certifications cleared");
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setShowArchived(false);
  }

  function updateRecord(id: string, patch: Partial<CertificationRecord>) {
    setRecords((current) => current.map((record) => record.id === id ? { ...record, ...patch, updatedAt: new Date().toISOString() } : record));
  }

  function duplicateRecord(record: CertificationRecord) {
    setRecords((current) => [{ ...record, id: crypto.randomUUID(), title: `${record.title} copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current]);
    toast.success("Certification duplicated");
  }

  function removeRecord(id: string) {
    setRecords((current) => current.filter((record) => record.id !== id));
    toast.success("Certification deleted");
  }

  function addRecordToPlanner(record: CertificationRecord) {
    const task: PlannerTask = {
      id: crypto.randomUUID(),
      title: record.status === "earned" ? `Renew ${record.title}` : `Study for ${record.title}`,
      notes: `Created from certification tracker.${record.provider ? ` Provider: ${record.provider}.` : ""}`,
      priority: isCertificationExpiring(record) ? "high" : "medium",
      category: "learning",
      estimateMinutes: Math.max(30, Math.round((record.studyHours - record.completedHours) * 60)),
      resourceUrl: record.credentialUrl,
      status: "todo",
      dueDate: record.expiresAt || record.targetDate,
      createdAt: new Date().toISOString(),
      completedAt: null,
      archived: false,
      tags: ["certification", ...record.skills.slice(0, 5)],
      recurrence: "none",
    };
    setPlannerTasks([task, ...plannerTasks]);
    toast.success("Certification task added to planner");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Certification Tracker</h2>
        <p className="mt-1 text-sm text-gray-400">Plan, earn, and renew credentials that support your next role.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          ["Tracked", records.filter((record) => record.status !== "archived").length],
          ["Studying", records.filter((record) => record.status === "studying").length],
          ["Active", activeRecords.length],
          ["Renewals", expiringRecords.length],
          ["Study left", `${certificationRemainingStudyHours(records)}h`],
          ["Budget", certificationBudget],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {nextDate && (
        <div className="rounded-2xl border border-cyan-800/50 bg-cyan-950/20 p-4 text-sm text-cyan-100">
          Next certification {nextDate.type === "renewal" ? "renewal" : "target"}: <span className="font-semibold">{nextDate.title}</span> on {nextDate.date}
        </div>
      )}

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
        <button onClick={() => updateVisibleStatus("studying")} disabled={!visibleRecords.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Studying visible</button>
        <button onClick={() => updateVisibleStatus("earned")} disabled={!visibleRecords.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Earned visible</button>
        <button onClick={() => updateVisibleStatus("archived")} disabled={!visibleRecords.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Archive visible</button>
        <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Archived</button>
        <button onClick={clearArchivedRecords} disabled={!records.some((record) => record.status === "archived")} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Clear archived</button>
        <button onClick={resetFilters} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Reset filters</button>
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
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Upload className="h-4 w-4" />
          Import
          <input type="file" accept=".json,application/json" onChange={importRecords} className="sr-only" />
        </label>
        <CopyButton value={certificationPlanText(visibleRecords) || "No certifications yet"} label="Copy plan" className="rounded-xl px-3" />
        <button onClick={exportRecords} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Download className="h-4 w-4" />
          JSON
        </button>
        <button onClick={() => downloadCsv("careerpilot-certifications.csv", visibleRecords.map((record) => ({
          title: record.title,
          provider: record.provider,
          category: record.category,
          status: record.status,
          progress: certificationProgress(record),
          target_date: record.targetDate,
          issued_at: record.issuedAt,
          expires_at: record.expiresAt,
          skills: record.skills.join(", "),
        })))} disabled={!visibleRecords.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          CSV
        </button>
        <button onClick={() => downloadCsv("careerpilot-certification-categories.csv", categoryRows)} disabled={!categoryRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Categories
        </button>
        <button onClick={() => downloadCsv("careerpilot-certification-skills.csv", skillRows)} disabled={!skillRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Skills
        </button>
        <button onClick={() => downloadCsv("careerpilot-certification-statuses.csv", statusRows)} disabled={!statusRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Statuses
        </button>
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
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[1.2fr_1fr_180px_180px]">
                  <input value={record.title} maxLength={140} onChange={(event) => updateRecord(record.id, { title: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                  <input value={record.provider} maxLength={120} onChange={(event) => updateRecord(record.id, { provider: event.target.value })} placeholder="Provider" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                  <select value={record.category} onChange={(event) => updateRecord(record.id, { category: event.target.value as CertificationCategory })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
                    {CERTIFICATION_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <select value={record.status} onChange={(event) => updateRecord(record.id, { status: event.target.value as CertificationStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
                    {CERTIFICATION_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => duplicateRecord(record)} aria-label={`Duplicate ${record.title}`} className="text-gray-600 hover:text-emerald-400"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => updateRecord(record.id, { favorite: !record.favorite })} aria-label={`Favorite ${record.title}`} className={record.favorite ? "text-amber-300" : "text-gray-600 hover:text-amber-300"}><Star className="h-4 w-4" /></button>
                  <button onClick={() => updateRecord(record.id, { status: "archived" })} aria-label={`Archive ${record.title}`} className="text-gray-600 hover:text-blue-400"><Archive className="h-4 w-4" /></button>
                  <button onClick={() => removeRecord(record.id)} aria-label={`Delete ${record.title}`} className="text-gray-600 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <button onClick={() => addRecordToPlanner(record)} className="mt-3 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white">
                Add planner task
              </button>
              <div className="mt-3 flex flex-wrap gap-2">
                {isCertificationActive(record) && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">Active credential</span>}
                {isCertificationExpiring(record) && <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">Renewal window</span>}
                {isCertificationExpired(record) && <span className="rounded-full bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-300">Expired</span>}
                {record.favorite && <span className="rounded-full bg-fuchsia-500/10 px-2 py-1 text-xs font-medium text-fuchsia-300">Priority</span>}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${certificationProgress(record)}%` }} />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <input type="number" min={0} value={record.studyHours} onChange={(event) => updateRecord(record.id, { studyHours: Number(event.target.value) })} placeholder="Study hours" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" min={0} value={record.completedHours} onChange={(event) => updateRecord(record.id, { completedHours: Number(event.target.value) })} placeholder="Completed hours" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-xs text-gray-400">{certificationProgress(record)}% complete</div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <input value={record.examCode} maxLength={80} onChange={(event) => updateRecord(record.id, { examCode: event.target.value })} placeholder="Exam code" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="date" value={record.targetDate} onChange={(event) => updateRecord(record.id, { targetDate: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="date" value={record.issuedAt} onChange={(event) => updateRecord(record.id, { issuedAt: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="date" value={record.expiresAt} onChange={(event) => updateRecord(record.id, { expiresAt: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <input value={record.credentialUrl} maxLength={2048} onChange={(event) => updateRecord(record.id, { credentialUrl: event.target.value })} placeholder="Credential URL" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={record.score} maxLength={80} onChange={(event) => updateRecord(record.id, { score: event.target.value })} placeholder="Score or result" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" min={0} value={record.cost} onChange={(event) => updateRecord(record.id, { cost: Number(event.target.value) })} placeholder="Cost" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" min={1} value={record.renewalWindowDays} onChange={(event) => updateRecord(record.id, { renewalWindowDays: Number(event.target.value) })} placeholder="Renewal window days" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1.5fr]">
                <input value={(record.skills || []).join(", ")} onChange={(event) => updateRecord(record.id, { skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) })} placeholder="Skills, comma separated" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <textarea value={record.notes} maxLength={1600} onChange={(event) => updateRecord(record.id, { notes: event.target.value })} rows={2} placeholder="Study notes, renewal requirements, or proof links" className="resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
