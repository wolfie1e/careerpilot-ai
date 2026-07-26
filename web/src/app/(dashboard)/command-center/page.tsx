"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Command, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  buildCommandCenterActions,
  commandActionToPlannerTask,
  commandCenterRows,
  commandCenterPriorityCounts,
  commandCenterSourceCounts,
  commandCenterSummaryText,
  filterCommandCenterActions,
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
  const visibleActions = filterCommandCenterActions(actions, preferences);

  function addActionToPlanner(actionId: string) {
    const action = actions.find((item) => item.id === actionId);
    if (!action) return;
    setPlannerTasks((current) => [commandActionToPlannerTask(action), ...current]);
    toast.success("Command action added to planner");
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          ["Total", actions.length],
          ["Critical", priorityCounts.critical],
          ["High", priorityCounts.high],
          ["Medium", priorityCounts.medium],
          ["Low", priorityCounts.low],
          ["Sources", activeSources],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Filter command actions by source"
          value={preferences.source}
          onChange={(event) => setPreferences((current) => ({ ...current, source: event.target.value as CommandCenterSource | "all" }))}
          className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300"
        >
          <option value="all">All sources</option>
          {Object.keys(sourceCounts).sort().map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
        <select
          aria-label="Filter command actions by priority"
          value={preferences.priority}
          onChange={(event) => setPreferences((current) => ({ ...current, priority: event.target.value as CommandCenterPriority | "all" }))}
          className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300"
        >
          <option value="all">All priorities</option>
          {(["critical", "high", "medium", "low"] as const).map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <button
          onClick={() => setPreferences((current) => ({ ...current, showLowPriority: !current.showLowPriority }))}
          className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"
        >
          {preferences.showLowPriority ? "Hide low priority" : "Show low priority"}
        </button>
        <button onClick={() => setPreferences(DEFAULT_COMMAND_CENTER_PREFERENCES)} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          Reset filters
        </button>
        <CopyButton value={commandCenterSummaryText(visibleActions) || "No command actions"} label="Copy queue" className="rounded-xl px-3" />
        <button onClick={() => downloadJson("careerpilot-command-center.json", { exported_at: new Date().toISOString(), actions: visibleActions })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Download className="h-4 w-4" />
          JSON
        </button>
        <button onClick={() => downloadCsv("careerpilot-command-center.csv", commandCenterRows(visibleActions))} disabled={!visibleActions.length} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-40">
          <Download className="h-4 w-4" />
          CSV
        </button>
        <button onClick={() => downloadMarkdown("careerpilot-command-center.md", `# CareerPilot Command Center\n\n${commandCenterSummaryText(visibleActions) || "No command actions."}`)} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">
          <Download className="h-4 w-4" />
          Markdown
        </button>
        <div className="rounded-xl border border-gray-800 px-3 py-2.5 text-sm text-gray-500">
          Showing {visibleActions.length} actions
        </div>
      </div>

      <div className="space-y-3">
        {visibleActions.length === 0 && (
          <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center">
            <Command className="mx-auto mb-3 h-9 w-9 text-gray-600" />
            <p className="text-sm text-gray-400">No command actions match this view.</p>
          </div>
        )}
        {visibleActions.slice(0, 25).map((action) => (
          <article key={action.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-300">{action.source}</span>
                  <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">{action.priority}</span>
                  {action.dueDate && <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">{action.dueDate}</span>}
                </div>
                <h3 className="mt-3 text-base font-semibold text-white">{action.title}</h3>
                <p className="mt-1 text-sm text-gray-400">{action.detail}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => addActionToPlanner(action.id)} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white">
                  <Plus className="h-4 w-4" />
                  Planner
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
        ))}
      </div>
    </div>
  );
}
