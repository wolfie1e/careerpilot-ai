"use client";

import { useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  LEARNING_RESOURCE_STATUSES,
  LEARNING_RESOURCE_TYPES,
  createLearningResource,
  isLearningResourceDueSoon,
  isLearningResourceOverdue,
  sortLearningResources,
  type LearningResource,
  type LearningResourceStatus,
  type LearningResourceType,
} from "@/lib/learning-path";

export default function LearningPage() {
  const [resources, setResources] = useLocalStorage<LearningResource[]>(LOCAL_STORAGE_KEYS.learningResources, []);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LearningResourceType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LearningResourceStatus | "all">("all");
  const visibleResources = sortLearningResources(resources).filter((resource) => {
    if (resource.status === "archived") return false;
    if (typeFilter !== "all" && resource.type !== typeFilter) return false;
    if (statusFilter !== "all" && resource.status !== statusFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${resource.title} ${resource.provider} ${resource.skillArea} ${resource.targetRole} ${resource.notes} ${resource.tags.join(" ")}`.toLowerCase().includes(query);
  });
  const activeResources = resources.filter((resource) => !["completed", "archived"].includes(resource.status));

  function addResource() {
    if (!title.trim()) return;
    setResources((current) => [createLearningResource(title), ...current]);
    setTitle("");
    toast.success("Learning resource added");
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
              <div className="font-semibold text-white">{resource.title}</div>
              <div className="mt-1 text-xs text-gray-500">{resource.provider || "Provider not set"} · {resource.status}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
