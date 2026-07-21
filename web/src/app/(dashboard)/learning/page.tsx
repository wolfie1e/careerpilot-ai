"use client";

import { useState, type ChangeEvent } from "react";
import { Archive, BookOpen, Download, ExternalLink, Plus, Search, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import type { PlannerTask } from "@/lib/career-planner";
import {
  LEARNING_RESOURCE_STATUSES,
  LEARNING_RESOURCE_PRIORITIES,
  LEARNING_RESOURCE_TYPES,
  activeLearningCount,
  createLearningResource,
  completedLearningCount,
  favoriteLearningCount,
  highPriorityActiveLearningCount,
  isLearningResourceDueSoon,
  isLearningResourceOverdue,
  learningAverageCost,
  learningAverageProgress,
  learningAverageRating,
  learningCompletedHoursTotal,
  learningCompletionRate,
  learningDueSoonCount,
  learningOverdueCount,
  learningProgress,
  learningPriorityCounts,
  learningProviderCounts,
  learningRemainingHours,
  learningSkillAreaCounts,
  learningStatusCounts,
  learningTagCounts,
  learningTargetRoleCounts,
  learningTargetRoleCoverage,
  learningTotalCost,
  learningTypeCounts,
  learningPlanText,
  learningUnscheduledCount,
  mergeLearningResources,
  nextLearningDate,
  pausedLearningCount,
  sortLearningResources,
  type LearningResource,
  type LearningResourcePriority,
  type LearningResourceStatus,
  type LearningResourceType,
} from "@/lib/learning-path";

export default function LearningPage() {
  const [resources, setResources] = useLocalStorage<LearningResource[]>(LOCAL_STORAGE_KEYS.learningResources, []);
  const [, setPlannerTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
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
  const typeRows = Object.entries(learningTypeCounts(visibleResources)).map(([type, count]) => ({ type, count }));
  const statusRows = Object.entries(learningStatusCounts(visibleResources)).map(([status, count]) => ({ status, count }));
  const priorityRows = Object.entries(learningPriorityCounts(visibleResources)).map(([priority, count]) => ({ priority, count }));
  const skillRows = Object.entries(learningSkillAreaCounts(visibleResources)).map(([skillArea, count]) => ({ skill_area: skillArea, count }));
  const providerRows = Object.entries(learningProviderCounts(visibleResources)).map(([provider, count]) => ({ provider, count }));
  const roleRows = Object.entries(learningTargetRoleCounts(visibleResources)).map(([targetRole, count]) => ({ target_role: targetRole, count }));
  const tagRows = Object.entries(learningTagCounts(visibleResources)).map(([tag, count]) => ({ tag, count }));
  const learningBudget = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(learningTotalCost(resources));
  const averageLearningCost = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(learningAverageCost(resources));
  const nextDate = nextLearningDate(resources);

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

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setShowArchived(false);
  }

  function updateResource(id: string, patch: Partial<LearningResource>) {
    setResources((current) => current.map((resource) => resource.id === id ? { ...resource, ...patch, updatedAt: new Date().toISOString() } : resource));
  }

  function duplicateResource(resource: LearningResource) {
    setResources((current) => [{ ...resource, id: crypto.randomUUID(), title: `${resource.title} copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current]);
    toast.success("Learning resource duplicated");
  }

  function removeResource(id: string) {
    setResources((current) => current.filter((resource) => resource.id !== id));
    toast.success("Learning resource deleted");
  }

  function addResourceToPlanner(resource: LearningResource) {
    const task: PlannerTask = {
      id: crypto.randomUUID(),
      title: `Study ${resource.title}`,
      notes: `Created from learning path.${resource.skillArea ? ` Skill: ${resource.skillArea}.` : ""}`,
      priority: resource.priority,
      category: "learning",
      estimateMinutes: Math.max(30, Math.round((resource.estimatedHours - resource.completedHours) * 60)),
      resourceUrl: resource.url,
      status: "todo",
      dueDate: resource.targetDate,
      createdAt: new Date().toISOString(),
      completedAt: null,
      archived: false,
      tags: ["learning", ...resource.tags.slice(0, 5)],
      recurrence: "none",
    };
    setPlannerTasks((current) => [task, ...current]);
    toast.success("Learning task added to planner");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Learning Path</h2>
        <p className="mt-1 text-sm text-gray-400">Plan courses, projects, and practice resources for your next career move.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-8">
        {[
          ["Active", activeLearningCount(resources)],
          ["In progress", resources.filter((resource) => resource.status === "in_progress").length],
          ["Paused", pausedLearningCount(resources)],
          ["Completed", completedLearningCount(resources)],
          ["Completion rate", `${learningCompletionRate(resources)}%`],
          ["Due soon", learningDueSoonCount(resources)],
          ["Overdue", learningOverdueCount(resources)],
          ["High priority", highPriorityActiveLearningCount(resources)],
          ["Unscheduled", learningUnscheduledCount(resources)],
          ["Hours left", `${learningRemainingHours(resources)}h`],
          ["Hours done", `${learningCompletedHoursTotal(resources)}h`],
          ["Avg progress", `${learningAverageProgress(resources)}%`],
          ["Avg rating", `${learningAverageRating(resources)}/5`],
          ["Role coverage", learningTargetRoleCoverage(resources)],
          ["Favorites", favoriteLearningCount(resources)],
          ["Budget", learningBudget],
          ["Avg cost", averageLearningCost],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {nextDate && (
        <div className="rounded-2xl border border-cyan-800/50 bg-cyan-950/20 p-4 text-sm text-cyan-100">
          Next learning target: <span className="font-semibold">{nextDate.title}</span> on {nextDate.date}
        </div>
      )}

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
        <button onClick={resetFilters} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Reset filters</button>
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
          estimated_hours: resource.estimatedHours,
          completed_hours: resource.completedHours,
          cost: resource.cost,
          rating: resource.rating,
          skill_area: resource.skillArea,
          target_role: resource.targetRole,
          url: resource.url,
          started_at: resource.startedAt,
          completed_at: resource.completedAt,
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
        <button onClick={() => downloadCsv("careerpilot-learning-priorities.csv", priorityRows)} disabled={!priorityRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Priorities
        </button>
        <button onClick={() => downloadCsv("careerpilot-learning-skills.csv", skillRows)} disabled={!skillRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Skills
        </button>
        <button onClick={() => downloadCsv("careerpilot-learning-providers.csv", providerRows)} disabled={!providerRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Providers
        </button>
        <button onClick={() => downloadCsv("careerpilot-learning-target-roles.csv", roleRows)} disabled={!roleRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Roles
        </button>
        <button onClick={() => downloadCsv("careerpilot-learning-tags.csv", tagRows)} disabled={!tagRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Tags
        </button>
        <button onClick={() => downloadCsv("careerpilot-learning-statuses.csv", statusRows)} disabled={!statusRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Statuses
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
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-[1.2fr_1fr_150px_150px_150px]">
                  <input value={resource.title} maxLength={140} onChange={(event) => updateResource(resource.id, { title: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                  <input value={resource.provider} maxLength={120} onChange={(event) => updateResource(resource.id, { provider: event.target.value })} placeholder="Provider" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                  <select value={resource.type} onChange={(event) => updateResource(resource.id, { type: event.target.value as LearningResourceType })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{LEARNING_RESOURCE_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  <select value={resource.status} onChange={(event) => updateResource(resource.id, { status: event.target.value as LearningResourceStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{LEARNING_RESOURCE_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  <select value={resource.priority} onChange={(event) => updateResource(resource.id, { priority: event.target.value as LearningResourcePriority })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{LEARNING_RESOURCE_PRIORITIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => duplicateResource(resource)} aria-label={`Duplicate ${resource.title}`} className="text-gray-600 hover:text-emerald-400"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => updateResource(resource.id, { favorite: !resource.favorite })} aria-label={`Favorite ${resource.title}`} className={resource.favorite ? "text-amber-300" : "text-gray-600 hover:text-amber-300"}><Star className="h-4 w-4" /></button>
                  <button onClick={() => updateResource(resource.id, { status: "archived" })} aria-label={`Archive ${resource.title}`} className="text-gray-600 hover:text-blue-400"><Archive className="h-4 w-4" /></button>
                  <button onClick={() => removeResource(resource.id)} aria-label={`Delete ${resource.title}`} className="text-gray-600 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <button onClick={() => addResourceToPlanner(resource)} className="mt-3 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white">
                Add planner task
              </button>
              {resource.url && (
                <a href={resource.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open resource
                </a>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {isLearningResourceOverdue(resource) && <span className="rounded-full bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-300">Overdue</span>}
                {isLearningResourceDueSoon(resource) && <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">Due soon</span>}
                {resource.status === "completed" && <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">Completed</span>}
                {resource.favorite && <span className="rounded-full bg-fuchsia-500/10 px-2 py-1 text-xs font-medium text-fuchsia-300">Priority</span>}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${learningProgress(resource)}%` }} />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <input type="number" min={0} value={resource.estimatedHours} onChange={(event) => updateResource(resource.id, { estimatedHours: Number(event.target.value) })} placeholder="Estimated hours" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" min={0} value={resource.completedHours} onChange={(event) => updateResource(resource.id, { completedHours: Number(event.target.value) })} placeholder="Completed hours" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-xs text-gray-400">{learningProgress(resource)}% complete</div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <input type="date" value={resource.startedAt} onChange={(event) => updateResource(resource.id, { startedAt: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="date" value={resource.targetDate} onChange={(event) => updateResource(resource.id, { targetDate: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="date" value={resource.completedAt} onChange={(event) => updateResource(resource.id, { completedAt: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-5">
                <input value={resource.url} maxLength={2048} onChange={(event) => updateResource(resource.id, { url: event.target.value })} placeholder="Resource URL" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={resource.skillArea} maxLength={120} onChange={(event) => updateResource(resource.id, { skillArea: event.target.value })} placeholder="Skill area" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={resource.targetRole} maxLength={120} onChange={(event) => updateResource(resource.id, { targetRole: event.target.value })} placeholder="Target role" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" min={0} value={resource.cost} onChange={(event) => updateResource(resource.id, { cost: Number(event.target.value) })} placeholder="Cost" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="number" min={0} max={5} value={resource.rating} onChange={(event) => updateResource(resource.id, { rating: Number(event.target.value) })} placeholder="Rating" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1.5fr]">
                <input value={(resource.tags || []).join(", ")} onChange={(event) => updateResource(resource.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="Tags, comma separated" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <textarea value={resource.notes} maxLength={1600} onChange={(event) => updateResource(resource.id, { notes: event.target.value })} rows={2} placeholder="Notes, takeaways, or next practice ideas" className="resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
              </div>
            </article>
          ))}
        </div>
      )}

      {(typeRows.some((row) => row.count > 0) || skillRows.length > 0 || providerRows.length > 0 || roleRows.length > 0) && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-white">Resource types</h3>
            <div className="mt-3 space-y-2">{typeRows.filter((row) => row.count > 0).map((row) => <div key={row.type} className="flex justify-between text-sm text-gray-400"><span>{LEARNING_RESOURCE_TYPES.find((type) => type.value === row.type)?.label}</span><span className="text-white">{row.count}</span></div>)}</div>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-white">Skill areas</h3>
            <div className="mt-3 flex flex-wrap gap-2">{skillRows.slice(0, 10).map((row) => <span key={row.skill_area} className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">{row.skill_area} · {row.count}</span>)}</div>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-white">Providers</h3>
            <div className="mt-3 flex flex-wrap gap-2">{providerRows.slice(0, 10).map((row) => <span key={row.provider} className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">{row.provider} · {row.count}</span>)}</div>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-sm font-semibold text-white">Target roles</h3>
            <div className="mt-3 flex flex-wrap gap-2">{roleRows.slice(0, 10).map((row) => <span key={row.target_role} className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">{row.target_role} · {row.count}</span>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
