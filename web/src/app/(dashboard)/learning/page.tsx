"use client";

import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  createLearningResource,
  sortLearningResources,
  type LearningResource,
} from "@/lib/learning-path";

export default function LearningPage() {
  const [resources, setResources] = useLocalStorage<LearningResource[]>(LOCAL_STORAGE_KEYS.learningResources, []);
  const [title, setTitle] = useState("");
  const visibleResources = sortLearningResources(resources).filter((resource) => resource.status !== "archived");

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

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input value={title} maxLength={140} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addResource(); }} placeholder="Add a course, book, project, or practice resource" className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addResource} disabled={!title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
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
