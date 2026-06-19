"use client";

import { useState, type ChangeEvent } from "react";
import { Archive, Download, Plus, Search, Target, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  CAREER_GOAL_HORIZONS,
  CAREER_GOAL_STATUSES,
  activeCareerGoalCount,
  averageCareerGoalProgress,
  careerGoalProgress,
  careerGoalPipelineText,
  createCareerGoal,
  mergeCareerGoals,
  sortCareerGoals,
  type CareerGoal,
  type CareerGoalStatus,
} from "@/lib/career-goals";
import { downloadCsv, downloadJson } from "@/lib/export-utils";

export default function GoalsPage() {
  const [goals, setGoals] = useLocalStorage<CareerGoal[]>(LOCAL_STORAGE_KEYS.careerGoals, []);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CareerGoalStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<CareerGoal["category"] | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<CareerGoal["priority"] | "all">("all");
  const visibleGoals = sortCareerGoals(goals).filter((goal) => {
    if (goal.status === "archived") return false;
    if (statusFilter !== "all" && goal.status !== statusFilter) return false;
    if (categoryFilter !== "all" && goal.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && goal.priority !== priorityFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${goal.title} ${goal.description} ${goal.category} ${goal.tags.join(" ")}`.toLowerCase().includes(query);
  });

  const categoryOptions: Array<CareerGoal["category"]> = ["resume", "interview", "networking", "applications", "learning", "portfolio", "other"];

  function addGoal() {
    if (!title.trim()) return;
    setGoals((current) => [createCareerGoal(title), ...current]);
    setTitle("");
    toast.success("Goal added");
  }

  function updateGoal(id: string, patch: Partial<CareerGoal>) {
    setGoals((current) => current.map((goal) => goal.id === id ? { ...goal, ...patch, updatedAt: new Date().toISOString() } : goal));
  }

  function removeGoal(id: string) {
    setGoals((current) => current.filter((goal) => goal.id !== id));
    toast.success("Goal deleted");
  }

  async function importGoals(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { goals?: CareerGoal[] } | CareerGoal[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.goals || [];
      setGoals((current) => mergeCareerGoals(current, incoming));
      toast.success(`${incoming.length} goals imported`);
    } catch {
      toast.error("Could not import goals");
    }
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Career Goals</h2>
        <p className="mt-1 text-sm text-gray-400">Define outcomes, deadlines, and measurable progress for your job search.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Active goals", activeCareerGoalCount(goals)],
          ["Average progress", `${averageCareerGoalProgress(goals)}%`],
          ["Completed", goals.filter((goal) => goal.status === "completed").length],
          ["High priority", goals.filter((goal) => goal.priority === "high" && goal.status !== "archived").length],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-xl font-bold text-white">{value}</div></div>)}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input value={title} maxLength={140} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addGoal(); }} placeholder="Add a career goal" className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addGoal} disabled={!title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Add goal</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select aria-label="Filter career goals by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CareerGoalStatus | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="all">All statuses</option>{CAREER_GOAL_STATUSES.filter((option) => option.value !== "archived").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <select aria-label="Filter career goals by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CareerGoal["category"] | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="all">All categories</option>{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select>
        <select aria-label="Filter career goals by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as CareerGoal["priority"] | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="all">All priorities</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select>
        <label className="relative min-w-64 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search goals" className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" /></label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Upload className="h-4 w-4" />Import<input type="file" accept=".json,application/json" onChange={importGoals} className="sr-only" /></label>
        <CopyButton value={careerGoalPipelineText(visibleGoals) || "No career goals yet"} label="Copy goals" className="rounded-xl px-3" />
        <button onClick={() => downloadJson("careerpilot-career-goals.json", { goals })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Download className="h-4 w-4" />JSON</button>
        <button onClick={() => downloadCsv("careerpilot-career-goals.csv", visibleGoals.map((goal) => ({ title: goal.title, status: goal.status, category: goal.category, priority: goal.priority, target_date: goal.targetDate, progress: careerGoalProgress(goal), tags: goal.tags.join(", ") })))} disabled={!visibleGoals.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />CSV</button>
      </div>

      {visibleGoals.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center"><Target className="mx-auto mb-3 h-9 w-9 text-gray-600" /><p className="text-sm text-gray-400">Add your first goal to start tracking outcomes.</p></div>
      ) : (
        <div className="space-y-3">
          {visibleGoals.map((goal) => (
            <article key={goal.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-3">
                  <input value={goal.title} maxLength={140} onChange={(event) => updateGoal(goal.id, { title: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                  <select value={goal.status} onChange={(event) => updateGoal(goal.id, { status: event.target.value as CareerGoalStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{CAREER_GOAL_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  <select value={goal.horizon} onChange={(event) => updateGoal(goal.id, { horizon: event.target.value as CareerGoal["horizon"] })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{CAREER_GOAL_HORIZONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => updateGoal(goal.id, { status: "archived" })} aria-label={`Archive ${goal.title}`} className="text-gray-600 hover:text-blue-400"><Archive className="h-4 w-4" /></button>
                  <button onClick={() => removeGoal(goal.id)} aria-label={`Delete ${goal.title}`} className="text-gray-600 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <select value={goal.category} onChange={(event) => updateGoal(goal.id, { category: event.target.value as CareerGoal["category"] })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                <select value={goal.priority} onChange={(event) => updateGoal(goal.id, { priority: event.target.value as CareerGoal["priority"] })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300"><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select>
                <input type="date" value={goal.targetDate} onChange={(event) => updateGoal(goal.id, { targetDate: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={goal.metricLabel} maxLength={80} onChange={(event) => updateGoal(goal.id, { metricLabel: event.target.value })} placeholder="Metric label" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${careerGoalProgress(goal)}%` }} /></div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                <label className="text-xs text-gray-500">Current<input type="number" value={goal.currentValue} onChange={(event) => updateGoal(goal.id, { currentValue: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" /></label>
                <label className="text-xs text-gray-500">Target<input type="number" min={1} value={goal.targetValue} onChange={(event) => updateGoal(goal.id, { targetValue: Math.max(1, Number(event.target.value)) })} className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" /></label>
                <label className="text-xs text-gray-500">Manual progress<input type="range" min={0} max={100} value={goal.progress} onChange={(event) => updateGoal(goal.id, { progress: Number(event.target.value) })} className="mt-3 w-full accent-blue-500" /></label>
              </div>
              <textarea value={goal.description} maxLength={1200} onChange={(event) => updateGoal(goal.id, { description: event.target.value })} rows={2} placeholder="What will be true when this goal is done?" className="mt-3 w-full resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
              <input value={(goal.tags || []).join(", ")} onChange={(event) => updateGoal(goal.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="Tags, comma separated" className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
