"use client";

import { useMemo } from "react";
import { Command } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import {
  buildCommandCenterActions,
  commandCenterPriorityCounts,
  commandCenterSourceCounts,
  filterCommandCenterActions,
  type CommandCenterPreferences,
  type CommandCenterPriority,
  type CommandCenterSource,
  DEFAULT_COMMAND_CENTER_PREFERENCES,
} from "@/lib/command-center";
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
  const [plannerTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
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
        <div className="rounded-xl border border-gray-800 px-3 py-2.5 text-sm text-gray-500">
          Showing {visibleActions.length} actions
        </div>
      </div>
    </div>
  );
}
