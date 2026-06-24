"use client";

import { useState, type ChangeEvent } from "react";
import { BookOpen, Download, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import {
  LEARNING_RESOURCE_STATUSES,
  LEARNING_RESOURCE_PRIORITIES,
  LEARNING_RESOURCE_TYPES,
  createLearningResource,
  isLearningResourceDueSoon,
  isLearningResourceOverdue,
  learningProgress,
  learningTagCounts,
  learningTypeCounts,
  learningPlanText,
  mergeLearningResources,
  sortLearningResources,
  type LearningResource,
  type LearningResourcePriority,
  type LearningResourceStatus,
  type LearningResourceType,
} from "@/lib/learning-path";

export default function LearningPage() {
  const [resources, setResources] = useLocalStorage<LearningResource[]>(LOCAL_STORAGE_KEYS.learningResources, []);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LearningResourceType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LearningResourceStatus | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const visibleResources = sortLearningResources(resources).filter((resource) => {
    if (!showArchived && resource.status === "archived") return false;
    if (typeFilter !== "all" && resource.type !== typeFilter) return false;
    if (statusFilter !== "all" && resource.status !== statusFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${resource.title} ${resource.provider} ${resource.skillArea} ${resource.targetRole} ${resource.notes} ${resource.tags.join(" ")}`.toLowerCase().includes(query);
  });
  const activeResources = resources.filter((resource) => !["completed", "archived"].includes(resource.status));
  const typeRows = Object.entries(learningTypeCounts(visibleResources)).map(([type, count]) => ({ type, count }));
  const tagRows = Object.entries(learningTagCounts(visibleResources)).map(([tag, count]) => ({ tag, count }));

  function addResource() {
    if (!title.trim()) return;
    setResources((current) => [createLearningResource(title), ...current]);
    setTitle("");
    toast.success("Learning resource added");
  }

  async function importResources(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { resources?: LearningResource[] } | LearningResource[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.resources || [];
      setResources((current) => mergeLearningResources(current, incoming));
      toast.success(`${incoming.length} learning resources imported`);
    } catch {
      toast.error("Could not import learning resources");
    }
  }

  function updateVisibleStatus(status: LearningResourceStatus) {
    const visibleIds = new Set(visibleResources.map((resource) => resource.id));
    setResources((current) => current.map((resource) => visibleIds.has(resource.id) ? { ...resource, status, updatedAt: new Date().toISOString() } : resource));
    toast.success(`Visible resources marked ${status.replace("_", " ")}`);
  }

  function clearArchivedResources() {
    setResources((current) => current.filter((resource) => resource.status !== "archived"));
    toast.success("Archived learning resources cleared");
  }

  function updateResource(id: string, patch: Partial<LearningResource>) {
    setResources((current) => current.map((resource) => resource.id === id ? { ...resource, ...patch, updatedAt: new Date().toISOString() } : resource));
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Learning Path</h2>
        <p className="mt-1 text-sm text-gray-400">Plan courses, projects, and practice resources for your next career move.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Active", activeResources.length],
          ["In progress", resources.filter((resource) => resource.status === "in_progress").length],
          ["Completed", resources.filter((resource) => resource.status === "completed").length],
          ["Due soon", resources.filter((resource) => isLearningResourceDueSoon(resource) || isLearningResourceOverdue(resource)).length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input value={title} maxLength={140} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addResource(); }} placeholder="Add a course, book, project, or practice resource" className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addResource} disabled={!title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => updateVisibleStatus("in_progress")} disabled={!visibleResources.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Start visible</button>
        <button onClick={() => updateVisibleStatus("completed")} disabled={!visibleResources.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Complete visible</button>
        <button onClick={() => updateVisibleStatus("archived")} disabled={!visibleResources.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Archive visible</button>
        <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Archived</button>
        <button onClick={clearArchivedResources} disabled={!resources.some((resource) => resource.status === "archived")} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Clear archived</button>
        <select aria-label="Filter learning resources by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as LearningResourceType | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300">
          <option value="all">All types</option>
          {LEARNING_RESOURCE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select aria-label="Filter learning resources by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LearningResourceStatus | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300">
          <option value="all">All statuses</option>
          {LEARNING_RESOURCE_STATUSES.filter((option) => option.value !== "archived").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <label className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search learning resources" className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" />
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Upload className="h-4 w-4" />
          Import
          <input type="file" accept=".json,application/json" onChange={importResources} className="sr-only" />
        </label>
        <CopyButton value={learningPlanText(visibleResources) || "No learning resources yet"} label="Copy plan" className="rounded-xl px-3" />
        <button onClick={() => downloadJson("careerpilot-learning-resources.json", { resources })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Download className="h-4 w-4" />
          JSON
        </button>
        <button onClick={() => downloadCsv("careerpilot-learning-resources.csv", visibleResources.map((resource) => ({
          title: resource.title,
          provider: resource.provider,
          type: resource.type,
          status: resource.status,
          priority: resource.priority,
          progress: learningProgress(resource),
          skill_area: resource.skillArea,
          target_role: resource.targetRole,
          target_date: resource.targetDate,
          tags: resource.tags.join(", "),
        })))} disabled={!visibleResources.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          CSV
        </button>
        <button onClick={() => downloadCsv("careerpilot-learning-types.csv", typeRows)} disabled={!typeRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Types
        </button>
        <button onClick={() => downloadCsv("careerpilot-learning-tags.csv", tagRows)} disabled={!tagRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Tags
        </button>
      </div>

      {visibleResources.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-9 w-9 text-gray-600" />
          <p className="text-sm text-gray-400">Add your first learning resource to build a focused growth path.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleResources.map((resource) => (
            <article key={resource.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_150px_150px_150px]">
                <input value={resource.title} maxLength={140} onChange={(event) => updateResource(resource.id, { title: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                <input value={resource.provider} maxLength={120} onChange={(event) => updateResource(resource.id, { provider: event.target.value })} placeholder="Provider" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <select value={resource.type} onChange={(event) => updateResource(resource.id, { type: event.target.value as LearningResourceType })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{LEARNING_RESOURCE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                <select value={resource.status} onChange={(event) => updateResource(resource.id, { status: event.target.value as LearningResourceStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{LEARNING_RESOURCE_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                <select value={resource.priority} onChange={(event) => updateResource(resource.id, { priority: event.target.value as LearningResourcePriority })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{LEARNING_RESOURCE_PRIORITIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${learningProgress(resource)}%` }} />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <input type="number" min={0} value={resource.estimatedHours} onChange={(event) => updateResource(resource.id, { estimatedHours: Number(event.target.value) })} placeholder="Estimated hours" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" min={0} value={resource.completedHours} onChange={(event) => updateResource(resource.id, { completedHours: Number(event.target.value) })} placeholder="Completed hours" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-xs text-gray-400">{learningProgress(resource)}% complete</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
