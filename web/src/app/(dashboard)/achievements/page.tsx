"use client";

import { useState } from "react";
import { Medal, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_STATUSES,
  achievementCompletion,
  createAchievementStory,
  favoriteAchievementCount,
  readyAchievementCount,
  sortAchievementStories,
  type AchievementCategory,
  type AchievementStatus,
  type AchievementStory,
} from "@/lib/achievement-vault";

export default function AchievementsPage() {
  const [stories, setStories] = useLocalStorage<AchievementStory[]>(LOCAL_STORAGE_KEYS.achievementStories, []);
  const [title, setTitle] = useState("");
  const visibleStories = sortAchievementStories(stories).filter((story) => story.status !== "archived");

  function addStory() {
    if (!title.trim()) return;
    setStories((current) => [createAchievementStory(title), ...current]);
    setTitle("");
    toast.success("Achievement added");
  }

  function updateStory(id: string, patch: Partial<AchievementStory>) {
    setStories((current) => current.map((story) => story.id === id ? { ...story, ...patch, updatedAt: new Date().toISOString() } : story));
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

      {visibleStories.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center"><Medal className="mx-auto mb-3 h-9 w-9 text-gray-600" /><p className="text-sm text-gray-400">Add your first achievement to build a reusable story bank.</p></div>
      ) : (
        <div className="space-y-3">
          {visibleStories.map((story) => (
            <article key={story.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="grid gap-2 md:grid-cols-3">
                <input value={story.title} maxLength={140} onChange={(event) => updateStory(story.id, { title: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                <select value={story.category} onChange={(event) => updateStory(story.id, { category: event.target.value as AchievementCategory })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{ACHIEVEMENT_CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                <select value={story.status} onChange={(event) => updateStory(story.id, { status: event.target.value as AchievementStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{ACHIEVEMENT_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${achievementCompletion(story)}%` }} /></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
