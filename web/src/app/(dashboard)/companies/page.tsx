"use client";

import { useState, type ChangeEvent } from "react";
import { Archive, Building2, Download, ExternalLink, Plus, Search, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/shared/CopyButton";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { PlannerTask } from "@/lib/career-planner";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import {
  COMPANY_PRIORITIES, COMPANY_STAGES, companyAverageFit, companyAverageInterest, companyContactTotal, companyOpenRoleTotal, companyPlanText, companyReadinessScore, companyResearchCompletion,
  companyIndustryCounts, companyLocationCounts, companyPriorityCounts, companyStageCounts, companyTagCounts, createTargetCompany, isCompanyActionDue, mergeTargetCompanies,
  sortTargetCompanies, isCompanyActionSoon, topTargetCompany, type CompanyPriority, type CompanyStage, type TargetCompany,
} from "@/lib/target-companies";

export default function CompaniesPage() {
  const [companies, setCompanies] = useLocalStorage<TargetCompany[]>(LOCAL_STORAGE_KEYS.targetCompanies, []);
  const [plannerTasks, setPlannerTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<CompanyStage | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<CompanyPriority | "all">("all");
  const [showArchived, setShowArchived] = useState(false);

  const visibleCompanies = sortTargetCompanies(companies).filter((company) => {
    if (!showArchived && company.stage === "archived") return false;
    if (stageFilter !== "all" && company.stage !== stageFilter) return false;
    if (priorityFilter !== "all" && company.priority !== priorityFilter) return false;
    const query = search.trim().toLowerCase();
    return !query || `${company.name} ${company.industry} ${company.location} ${company.targetRole} ${company.cultureNotes} ${company.researchNotes} ${company.tags.join(" ")}`.toLowerCase().includes(query);
  });
  const activeCompanies = companies.filter((company) => company.stage !== "archived");
  const stageRows = Object.entries(companyStageCounts(visibleCompanies));
  const priorityRows = Object.entries(companyPriorityCounts(visibleCompanies));
  const tagRows = Object.entries(companyTagCounts(visibleCompanies)).sort((a, b) => b[1] - a[1]);
  const industryRows = Object.entries(companyIndustryCounts(visibleCompanies)).sort((a, b) => b[1] - a[1]);
  const locationRows = Object.entries(companyLocationCounts(visibleCompanies)).sort((a, b) => b[1] - a[1]);
  const topCompany = topTargetCompany(companies);

  function addCompany() {
    if (!name.trim()) return;
    setCompanies((current) => [createTargetCompany(name), ...current]);
    setName("");
    toast.success("Target company added");
  }

  function updateCompany(id: string, patch: Partial<TargetCompany>) {
    setCompanies((current) => current.map((company) => company.id === id ? { ...company, ...patch, updatedAt: new Date().toISOString() } : company));
  }

  function removeCompany(id: string) {
    setCompanies((current) => current.filter((company) => company.id !== id));
    toast.success("Target company deleted");
  }

  function duplicateCompany(company: TargetCompany) {
    const now = new Date().toISOString();
    setCompanies((current) => [{ ...company, id: crypto.randomUUID(), name: `${company.name} copy`, createdAt: now, updatedAt: now }, ...current]);
    toast.success("Target company duplicated");
  }

  function addToPlanner(company: TargetCompany) {
    const task: PlannerTask = {
      id: crypto.randomUUID(), title: company.nextAction || `Research ${company.name}`,
      notes: `Created from target companies.${company.targetRole ? ` Target role: ${company.targetRole}.` : ""}`,
      priority: company.priority, category: "application", estimateMinutes: 45,
      resourceUrl: company.careersUrl || company.website, status: "todo", dueDate: company.nextActionDate,
      createdAt: new Date().toISOString(), completedAt: null, archived: false,
      tags: ["target-company", ...company.tags.slice(0, 5)], recurrence: "none",
    };
    setPlannerTasks([task, ...plannerTasks]);
    toast.success("Company action added to planner");
  }

  async function importCompanies(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { companies?: TargetCompany[] } | TargetCompany[];
      const incoming = Array.isArray(parsed) ? parsed : parsed.companies || [];
      setCompanies((current) => mergeTargetCompanies(current, incoming));
      toast.success(`${incoming.length} companies imported`);
    } catch { toast.error("Could not import target companies"); }
  }

  function resetFilters() { setSearch(""); setStageFilter("all"); setPriorityFilter("all"); setShowArchived(false); }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Target Companies</h2>
        <p className="mt-1 text-sm text-gray-400">Build a focused company shortlist and turn research into deliberate action.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        {[
          ["Active", activeCompanies.length],
          ["Ready", companies.filter((company) => company.stage === "ready").length],
          ["Actions due", companies.filter((company) => isCompanyActionDue(company)).length],
          ["Open roles", companyOpenRoleTotal(companies)],
          ["Contacts", companyContactTotal(companies)],
          ["Average fit", `${companyAverageFit(companies)}/10`],
          ["Avg interest", `${companyAverageInterest(companies)}/10`],
        ].map(([label, value]) => <div key={label} className="rounded-lg border border-gray-800 bg-gray-900 p-4"><div className="text-xs text-gray-500">{label}</div><div className="mt-1 text-xl font-bold text-white">{value}</div></div>)}
      </div>

      {topCompany && <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-4 text-sm text-emerald-100">Strongest current target: <span className="font-semibold">{topCompany.name}</span> with fit {topCompany.fitScore}/10 and interest {topCompany.interestScore}/10.</div>}

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
        <div className="flex gap-2">
          <input value={name} maxLength={140} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addCompany(); }} placeholder="Add a company to research" className="min-w-0 flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button onClick={addCompany} disabled={!name.trim()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><Plus className="h-4 w-4" />Add</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select aria-label="Filter companies by stage" value={stageFilter} onChange={(event) => setStageFilter(event.target.value as CompanyStage | "all")} className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300"><option value="all">All stages</option>{COMPANY_STAGES.filter((item) => item.value !== "archived").map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select aria-label="Filter companies by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as CompanyPriority | "all")} className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-300"><option value="all">All priorities</option>{COMPANY_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <label className="relative min-w-64 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search companies, roles, notes, or tags" className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500" /></label>
        <button onClick={() => setShowArchived((value) => !value)} aria-pressed={showArchived} className="rounded-lg border border-gray-700 px-3 text-sm text-gray-300">Archived</button>
        <button onClick={resetFilters} className="rounded-lg border border-gray-700 px-3 text-sm text-gray-300">Reset</button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 px-3 text-sm text-gray-300"><Upload className="h-4 w-4" />Import<input type="file" accept=".json,application/json" onChange={importCompanies} className="sr-only" /></label>
        <CopyButton value={companyPlanText(visibleCompanies) || "No target companies yet"} label="Copy plan" className="rounded-lg px-3" />
        <button onClick={() => downloadJson("careerpilot-target-companies.json", { companies })} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 text-sm text-gray-300"><Download className="h-4 w-4" />JSON</button>
        <button onClick={() => downloadCsv("careerpilot-target-companies.csv", visibleCompanies.map((company) => ({ name: company.name, industry: company.industry, location: company.location, stage: company.stage, priority: company.priority, fit_score: company.fitScore, interest_score: company.interestScore, target_role: company.targetRole, open_roles: company.openRoles, contacts: company.contactCount, next_action: company.nextAction, next_action_date: company.nextActionDate, tags: company.tags.join(", ") })))} className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3 text-sm text-gray-300"><Download className="h-4 w-4" />CSV</button>
      </div>

      {visibleCompanies.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 py-14 text-center"><Building2 className="mx-auto h-8 w-8 text-gray-600" /><p className="mt-3 text-sm text-gray-400">No companies match this view.</p></div>
      ) : <div className="space-y-4">{visibleCompanies.map((company) => (
        <article key={company.id} className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><button onClick={() => updateCompany(company.id, { favorite: !company.favorite })} title={company.favorite ? "Remove favorite" : "Favorite company"} className={company.favorite ? "text-amber-400" : "text-gray-600"}><Star className="h-4 w-4" fill={company.favorite ? "currentColor" : "none"} /></button><input value={company.name} onChange={(event) => updateCompany(company.id, { name: event.target.value })} className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none" /></div></div>
            <div className="flex items-center gap-2">
              {(company.careersUrl || company.website) && <a href={company.careersUrl || company.website} target="_blank" rel="noreferrer" title="Open company careers page" className="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white"><ExternalLink className="h-4 w-4" /></a>}
              <button onClick={() => duplicateCompany(company)} className="rounded-md px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-800">Duplicate</button>
              <button onClick={() => updateCompany(company.id, { stage: "archived" })} title="Archive company" className="rounded-md p-2 text-gray-400 hover:bg-gray-800"><Archive className="h-4 w-4" /></button>
              <button onClick={() => removeCompany(company.id)} title="Delete company" className="rounded-md p-2 text-gray-500 hover:bg-red-950 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs text-gray-500">Stage<select value={company.stage} onChange={(event) => updateCompany(company.id, { stage: event.target.value as CompanyStage })} className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">{COMPANY_STAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="text-xs text-gray-500">Priority<select value={company.priority} onChange={(event) => updateCompany(company.id, { priority: event.target.value as CompanyPriority })} className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">{COMPANY_PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="text-xs text-gray-500">Industry<input value={company.industry} onChange={(event) => updateCompany(company.id, { industry: event.target.value })} className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Location<input value={company.location} onChange={(event) => updateCompany(company.id, { location: event.target.value })} className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Target role<input value={company.targetRole} onChange={(event) => updateCompany(company.id, { targetRole: event.target.value })} className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Open roles<input type="number" min="0" value={company.openRoles} onChange={(event) => updateCompany(company.id, { openRoles: Number(event.target.value) })} className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Known contacts<input type="number" min="0" value={company.contactCount} onChange={(event) => updateCompany(company.id, { contactCount: Number(event.target.value) })} className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Next action date<input type="date" value={company.nextActionDate} onChange={(event) => updateCompany(company.id, { nextActionDate: event.target.value })} className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <label className="text-xs text-gray-500">Website<input type="url" value={company.website} onChange={(event) => updateCompany(company.id, { website: event.target.value })} placeholder="https://" className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Careers URL<input type="url" value={company.careersUrl} onChange={(event) => updateCompany(company.id, { careersUrl: event.target.value })} placeholder="https://" className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Next action<input value={company.nextAction} onChange={(event) => updateCompany(company.id, { nextAction: event.target.value })} placeholder="Research team, request intro, review roles..." className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Tags<input value={company.tags.join(", ")} onChange={(event) => updateCompany(company.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="remote, fintech, series-b" className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Culture notes<textarea rows={3} value={company.cultureNotes} onChange={(event) => updateCompany(company.id, { cultureNotes: event.target.value })} className="mt-1 block w-full resize-y rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
            <label className="text-xs text-gray-500">Research notes<textarea rows={3} value={company.researchNotes} onChange={(event) => updateCompany(company.id, { researchNotes: event.target.value })} className="mt-1 block w-full resize-y rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" /></label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-800 pt-4">
            <span className="text-xs text-gray-500">Research <span className="text-white">{companyResearchCompletion(company)}%</span></span>
            <span className="text-xs text-gray-500">Readiness <span className="text-white">{companyReadinessScore(company)}%</span></span>
            <label className="text-xs text-gray-500">Fit <input type="range" min="1" max="10" value={company.fitScore} onChange={(event) => updateCompany(company.id, { fitScore: Number(event.target.value) })} className="mx-2 align-middle" /><span className="text-white">{company.fitScore}/10</span></label>
            <label className="text-xs text-gray-500">Interest <input type="range" min="1" max="10" value={company.interestScore} onChange={(event) => updateCompany(company.id, { interestScore: Number(event.target.value) })} className="mx-2 align-middle" /><span className="text-white">{company.interestScore}/10</span></label>
            {isCompanyActionDue(company) && <span className="rounded-full bg-amber-950 px-2.5 py-1 text-xs text-amber-300">Action due</span>}
            {!isCompanyActionDue(company) && isCompanyActionSoon(company) && <span className="rounded-full bg-blue-950 px-2.5 py-1 text-xs text-blue-300">Due this week</span>}
            <button onClick={() => addToPlanner(company)} className="ml-auto rounded-md border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white">Add action to planner</button>
          </div>
        </article>
      ))}</div>}

      {(stageRows.some(([, count]) => count > 0) || tagRows.length > 0) && <div className="grid gap-4 md:grid-cols-2"><div className="rounded-lg border border-gray-800 bg-gray-900 p-5"><h3 className="text-sm font-semibold text-white">Pipeline stages</h3><div className="mt-3 space-y-2">{stageRows.filter(([, count]) => count > 0).map(([stage, count]) => <div key={stage} className="flex justify-between text-sm text-gray-400"><span>{COMPANY_STAGES.find((item) => item.value === stage)?.label}</span><span className="text-white">{count}</span></div>)}</div></div><div className="rounded-lg border border-gray-800 bg-gray-900 p-5"><h3 className="text-sm font-semibold text-white">Research themes</h3><div className="mt-3 flex flex-wrap gap-2">{tagRows.slice(0, 12).map(([tag, count]) => <span key={tag} className="rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300">{tag} · {count}</span>)}</div></div></div>}
      {priorityRows.some(([, count]) => count > 0) && <div className="text-xs capitalize text-gray-500">Priorities: {priorityRows.map(([priority, count]) => priority + " " + count).join(" · ")}</div>}
      {industryRows.length > 0 && <div className="text-xs text-gray-500">Top industries: {industryRows.slice(0, 5).map(([industry, count]) => industry + " (" + count + ")").join(" · ")}</div>}
      {locationRows.length > 0 && <div className="text-xs text-gray-500">Top locations: {locationRows.slice(0, 5).map(([location, count]) => location + " (" + count + ")").join(" · ")}</div>}
    </div>
  );
}
