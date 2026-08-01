"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Command, Download, EyeOff, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  activeCommandCenterSnoozes,
  commandActionPlannerTag,
  buildCommandCenterActions,
  commandActionToPlannerTask,
  commandCenterDueLabel,
  commandCenterMarkdownReport,
  commandCenterPlanningRows,
  commandCenterRows,
  commandCenterPriorityCounts,
  commandCenterPriorityRows,
  commandCenterQueueHealth,
  commandCenterSourceCounts,
  commandCenterSourceRows,
  commandCenterSourceSummaries,
  commandCenterSummaryText,
  commandCenterTodayKey,
  filterCommandCenterActions,
  isCommandActionPlanned,
  normalizeCommandCenterPreferences,
  plannedCommandActionCount,
  pruneCommandCenterPreferences,
  staleCommandCenterPauseCount,
  topCommandCenterActions,
  type CommandCenterPreferences,
  type CommandCenterPriority,
  type CommandCenterSource,
  DEFAULT_COMMAND_CENTER_PREFERENCES,
} from "@/lib/command-center";
import { downloadCsv, downloadJson, downloadMarkdown } from "@/lib/export-utils";
import type { PlannerTask } from "@/lib/career-planner";
import type { JobApplication } from "@/lib/application-tracker";
import type { NetworkingContact } from "@/lib/networking";
import type { MentorshipContact } from "@/lib/mentorship";
import type { CareerGoal } from "@/lib/career-goals";
import type { LearningResource } from "@/lib/learning-path";
import type { TargetCompany } from "@/lib/target-companies";
import type { ProfessionalReference } from "@/lib/professional-references";
import type { QuestionBankItem } from "@/lib/question-bank";
import type { PortfolioProject } from "@/lib/portfolio-projects";
import type { OfferComparison } from "@/lib/offer-tracker";
import type { CertificationRecord } from "@/lib/certification-tracker";

export default function CommandCenterPage() {
  const [plannerTasks, setPlannerTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
  const [applications] = useLocalStorage<JobApplication[]>(LOCAL_STORAGE_KEYS.jobApplications, []);
  const [networkingContacts] = useLocalStorage<NetworkingContact[]>(LOCAL_STORAGE_KEYS.networkingContacts, []);
  const [mentorshipContacts] = useLocalStorage<MentorshipContact[]>(LOCAL_STORAGE_KEYS.mentorshipContacts, []);
  const [careerGoals] = useLocalStorage<CareerGoal[]>(LOCAL_STORAGE_KEYS.careerGoals, []);
  const [learningResources] = useLocalStorage<LearningResource[]>(LOCAL_STORAGE_KEYS.learningResources, []);
  const [targetCompanies] = useLocalStorage<TargetCompany[]>(LOCAL_STORAGE_KEYS.targetCompanies, []);
  const [professionalReferences] = useLocalStorage<ProfessionalReference[]>(LOCAL_STORAGE_KEYS.professionalReferences, []);
  const [questionBank] = useLocalStorage<QuestionBankItem[]>(LOCAL_STORAGE_KEYS.interviewQuestionBank, []);
  const [portfolioProjects] = useLocalStorage<PortfolioProject[]>(LOCAL_STORAGE_KEYS.portfolioProjects, []);
  const [offers] = useLocalStorage<OfferComparison[]>(LOCAL_STORAGE_KEYS.offerComparisons, []);
  const [certifications] = useLocalStorage<CertificationRecord[]>(LOCAL_STORAGE_KEYS.certificationRecords, []);
  const [preferences, setPreferences] = useLocalStorage<CommandCenterPreferences>(LOCAL_STORAGE_KEYS.commandCenterPreferences, DEFAULT_COMMAND_CENTER_PREFERENCES);
  const normalizedPreferences = useMemo(() => normalizeCommandCenterPreferences(preferences), [preferences]);

  const actions = useMemo(() => buildCommandCenterActions({
    plannerTasks,
    applications,
    networkingContacts,
    mentorshipContacts,
    careerGoals,
    learningResources,
    targetCompanies,
    professionalReferences,
    questionBank,
    portfolioProjects,
    offers,
    certifications,
  }), [applications, careerGoals, certifications, learningResources, mentorshipContacts, networkingContacts, offers, plannerTasks, portfolioProjects, professionalReferences, questionBank, targetCompanies]);
  const priorityCounts = commandCenterPriorityCounts(actions);
  const sourceCounts = commandCenterSourceCounts(actions);
  const activeSources = Object.keys(sourceCounts).length;
  const activeSnoozes = activeCommandCenterSnoozes(normalizedPreferences);
  const pausedActionCount = normalizedPreferences.hiddenActionIds.length + activeSnoozes.length;
  const stalePausedActionCount = staleCommandCenterPauseCount(normalizedPreferences, actions);
  const plannedActionCount = plannedCommandActionCount(actions, plannerTasks);
  const plannedActionIds = useMemo(() => new Set(actions.filter((action) => isCommandActionPlanned(action, plannerTasks)).map((action) => action.id)), [actions, plannerTasks]);
  const visibleActions = filterCommandCenterActions(actions, normalizedPreferences);
  const focusActions = topCommandCenterActions(visibleActions, 5);
  const sourceSummaries = commandCenterSourceSummaries(visibleActions, plannerTasks);
  const queueHealth = commandCenterQueueHealth(actions, visibleActions, normalizedPreferences, plannerTasks);

  function updatePreferences(updater: (current: CommandCenterPreferences) => CommandCenterPreferences) {
    setPreferences((current) => updater(normalizeCommandCenterPreferences(current)));
  }

  function addActionToPlanner(actionId: string) {
    const action = actions.find((item) => item.id === actionId);
    if (!action) return;
    if (isCommandActionPlanned(action, plannerTasks)) {
      toast.info("This command action is already in the planner");
      return;
    }
    setPlannerTasks((current) => [commandActionToPlannerTask(action), ...current]);
    toast.success("Command action added to planner");
  }

  function addFocusActionsToPlanner() {
    const existingTags = new Set(plannerTasks.flatMap((task) => task.archived || task.status === "done" ? [] : task.tags));
    const newTasks = focusActions
      .filter((action) => !existingTags.has(commandActionPlannerTag(action)))
      .map(commandActionToPlannerTask);
    if (!newTasks.length) {
      toast.info("Top command actions are already planned");
      return;
    }
    setPlannerTasks((current) => [...newTasks, ...current]);
    toast.success(`${newTasks.length} focus actions added to planner`);
  }

  function hideAction(actionId: string) {
    updatePreferences((current) => ({
      ...current,
      hiddenActionIds: Array.from(new Set([...current.hiddenActionIds, actionId])),
    }));
    toast.success("Command action hidden");
  }

  function snoozeAction(actionId: string) {
    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + 3);
    const snoozedUntilKey = commandCenterTodayKey(snoozedUntil);
    updatePreferences((current) => ({
      ...current,
      snoozedUntilById: {
        ...current.snoozedUntilById,
        [actionId]: snoozedUntilKey,
      },
    }));
    toast.success(`Command action snoozed until ${snoozedUntilKey}`);
  }

  function restorePausedActions() {
    if (!pausedActionCount) return;
    updatePreferences((current) => ({
      ...current,
      hiddenActionIds: [],
      snoozedUntilById: {},
    }));
    toast.success("Paused command actions restored");
  }

  function cleanPausedActions() {
    if (!stalePausedActionCount) return;
    setPreferences((current) => pruneCommandCenterPreferences(current, actions));
    toast.success("Stale command pauses cleaned");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Command className="h-5 w-5 text-blue-400" />
          Command Center
        </h2>
        <p className="mt-1 text-sm text-gray-400">One prioritized queue for the next career actions across every tracker.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        {[
          ["Total", actions.length],
          ["Visible", visibleActions.length],
          ["Critical", priorityCounts.critical],
          ["High", priorityCounts.high],
          ["Planned", plannedActionCount],
          ["Paused", pausedActionCount],
          ["Sources", activeSources],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Queue health</h3>
            <p className="mt-1 text-xs text-gray-500">{queueHealth.urgent} urgent · {queueHealth.unplanned} unplanned · {queueHealth.paused} paused</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{queueHealth.plannerCoverage}%</div>
            <div className="text-xs text-gray-500">planned</div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-800">
          <div className="h-full rounded-full bg-emerald-400" style={{ width: `${queueHealth.plannerCoverage}%` }} />
        </div>
        <div className="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-3">
          <span>{queueHealth.visible} visible of {queueHealth.total}</span>
          <span>{plannedActionCount} active planner links</span>
          <span>{pausedActionCount} actions paused from the view</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            value={normalizedPreferences.query}
            onChange={(event) => updatePreferences((current) => ({ ...current, query: event.target.value }))}
            placeholder="Search command actions"
            className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
          />
        </label>
        <select
          aria-label="Filter command actions by source"
          value={normalizedPreferences.source}
          onChange={(event) => updatePreferences((current) => ({ ...current, source: event.target.value as CommandCenterSource | "all" }))}
          className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300"
        >
          <option value="all">All sources</option>
          {Object.keys(sourceCounts).sort().map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
        <select
          aria-label="Filter command actions by priority"
          value={normalizedPreferences.priority}
          onChange={(event) => updatePreferences((current) => ({ ...current, priority: event.target.value as CommandCenterPriority | "all" }))}
          className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300"
        >
          <option value="all">All priorities</option>
          {(["critical", "high", "medium", "low"] as const).map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <button
          onClick={() => updatePreferences((current) => ({ ...current, showLowPriority: !current.showLowPriority }))}
          className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"
        >
          {normalizedPreferences.showLowPriority ? "Hide low priority" : "Show low priority"}
        </button>
        <button onClick={() => setPreferences(DEFAULT_COMMAND_CENTER_PREFERENCES)} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          Reset filters
        </button>
        <CopyButton value={commandCenterSummaryText(visibleActions) || "No command actions"} label="Copy queue" className="rounded-xl px-3" />
        <button onClick={() => downloadJson("careerpilot-command-center.json", {
          exported_at: new Date().toISOString(),
          counts: {
            total: actions.length,
            visible: visibleActions.length,
            planned: plannedActionCount,
            paused: pausedActionCount,
          },
          preferences: normalizedPreferences,
          actions: visibleActions,
        })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Download className="h-4 w-4" />
          JSON
        </button>
        <button onClick={() => downloadCsv("careerpilot-command-center.csv", commandCenterRows(visibleActions))} disabled={!visibleActions.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          CSV
        </button>
        <button onClick={() => downloadCsv("careerpilot-command-center-priorities.csv", commandCenterPriorityRows(visibleActions))} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Download className="h-4 w-4" />
          Priorities
        </button>
        <button onClick={() => downloadCsv("careerpilot-command-center-sources.csv", commandCenterSourceRows(visibleActions))} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Download className="h-4 w-4" />
          Sources
        </button>
        <button onClick={() => downloadCsv("careerpilot-command-center-planning.csv", commandCenterPlanningRows(visibleActions, plannerTasks))} disabled={!visibleActions.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          Planning
        </button>
        <button onClick={() => downloadMarkdown("careerpilot-command-center.md", commandCenterMarkdownReport(visibleActions, { preferences: normalizedPreferences, plannerTasks }))} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Download className="h-4 w-4" />
          Markdown
        </button>
        <div className="rounded-xl border border-gray-800 px-3 py-2.5 text-sm text-gray-500">
          Showing {visibleActions.length} actions
        </div>
      </div>

      {pausedActionCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div>
            <p className="text-sm font-medium text-amber-100">{pausedActionCount} paused actions</p>
            <p className="text-xs text-amber-200/70">{normalizedPreferences.hiddenActionIds.length} hidden · {activeSnoozes.length} snoozed{stalePausedActionCount ? ` · ${stalePausedActionCount} stale` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stalePausedActionCount > 0 && (
              <button onClick={cleanPausedActions} className="rounded-xl border border-amber-300/30 px-3 py-2 text-sm font-medium text-amber-100 hover:border-amber-200/60">
                Clean stale
              </button>
            )}
            <button onClick={restorePausedActions} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 px-3 py-2 text-sm font-medium text-amber-100 hover:border-amber-200/60">
              <RotateCcw className="h-4 w-4" />
              Restore paused
            </button>
          </div>
        </div>
      )}

      {focusActions.length > 0 && (
        <div className="rounded-2xl border border-blue-800/50 bg-blue-950/20 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-blue-100">Focus next</h3>
            <button onClick={addFocusActionsToPlanner} className="rounded-lg border border-blue-400/30 px-3 py-1.5 text-xs font-medium text-blue-100 hover:border-blue-300/60">
              Add all to planner
            </button>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            {focusActions.map((action) => {
              const planned = plannedActionIds.has(action.id);
              return (
                <button
                  key={action.id}
                  onClick={() => addActionToPlanner(action.id)}
                  disabled={planned}
                  className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-left text-xs text-blue-100 hover:border-blue-400/40 disabled:opacity-50"
                >
                  <div className="font-semibold">{action.title}</div>
                  <div className="mt-1 text-blue-200/70">{action.source} · {planned ? "planned" : action.priority}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(sourceCounts).length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="text-sm font-semibold text-white">Source breakdown</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {sourceSummaries.map((summary) => (
              <button
                key={summary.source}
                onClick={() => updatePreferences((current) => ({ ...current, source: summary.source }))}
                className={`rounded-xl border p-3 text-left text-xs transition ${
                  normalizedPreferences.source === summary.source
                    ? "border-blue-400/60 bg-blue-500/10 text-blue-100"
                    : "border-gray-800 bg-gray-950/50 text-gray-300 hover:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{summary.source}</span>
                  <span className="rounded-full bg-gray-800 px-2 py-0.5 text-gray-400">{summary.actions}</span>
                </div>
                <div className="mt-2 text-gray-500">
                  {summary.critical} critical · {summary.high} high · {summary.planned} planned
                </div>
                <div className="mt-1 text-gray-500">Top priority: {summary.topPriority}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {visibleActions.length === 0 && (
          <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center">
            <Command className="mx-auto mb-3 h-9 w-9 text-gray-600" />
            <p className="text-sm text-gray-400">No command actions match this view.</p>
          </div>
        )}
        {visibleActions.slice(0, 25).map((action) => {
          const planned = plannedActionIds.has(action.id);
          const dueLabel = commandCenterDueLabel(action);
          return (
            <article key={action.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300">{action.source}</span>
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">{action.priority}</span>
                    {action.dueDate && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">{dueLabel}</span>}
                    {planned && <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">Planned</span>}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">{action.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{action.detail}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => addActionToPlanner(action.id)}
                    disabled={planned}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50"
                  >
                    {planned ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {planned ? "Planned" : "Planner"}
                  </button>
                  <button onClick={() => snoozeAction(action.id)} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white">
                    <Clock3 className="h-4 w-4" />
                    Snooze
                  </button>
                  <button onClick={() => hideAction(action.id)} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white">
                    <EyeOff className="h-4 w-4" />
                    Hide
                  </button>
                  <Link href={action.href} className="rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white">
                    Open
                  </Link>
                </div>
              </div>
              {action.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {action.tags.slice(0, 8).map((tag) => <span key={tag} className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-500">{tag}</span>)}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
