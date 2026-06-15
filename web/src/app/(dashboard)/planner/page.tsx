"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Archive, CalendarDays, CheckCircle2, Circle, Clock3, Download, ExternalLink, ListChecks, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  createPlannerTask,
  mergePlannerTasks,
  isPlannerTaskDueSoon,
  isPlannerTaskOverdue,
  plannerCompletionRate,
  plannerCompletedThisWeek,
  plannerOpenMinutes,
  plannerTaskSummary,
  PLANNER_TEMPLATES,
  sortPlannerTasks,
  updatePlannerTaskStatus,
  type PlannerCategory,
  type PlannerPriority,
  type PlannerStatus,
  type PlannerTask,
} from "@/lib/career-planner";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: Array<{ value: PlannerStatus; label: string }> = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export default function PlannerPage() {
  const [tasks, setTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlannerStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<PlannerPriority | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<PlannerCategory | "all">("all");
  const [showArchived, setShowArchived] = useState(false);

  const visibleTasks = useMemo(() => sortPlannerTasks(tasks).filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    if (categoryFilter !== "all" && (task.category || "other") !== categoryFilter) return false;
    if (!showArchived && task.archived) return false;
    const query = search.trim().toLowerCase();
    return !query || `${task.title} ${task.notes}`.toLowerCase().includes(query);
  }), [categoryFilter, priorityFilter, search, showArchived, statusFilter, tasks]);

  const completionRate = plannerCompletionRate(tasks);
  const overdueCount = tasks.filter((task) => isPlannerTaskOverdue(task)).length;
  const dueSoonCount = tasks.filter((task) => isPlannerTaskDueSoon(task)).length;
  const openMinutes = plannerOpenMinutes(tasks);
  const completedThisWeek = plannerCompletedThisWeek(tasks);
  const summary = sortPlannerTasks(tasks).map(plannerTaskSummary).join("\n\n");

  function addTask(taskTitle = title) {
    if (!taskTitle.trim()) return;
    setTasks((current) => [createPlannerTask(taskTitle), ...current]);
    setTitle("");
    toast.success("Action added");
  }

  function updateTask(id: string, patch: Partial<PlannerTask>) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  }

  function setTaskStatus(id: string, status: PlannerStatus) {
    setTasks((current) => current.map((task) => task.id === id ? updatePlannerTaskStatus(task, status) : task));
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function clearPlannerFilters() {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
  }

  function clearCompletedTasks() {
    setTasks((current) => current.filter((task) => task.status !== "done"));
    toast.success("Completed actions cleared");
  }

  function archiveCompletedTasks() {
    setTasks((current) => current.map((task) => task.status === "done" ? { ...task, archived: true } : task));
    toast.success("Completed actions archived");
  }

  function addStarterPlan() {
    setTasks((current) => [...PLANNER_TEMPLATES.map(createPlannerTask), ...current]);
    toast.success("Starter plan added");
  }

  function duplicateTask(task: PlannerTask) {
    setTasks((current) => [{ ...task, id: crypto.randomUUID(), title: `${task.title} copy`, createdAt: new Date().toISOString(), completedAt: null, status: "todo" }, ...current]);
  }

  async function importPlanner(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { tasks?: PlannerTask[] } | PlannerTask[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.tasks || [];
      setTasks((current) => mergePlannerTasks(current, incoming));
      toast.success(`${incoming.length} planner actions imported`);
    } catch {
      toast.error("Could not import planner actions");
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Career Action Planner</h2>
        <p className="mt-1 text-sm text-gray-400">Keep the next important career actions visible and moving.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          ["Actions", tasks.length],
          ["Completed", `${completionRate}%`],
          ["Due soon", dueSoonCount],
          ["Overdue", overdueCount],
          ["Done this week", completedThisWeek],
          ["Open effort", `${Math.floor(openMinutes / 60)}h ${openMinutes % 60}m`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-800" aria-label={`Planner completion ${completionRate}%`}>
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} />
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input
            value={title}
            maxLength={180}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") addTask(); }}
            placeholder="Add your next career action"
            className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
          />
          <button onClick={() => addTask()} disabled={!title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-40">
            <Plus className="h-4 w-4" />
            Add action
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={addStarterPlan} className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-medium text-blue-300">Add full starter plan</button>
          {PLANNER_TEMPLATES.map((template) => (
            <button key={template} onClick={() => addTask(template)} className="rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:border-gray-600 hover:text-white">
              + {template}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={clearPlannerFilters} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Clear filters</button>
        <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className={cn("rounded-xl border px-3 text-sm font-medium", showArchived ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-gray-700 text-gray-300")}>Archived</button>
        <button onClick={clearCompletedTasks} disabled={!tasks.some((task) => task.status === "done")} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Clear completed</button>
        <button onClick={archiveCompletedTasks} disabled={!tasks.some((task) => task.status === "done" && !task.archived)} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">Archive completed</button>
        <label className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search actions" className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" />
        </label>
        <select aria-label="Filter planner by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PlannerStatus | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-white">
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select aria-label="Filter planner by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PlannerPriority | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-white">
          <option value="all">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
        <select aria-label="Filter planner by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as PlannerCategory | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-white">
          <option value="all">All categories</option>
          {["resume", "interview", "networking", "learning", "application", "other"].map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <CopyButton value={summary || "No career actions yet"} label="Copy plan" className="rounded-xl px-3" />
        <button onClick={() => downloadJson("careerpilot-action-plan.json", { exported_at: new Date().toISOString(), tasks })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 transition hover:bg-gray-900 hover:text-white">
          <Download className="h-4 w-4" /> JSON
        </button>
        <button onClick={() => downloadCsv("careerpilot-action-plan.csv", visibleTasks.map((task) => ({ title: task.title, status: task.status, priority: task.priority, due_date: task.dueDate, notes: task.notes })))} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 transition hover:bg-gray-900 hover:text-white">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      {visibleTasks.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center">
          <ListChecks className="mx-auto mb-3 h-9 w-9 text-gray-600" />
          <p className="text-sm text-gray-400">{tasks.length ? "No actions match these filters." : "Add your first career action to start the plan."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <article key={task.id} className={cn("rounded-2xl border bg-gray-900 p-4", isPlannerTaskOverdue(task) ? "border-rose-500/40" : "border-gray-800")}>
              <div className="flex items-start gap-3">
                <button onClick={() => setTaskStatus(task.id, task.status === "done" ? "todo" : "done")} aria-label={task.status === "done" ? `Mark ${task.title} incomplete` : `Complete ${task.title}`} className="mt-1 text-gray-500 transition hover:text-emerald-400">
                  {task.status === "done" ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="min-w-0 flex-1 space-y-3">
                  <input value={task.title} maxLength={180} onChange={(event) => updateTask(task.id, { title: event.target.value })} className={cn("w-full bg-transparent font-semibold text-white outline-none", task.status === "done" && "text-gray-500 line-through")} />
                  <textarea value={task.notes} maxLength={1000} onChange={(event) => updateTask(task.id, { notes: event.target.value })} placeholder="Notes, links, or the next concrete step" rows={2} className="w-full resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
                  <input type="url" value={task.resourceUrl || ""} onChange={(event) => updateTask(task.id, { resourceUrl: event.target.value })} placeholder="Resource URL" className="w-full rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
                  {task.resourceUrl && <a href={task.resourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"><ExternalLink className="h-3.5 w-3.5" />Open resource</a>}
                  <div className="flex flex-wrap gap-2">
                    <select aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => setTaskStatus(task.id, event.target.value as PlannerStatus)} className="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-300">
                      {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <select aria-label={`Priority for ${task.title}`} value={task.priority} onChange={(event) => updateTask(task.id, { priority: event.target.value as PlannerPriority })} className="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-300">
                      <option value="high">High priority</option>
                      <option value="medium">Medium priority</option>
                      <option value="low">Low priority</option>
                    </select>
                    <select aria-label={`Category for ${task.title}`} value={task.category || "other"} onChange={(event) => updateTask(task.id, { category: event.target.value as PlannerCategory })} className="rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs capitalize text-gray-300">
                      {["resume", "interview", "networking", "learning", "application", "other"].map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <label className="inline-flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      <input type="number" min={5} max={480} step={5} aria-label={`Estimated minutes for ${task.title}`} value={task.estimateMinutes || 30} onChange={(event) => updateTask(task.id, { estimateMinutes: Number(event.target.value) })} className="w-12 bg-transparent text-gray-300 outline-none" />
                      min
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-2.5 py-1.5 text-xs text-gray-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <input type="date" aria-label={`Due date for ${task.title}`} value={task.dueDate} onChange={(event) => updateTask(task.id, { dueDate: event.target.value })} className="bg-transparent text-gray-300 outline-none" />
                    </label>
                    {isPlannerTaskDueSoon(task) && !isPlannerTaskOverdue(task) && <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-300"><CalendarDays className="h-3.5 w-3.5" />Due soon</span>}
                    {isPlannerTaskOverdue(task) && <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300"><Clock3 className="h-3.5 w-3.5" />Overdue</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => duplicateTask(task)} aria-label={`Duplicate ${task.title}`} className="text-gray-600 transition hover:text-blue-400"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => updateTask(task.id, { archived: !task.archived })} aria-label={task.archived ? `Restore ${task.title}` : `Archive ${task.title}`} className="text-gray-600 transition hover:text-blue-400"><Archive className="h-4 w-4" /></button>
                  <button onClick={() => removeTask(task.id)} aria-label={`Delete ${task.title}`} className="text-gray-600 transition hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
