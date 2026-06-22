"use client";

import { useState, type ChangeEvent } from "react";
import { Archive, Download, Medal, Plus, Search, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_STATUSES,
  achievementCategoryCounts,
  achievementCompletion,
  achievementPipelineText,
  achievementTagCounts,
  createAchievementStory,
  favoriteAchievementCount,
  mergeAchievementStories,
  readyAchievementCount,
  sortAchievementStories,
  type AchievementCategory,
  type AchievementStatus,
  type AchievementStory,
} from "@/lib/achievement-vault";
import { downloadCsv, downloadJson } from "@/lib/export-utils";

export default function AchievementsPage() {
  const [stories, setStories] = useLocalStorage<AchievementStory[]>(LOCAL_STORAGE_KEYS.achievementStories, []);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AchievementStatus | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const visibleStories = sortAchievementStories(stories).filter((story) => {
    if (!showArchived && story.status === "archived") return false;
    if (categoryFilter !== "all" && story.category !== categoryFilter) return false;
    if (statusFilter !== "all" && story.status !== statusFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${story.title} ${story.situation} ${story.action} ${story.result} ${story.metric} ${story.tags.join(" ")}`.toLowerCase().includes(query);
  });
  const categoryRows = Object.entries(achievementCategoryCounts(visibleStories)).map(([category, count]) => ({ category, count }));
  const tagRows = Object.entries(achievementTagCounts(visibleStories)).map(([tag, count]) => ({ tag, count }));

  function addStory() {
    if (!title.trim()) return;
    setStories((current) => [createAchievementStory(title), ...current]);
    setTitle("");
    toast.success("Achievement added");
  }

  function updateStory(id: string, patch: Partial<AchievementStory>) {
    setStories((current) => current.map((story) => story.id === id ? { ...story, ...patch, updatedAt: new Date().toISOString() } : story));
  }

  function removeStory(id: string) {
    setStories((current) => current.filter((story) => story.id !== id));
    toast.success("Achievement deleted");
  }

  async function importStories(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { stories?: AchievementStory[] } | AchievementStory[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.stories || [];
      setStories((current) => mergeAchievementStories(current, incoming));
      toast.success(`${incoming.length} stories imported`);
    } catch {
      toast.error("Could not import stories");
    }
  }

  function markVisibleReady() {
    const visibleIds = new Set(visibleStories.map((story) => story.id));
    setStories((current) => current.map((story) => visibleIds.has(story.id) ? { ...story, status: "ready", updatedAt: new Date().toISOString() } : story));
    toast.success("Visible stories marked ready");
  }

  function archiveVisibleStories() {
    const visibleIds = new Set(visibleStories.map((story) => story.id));
    setStories((current) => current.map((story) => visibleIds.has(story.id) ? { ...story, status: "archived", updatedAt: new Date().toISOString() } : story));
    toast.success("Visible stories archived");
  }

  function clearArchivedStories() {
    setStories((current) => current.filter((story) => story.status !== "archived"));
    toast.success("Archived stories cleared");
  }

  function duplicateStory(story: AchievementStory) {
    setStories((current) => [{ ...story, id: crypto.randomUUID(), title: `${story.title} copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current]);
    toast.success("Story duplicated");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Achievement Vault</h2>
        <p className="mt-1 text-sm text-gray-400">Capture STAR stories for resumes, interviews, and performance reviews.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Stories", stories.filter((story) => story.status !== "archived").length],
          ["Ready", readyAchievementCount(stories)],
          ["Favorites", favoriteAchievementCount(stories)],
          ["Average confidence", stories.length ? Math.round(stories.reduce((sum, story) => sum + story.confidence, 0) / stories.length) : 0],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-xl font-bold text-white">{value}</div></div>)}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input value={title} maxLength={140} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addStory(); }} placeholder="Add an achievement story" className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addStory} disabled={!title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Add story</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={markVisibleReady} disabled={!visibleStories.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Ready visible</button>
        <button onClick={archiveVisibleStories} disabled={!visibleStories.length} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Archive visible</button>
        <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Archived</button>
        <button onClick={clearArchivedStories} disabled={!stories.some((story) => story.status === "archived")} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Clear archived</button>
        <select aria-label="Filter achievements by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as AchievementCategory | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="all">All categories</option>{ACHIEVEMENT_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <select aria-label="Filter achievements by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AchievementStatus | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="all">All statuses</option>{ACHIEVEMENT_STATUSES.filter((option) => option.value !== "archived").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <label className="relative min-w-64 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search achievement stories" className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" /></label>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Upload className="h-4 w-4" />Import<input type="file" accept=".json,application/json" onChange={importStories} className="sr-only" /></label>
        <CopyButton value={achievementPipelineText(visibleStories) || "No achievement stories yet"} label="Copy stories" className="rounded-xl px-3" />
        <button onClick={() => downloadJson("careerpilot-achievement-stories.json", { stories })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Download className="h-4 w-4" />JSON</button>
        <button onClick={() => downloadCsv("careerpilot-achievement-stories.csv", visibleStories.map((story) => ({ title: story.title, category: story.category, status: story.status, metric: story.metric, confidence: story.confidence, completion: achievementCompletion(story), tags: story.tags.join(", ") })))} disabled={!visibleStories.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />CSV</button>
        <button onClick={() => downloadCsv("careerpilot-achievement-categories.csv", categoryRows)} disabled={!categoryRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />Categories</button>
        <button onClick={() => downloadCsv("careerpilot-achievement-tags.csv", tagRows)} disabled={!tagRows.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40"><Download className="h-4 w-4" />Tags</button>
      </div>

      {visibleStories.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center"><Medal className="mx-auto mb-3 h-9 w-9 text-gray-600" /><p className="text-sm text-gray-400">Add your first achievement to build a reusable story bank.</p></div>
      ) : (
        <div className="space-y-3">
          {visibleStories.map((story) => (
            <article key={story.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="flex items-start gap-3">
                <div className="grid min-w-0 flex-1 gap-2 md:grid-cols-3">
                  <input value={story.title} maxLength={140} onChange={(event) => updateStory(story.id, { title: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                  <select value={story.category} onChange={(event) => updateStory(story.id, { category: event.target.value as AchievementCategory })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{ACHIEVEMENT_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                  <select value={story.status} onChange={(event) => updateStory(story.id, { status: event.target.value as AchievementStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{ACHIEVEMENT_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => duplicateStory(story)} aria-label={`Duplicate ${story.title}`} className="text-gray-600 hover:text-emerald-400"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => updateStory(story.id, { favorite: !story.favorite })} aria-label={`Favorite ${story.title}`} className={story.favorite ? "text-amber-300" : "text-gray-600 hover:text-amber-300"}><Star className="h-4 w-4" /></button>
                  <button onClick={() => updateStory(story.id, { status: "archived" })} aria-label={`Archive ${story.title}`} className="text-gray-600 hover:text-blue-400"><Archive className="h-4 w-4" /></button>
                  <button onClick={() => removeStory(story.id)} aria-label={`Delete ${story.title}`} className="text-gray-600 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${achievementCompletion(story)}%` }} /></div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <textarea value={story.situation} maxLength={1200} onChange={(event) => updateStory(story.id, { situation: event.target.value })} rows={2} placeholder="Situation" className="resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
                <textarea value={story.task} maxLength={1200} onChange={(event) => updateStory(story.id, { task: event.target.value })} rows={2} placeholder="Task" className="resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
              </div>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <textarea value={story.action} maxLength={1600} onChange={(event) => updateStory(story.id, { action: event.target.value })} rows={2} placeholder="Action" className="resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
                <textarea value={story.result} maxLength={1600} onChange={(event) => updateStory(story.id, { result: event.target.value })} rows={2} placeholder="Result" className="resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-4">
                <input value={story.metric} maxLength={160} onChange={(event) => updateStory(story.id, { metric: event.target.value })} placeholder="Metric or outcome" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={story.role} maxLength={120} onChange={(event) => updateStory(story.id, { role: event.target.value })} placeholder="Role" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input value={story.company} maxLength={120} onChange={(event) => updateStory(story.id, { company: event.target.value })} placeholder="Company" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <input type="date" value={story.date} onChange={(event) => updateStory(story.id, { date: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_220px]">
                <input value={(story.tags || []).join(", ")} onChange={(event) => updateStory(story.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="Tags, comma separated" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                <label className="text-xs text-gray-500">Confidence {story.confidence}/10<input type="range" min={1} max={10} value={story.confidence} onChange={(event) => updateStory(story.id, { confidence: Number(event.target.value) })} className="mt-2 w-full accent-blue-500" /></label>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
