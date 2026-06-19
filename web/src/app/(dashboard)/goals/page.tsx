"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  CAREER_GOAL_HORIZONS,
  CAREER_GOAL_STATUSES,
  activeCareerGoalCount,
  averageCareerGoalProgress,
  careerGoalProgress,
  createCareerGoal,
  sortCareerGoals,
  type CareerGoal,
  type CareerGoalStatus,
} from "@/lib/career-goals";

export default function GoalsPage() {
  const [goals, setGoals] = useLocalStorage<CareerGoal[]>(LOCAL_STORAGE_KEYS.careerGoals, []);
  const [title, setTitle] = useState("");
  const visibleGoals = sortCareerGoals(goals).filter((goal) => goal.status !== "archived");

  function addGoal() {
    if (!title.trim()) return;
    setGoals((current) => [createCareerGoal(title), ...current]);
    setTitle("");
    toast.success("Goal added");
  }

  function updateGoal(id: string, patch: Partial<CareerGoal>) {
    setGoals((current) => current.map((goal) => goal.id === id ? { ...goal, ...patch, updatedAt: new Date().toISOString() } : goal));
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

      {visibleGoals.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center"><Target className="mx-auto mb-3 h-9 w-9 text-gray-600" /><p className="text-sm text-gray-400">Add your first goal to start tracking outcomes.</p></div>
      ) : (
        <div className="space-y-3">
          {visibleGoals.map((goal) => (
            <article key={goal.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="grid gap-2 md:grid-cols-3">
                <input value={goal.title} maxLength={140} onChange={(event) => updateGoal(goal.id, { title: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                <select value={goal.status} onChange={(event) => updateGoal(goal.id, { status: event.target.value as CareerGoalStatus })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{CAREER_GOAL_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                <select value={goal.horizon} onChange={(event) => updateGoal(goal.id, { horizon: event.target.value as CareerGoal["horizon"] })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">{CAREER_GOAL_HORIZONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${careerGoalProgress(goal)}%` }} /></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
