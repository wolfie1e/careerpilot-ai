"use client";

import { useMemo, useState } from "react";
import { Archive, BriefcaseBusiness, CalendarClock, Download, ExternalLink, Mail, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  APPLICATION_STAGES,
  applicationActiveCount,
  applicationInterviewRate,
  applicationPipelineText,
  applicationResponseRate,
  applicationStageCounts,
  applicationsThisMonth,
  createJobApplication,
  isApplicationFollowUpDue,
  sortApplications,
  updateApplicationStage,
  type ApplicationStage,
  type JobApplication,
} from "@/lib/application-tracker";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import { cn } from "@/lib/utils";

export default function ApplicationsPage() {
  const [applications, setApplications] = useLocalStorage<JobApplication[]>(LOCAL_STORAGE_KEYS.jobApplications, []);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<ApplicationStage | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<JobApplication["priority"] | "all">("all");

  const visibleApplications = useMemo(() => sortApplications(applications).filter((application) => {
    if (stageFilter !== "all" && application.stage !== stageFilter) return false;
    if (favoritesOnly && !application.favorite) return false;
    if (!showArchived && application.archived) return false;
    if (priorityFilter !== "all" && (application.priority || "medium") !== priorityFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${application.company} ${application.role} ${application.location} ${application.notes}`.toLowerCase().includes(query);
  }), [applications, favoritesOnly, priorityFilter, search, showArchived, stageFilter]);

  const stageCounts = applicationStageCounts(applications);
  const followUpCount = applications.filter((application) => isApplicationFollowUpDue(application)).length;
  const followUpApplications = applications.filter((application) => application.followUpAt);

  function addApplication() {
    if (!company.trim() || !role.trim()) {
      toast.error("Add both company and role");
      return;
    }
    setApplications((current) => [createJobApplication(company, role), ...current]);
    setCompany("");
    setRole("");
    toast.success("Opportunity added");
  }

  function updateApplication(id: string, patch: Partial<JobApplication>) {
    setApplications((current) => current.map((application) => application.id === id ? { ...application, ...patch, updatedAt: new Date().toISOString() } : application));
  }

  function setStage(id: string, stage: ApplicationStage) {
    setApplications((current) => current.map((application) => application.id === id ? updateApplicationStage(application, stage) : application));
  }

  function removeApplication(id: string) {
    setApplications((current) => current.filter((application) => application.id !== id));
  }

  function duplicateApplication(application: JobApplication) {
    setApplications((current) => [{ ...createJobApplication(application.company, application.role), location: application.location, url: application.url, salary: application.salary, source: application.source || "", employmentType: application.employmentType || "", notes: application.notes }, ...current]);
    toast.success("Opportunity duplicated");
  }

  function scheduleFollowUp(id: string) {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    updateApplication(id, { followUpAt: date.toISOString().slice(0, 10) });
    toast.success("Follow-up scheduled for one week");
  }

  function markApplied(id: string) {
    setStage(id, "applied");
    toast.success("Application marked as applied");
  }

  function clearApplicationFilters() {
    setSearch("");
    setStageFilter("all");
    setFavoritesOnly(false);
    setShowArchived(false);
    setPriorityFilter("all");
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Application Pipeline</h2>
        <p className="mt-1 text-sm text-gray-400">Track every opportunity, conversation, and follow-up in one place.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Active", applicationActiveCount(applications)],
          ["This month", applicationsThisMonth(applications)],
          ["Response rate", `${applicationResponseRate(applications)}%`],
          ["Interview rate", `${applicationInterviewRate(applications)}%`],
          ["Follow-ups due", followUpCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="mt-1 text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input value={company} maxLength={120} onChange={(event) => setCompany(event.target.value)} placeholder="Company" className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <input value={role} maxLength={160} onChange={(event) => setRole(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addApplication(); }} placeholder="Role" className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addApplication} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">
            <Plus className="h-4 w-4" />Add opportunity
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {APPLICATION_STAGES.map((stage) => (
          <button key={stage.value} onClick={() => setStageFilter(stageFilter === stage.value ? "all" : stage.value)} aria-pressed={stageFilter === stage.value} className={cn("rounded-xl border p-3 text-left transition", stageFilter === stage.value ? "border-blue-500 bg-blue-500/10" : "border-gray-800 bg-gray-900 hover:border-gray-700")}>
            <div className="text-xs text-gray-500">{stage.label}</div>
            <div className="mt-1 text-lg font-bold text-white">{stageCounts[stage.value]}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={clearApplicationFilters} className="rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white">Clear filters</button>
        <button onClick={() => setFavoritesOnly((value) => !value)} aria-pressed={favoritesOnly} className={cn("inline-flex items-center gap-2 rounded-xl border px-3 text-sm font-medium", favoritesOnly ? "border-amber-500/50 bg-amber-500/10 text-amber-300" : "border-gray-700 text-gray-300")}><Star className="h-4 w-4" />Favorites</button>
        <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className={cn("rounded-xl border px-3 text-sm font-medium", showArchived ? "border-blue-500/50 bg-blue-500/10 text-blue-300" : "border-gray-700 text-gray-300")}>Archived</button>
        <select aria-label="Filter applications by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as JobApplication["priority"] | "all")} className="rounded-xl border border-gray-700 bg-gray-900 px-3 text-sm text-gray-300"><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select>
        <label className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, role, location, or notes" className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" />
        </label>
        <CopyButton value={applicationPipelineText(visibleApplications) || "No applications yet"} label="Copy pipeline" className="rounded-xl px-3" />
        <button onClick={() => downloadJson("careerpilot-applications.json", { exported_at: new Date().toISOString(), applications })} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Download className="h-4 w-4" />JSON</button>
        <button onClick={() => downloadCsv("careerpilot-applications.csv", visibleApplications.map((application) => ({ company: application.company, role: application.role, stage: application.stage, location: application.location, salary: application.salary, applied_at: application.appliedAt, follow_up_at: application.followUpAt, contact: application.contactName, contact_email: application.contactEmail, url: application.url, notes: application.notes })))} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><Download className="h-4 w-4" />CSV</button>
        <button onClick={() => downloadCsv("careerpilot-application-follow-ups.csv", followUpApplications.map((application) => ({ company: application.company, role: application.role, stage: application.stage, follow_up_at: application.followUpAt, contact: application.contactName, email: application.contactEmail })))} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 text-sm font-medium text-gray-300 hover:text-white"><CalendarClock className="h-4 w-4" />Follow-ups</button>
      </div>

      {visibleApplications.length === 0 ? (
        <div role="status" className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/70 p-12 text-center">
          <BriefcaseBusiness className="mx-auto mb-3 h-9 w-9 text-gray-600" />
          <p className="text-sm text-gray-400">{applications.length ? "No opportunities match these filters." : "Add your first opportunity to start tracking the pipeline."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleApplications.map((application) => (
            <article key={application.id} className={cn("rounded-2xl border bg-gray-900 p-5", isApplicationFollowUpDue(application) ? "border-amber-500/50" : "border-gray-800")}>
              <div className="flex items-start gap-3">
                <button onClick={() => updateApplication(application.id, { favorite: !application.favorite })} aria-pressed={Boolean(application.favorite)} aria-label={application.favorite ? `Remove ${application.company} from favorites` : `Favorite ${application.company}`} className="text-gray-600 transition hover:text-amber-400">
                  <Star className={cn("h-4 w-4", application.favorite && "fill-amber-400 text-amber-400")} />
                </button>
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input value={application.company} maxLength={120} onChange={(event) => updateApplication(application.id, { company: event.target.value })} className="bg-transparent text-base font-semibold text-white outline-none" />
                    <input value={application.role} maxLength={160} onChange={(event) => updateApplication(application.id, { role: event.target.value })} className="bg-transparent text-sm font-medium text-gray-300 outline-none sm:text-right" />
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <select aria-label={`Stage for ${application.company}`} value={application.stage} onChange={(event) => setStage(application.id, event.target.value as ApplicationStage)} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
                      {APPLICATION_STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
                    </select>
                    <input value={application.location} maxLength={120} onChange={(event) => updateApplication(application.id, { location: event.target.value })} placeholder="Location / remote" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <input value={application.salary} maxLength={120} onChange={(event) => updateApplication(application.id, { salary: event.target.value })} placeholder="Compensation" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <input type="date" aria-label={`Application date for ${application.company}`} value={application.appliedAt} onChange={(event) => updateApplication(application.id, { appliedAt: event.target.value })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input value={application.source || ""} maxLength={120} onChange={(event) => updateApplication(application.id, { source: event.target.value })} placeholder="Source (referral, board...)" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <input value={application.employmentType || ""} maxLength={80} onChange={(event) => updateApplication(application.id, { employmentType: event.target.value })} placeholder="Employment type" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <select aria-label={`Priority for ${application.company}`} value={application.priority || "medium"} onChange={(event) => updateApplication(application.id, { priority: event.target.value as JobApplication["priority"] })} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
                      <option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option>
                    </select>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input value={application.contactName} maxLength={120} onChange={(event) => updateApplication(application.id, { contactName: event.target.value })} placeholder="Contact name" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <input type="email" value={application.contactEmail} maxLength={254} onChange={(event) => updateApplication(application.id, { contactEmail: event.target.value })} placeholder="Contact email" className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                    <label className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-500">
                      <CalendarClock className="h-3.5 w-3.5" />
                      <input type="date" aria-label={`Follow-up date for ${application.company}`} value={application.followUpAt} onChange={(event) => updateApplication(application.id, { followUpAt: event.target.value })} className="min-w-0 flex-1 bg-transparent text-gray-300 outline-none" />
                    </label>
                  </div>
                  <input type="url" value={application.url} maxLength={2048} onChange={(event) => updateApplication(application.id, { url: event.target.value })} placeholder="Job posting URL" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300 outline-none" />
                  <textarea value={application.notes} maxLength={2000} onChange={(event) => updateApplication(application.id, { notes: event.target.value })} rows={2} placeholder="Notes, interview details, or next step" className="w-full resize-none rounded-xl border border-gray-800 bg-gray-950/50 px-3 py-2 text-sm text-gray-300 outline-none focus:border-blue-500" />
                  <div className="flex flex-wrap gap-3 text-xs">
                    {isApplicationFollowUpDue(application) && <span className="font-semibold text-amber-300">Follow-up due</span>}
                    {!application.followUpAt && <button onClick={() => scheduleFollowUp(application.id)} className="font-medium text-amber-400 hover:text-amber-300">Schedule 7-day follow-up</button>}
                    {application.stage === "saved" && <button onClick={() => markApplied(application.id)} className="font-medium text-emerald-400 hover:text-emerald-300">Mark applied</button>}
                    {application.url && <a href={application.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-400 hover:text-blue-300"><ExternalLink className="h-3.5 w-3.5" />Open posting</a>}
                    {application.contactEmail && <a href={`mailto:${application.contactEmail}`} className="inline-flex items-center gap-1 font-medium text-violet-400 hover:text-violet-300"><Mail className="h-3.5 w-3.5" />Email contact</a>}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => duplicateApplication(application)} aria-label={`Duplicate ${application.company}`} className="text-gray-600 transition hover:text-emerald-400"><Plus className="h-4 w-4" /></button>
                  <button onClick={() => updateApplication(application.id, { archived: !application.archived })} aria-label={application.archived ? `Restore ${application.company}` : `Archive ${application.company}`} className="text-gray-600 transition hover:text-blue-400"><Archive className="h-4 w-4" /></button>
                  <button onClick={() => removeApplication(application.id)} aria-label={`Delete ${application.company} ${application.role}`} className="text-gray-600 transition hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
