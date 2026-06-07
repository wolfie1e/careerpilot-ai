"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, FileText, Zap, Loader2, CheckCircle, AlertCircle, Lightbulb, Plus, Trash2, Star, Target, PenLine, Wrench, Search, RotateCcw, Download } from "lucide-react";
import ResumeDropzone from "@/components/resume/ResumeDropzone";
import ATSScorePanel from "@/components/resume/ATSScorePanel";
import JDMatcher from "@/components/resume/JDMatcher";
import BulletRewriter from "@/components/resume/BulletRewriter";
import SectionImprover from "@/components/resume/SectionImprover";
import ProjectRecommendations from "@/components/resume/ProjectRecommendations";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { cn, scoreColor, formatRelativeTime, formatBytes, formatDelta } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { downloadJson } from "@/lib/export-utils";

interface ResumeData {
  id: string;
  filename: string;
  parsed_sections: Record<string, unknown>;
}

interface AnalysisData {
  overall_score: number;
  section_scores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  suggestions: Array<{ section: string; type: string; message: string; priority: string }>;
  ats_score: number;
  ats_breakdown: Record<string, number>;
  created_at?: string;
}

interface MatchResult {
  skills_missing: string[];
  skills_critical: string[];
}

interface ResumeListItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

type Tab = "analysis" | "ats" | "jd" | "rewrite" | "improve" | "projects";
type SuggestionPriority = "all" | "high" | "medium" | "low";
type ResumeManagerView = { search: string; sort: string };
const DEFAULT_RESUME_MANAGER_VIEW: ResumeManagerView = { search: "", sort: "newest" };

const TABS: { id: Tab; label: string }[] = [
  { id: "analysis", label: "Analysis" },
  { id: "ats", label: "ATS Score" },
  { id: "jd", label: "JD Match" },
  { id: "rewrite", label: "Rewrite Bullets" },
  { id: "improve", label: "Improve Section" },
  { id: "projects", label: "Projects" },
];
const ANALYSIS_ACTIONS: Array<{ tab: Tab; label: string; desc: string; icon: typeof Target }> = [
  { tab: "ats", label: "Review ATS breakdown", desc: "Inspect category scores and formatting risks.", icon: CheckCircle },
  { tab: "jd", label: "Match a target job", desc: "Compare this resume against a real posting.", icon: Target },
  { tab: "rewrite", label: "Rewrite weak bullets", desc: "Turn duties into measurable achievements.", icon: PenLine },
  { tab: "improve", label: "Improve a section", desc: "Refresh summary, experience, or projects.", icon: Wrench },
];
const TAB_IDS = TABS.map((tab) => tab.id);

function isResumeTab(value: string | null): value is Tab {
  return TAB_IDS.includes(value as Tab);
}

function deltaTone(delta: string) {
  if (delta.startsWith("+")) return "text-emerald-400";
  if (delta.startsWith("-")) return "text-rose-400";
  return "text-gray-500";
}

function suggestionBadgeClass(priority: string) {
  if (priority === "high") return "bg-rose-500/20 text-rose-400";
  if (priority === "medium") return "bg-amber-500/20 text-amber-400";
  return "bg-blue-500/20 text-blue-400";
}

export default function ResumePage() {
  const [pastResumes, setPastResumes] = useState<ResumeListItem[]>([]);
  const [showDropzone, setShowDropzone] = useState(false);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);
  const [resumeManagerView, setResumeManagerView] = useLocalStorage<ResumeManagerView>(LOCAL_STORAGE_KEYS.resumeManagerView, DEFAULT_RESUME_MANAGER_VIEW);
  const [pinnedResumeId, setPinnedResumeId] = useLocalStorage<string | null>(LOCAL_STORAGE_KEYS.pinnedResume, null);

  useEffect(() => {
    api.get<ResumeListItem[]>("/resume")
      .then((data) => {
        setPastResumes(data);
        if (data.length === 0) setShowDropzone(true);
      })
      .catch(() => setShowDropzone(true));
  }, []);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisData[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "analysis";
    const tab = new URLSearchParams(window.location.search).get("tab");
    return isResumeTab(tab) ? tab : "analysis";
  });
  const [lastMatch, setLastMatch] = useState<MatchResult | null>(null);
  const [suggestionPriority, setSuggestionPriority] = useState<SuggestionPriority>("all");

  function setResumeTab(tab: Tab) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  async function loadAnalysisHistory(resumeId: string) {
    try {
      const data = await api.get<AnalysisData[]>(`/resume/${resumeId}/analyses`);
      setAnalysisHistory(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch { /* silent */ }
    return [];
  }

  async function selectPastResume(r: ResumeListItem) {
    setResume({ id: r.id, filename: r.filename, parsed_sections: {} });
    setAnalysis(null);
    const history = await loadAnalysisHistory(r.id);
    if (history.length > 0) {
      setAnalysis(history[0]);
    } else if (activeTab === "ats") {
      setResumeTab("analysis");
    }
  }

  async function handleAnalyze() {
    if (!resume) return;
    setAnalyzing(true);
    try {
      const data = await api.post<AnalysisData>(`/resume/${resume.id}/analyze`);
      setAnalysis(data);
      loadAnalysisHistory(resume.id);
      toast.success("Analysis complete!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function deleteResume(resumeId: string) {
    if (!window.confirm("Delete this resume from your workspace?")) return;
    setDeletingResumeId(resumeId);
    try {
      await api.delete(`/resume/${resumeId}`);
      setPastResumes((prev) => prev.filter((r) => r.id !== resumeId));
      if (resume?.id === resumeId) {
        setResume(null);
        setAnalysis(null);
        setAnalysisHistory([]);
        setShowDropzone(true);
      }
      toast.success("Resume deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete resume");
    } finally {
      setDeletingResumeId(null);
    }
  }

  const showTabs = resume !== null;
  const orderedResumes = [...pastResumes].sort((a, b) => {
    if (a.id === pinnedResumeId) return -1;
    if (b.id === pinnedResumeId) return 1;
    if (resumeManagerView.sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (resumeManagerView.sort === "name") return a.filename.localeCompare(b.filename);
    if (resumeManagerView.sort === "size_desc") return (b.file_size ?? 0) - (a.file_size ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const visibleResumes = orderedResumes.filter((item) => (
    item.filename.toLowerCase().includes(resumeManagerView.search.trim().toLowerCase())
  ));
  const previousAnalysis = analysis
    ? analysisHistory.find((item) => analysis.created_at && item.created_at && item.created_at < analysis.created_at)
      ?? (analysisHistory.length > 1 ? analysisHistory[1] : null)
    : null;
  const overallDelta = analysis && previousAnalysis ? formatDelta(analysis.overall_score, previousAnalysis.overall_score) : null;
  const visibleSuggestions = analysis?.suggestions?.filter((suggestion) => (
    suggestionPriority === "all" || suggestion.priority === suggestionPriority
  )) ?? [];

  function handleUploaded(r: ResumeData) {
    setResume(r);
    setAnalysis(null);
    setShowDropzone(false);
    setPastResumes((prev) => [{ id: r.id, filename: r.filename, file_type: "pdf", file_size: null, created_at: new Date().toISOString() }, ...prev.filter((p) => p.id !== r.id)]);
  }

  function exportVisibleResumes() {
    downloadJson("careerpilot-visible-resumes.json", {
      exported_at: new Date().toISOString(),
      search: resumeManagerView.search,
      sort: resumeManagerView.sort,
      pinned_resume_id: pinnedResumeId,
      resumes: visibleResumes,
    });
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Resume Manager</h2>
        <p className="text-sm text-gray-400">Upload your resume to get your ATS score, section feedback, and improvement plan</p>
      </div>

      {/* Resume history switcher */}
      {pastResumes.length > 0 && !showDropzone && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />My Resumes
            </h3>
            <div className="flex items-center gap-3">
              <button onClick={() => { setShowDropzone(true); setResume(null); setAnalysis(null); setResumeTab("analysis"); }}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <Plus className="w-3 h-3" />Upload New
              </button>
              <button onClick={exportVisibleResumes}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
                <Download className="w-3 h-3" />Export list
              </button>
            </div>
          </div>
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <input
                value={resumeManagerView.search}
                onChange={(e) => setResumeManagerView((view) => ({ ...view, search: e.target.value }))}
                placeholder="Search resumes..."
                className="w-full rounded-xl border border-gray-800 bg-gray-950/60 py-2.5 pl-9 pr-20 text-sm text-white outline-none transition focus:border-blue-500"
              />
              {resumeManagerView.search && (
                <button
                  onClick={() => setResumeManagerView((view) => ({ ...view, search: "" }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 transition hover:text-white"
                >
                  Clear
                </button>
              )}
            </label>
            <label className="relative block">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <select
                value={resumeManagerView.sort}
                onChange={(e) => setResumeManagerView((view) => ({ ...view, sort: e.target.value }))}
                className="w-full appearance-none rounded-xl border border-gray-800 bg-gray-950/60 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name A-Z</option>
                <option value="size_desc">Largest</option>
              </select>
            </label>
          </div>
          {(resumeManagerView.search || resumeManagerView.sort !== DEFAULT_RESUME_MANAGER_VIEW.sort) && (
            <button
              onClick={() => setResumeManagerView(DEFAULT_RESUME_MANAGER_VIEW)}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset resume view
            </button>
          )}
          <div className="flex flex-wrap gap-2">
            {visibleResumes.map((r) => (
              <div key={r.id} className={cn("flex items-center rounded-xl border transition-all",
                resume?.id === r.id ? "bg-blue-600/20 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600",
                pinnedResumeId === r.id && "border-amber-500/50"
              )}>
                <button
                  onClick={() => setPinnedResumeId(pinnedResumeId === r.id ? null : r.id)}
                  className="pl-2 text-gray-600 transition hover:text-amber-400"
                  title={pinnedResumeId === r.id ? "Unpin primary resume" : "Pin primary resume"}
                >
                  <Star className={cn("h-3.5 w-3.5", pinnedResumeId === r.id && "fill-amber-400 text-amber-400")} />
                </button>
                <button onClick={() => selectPastResume(r)} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[140px]">{r.filename}</span>
                  {pinnedResumeId === r.id && <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">Primary</span>}
                  <span className="text-xs text-gray-600">{formatRelativeTime(r.created_at)} · {formatBytes(r.file_size)}</span>
                </button>
                <button
                  onClick={() => deleteResume(r.id)}
                  disabled={deletingResumeId === r.id}
                  className="border-l border-gray-700 px-2 py-2 text-gray-500 transition hover:text-rose-400 disabled:opacity-60"
                  title="Delete resume"
                >
                  {deletingResumeId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))}
            {visibleResumes.length === 0 && (
              <div className="w-full rounded-xl border border-dashed border-gray-800 px-4 py-6 text-center text-sm text-gray-500">
                No resumes match your search.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload */}
      {(showDropzone || pastResumes.length === 0) && (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="font-medium text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Upload Resume
        </h3>
        <ResumeDropzone onUploaded={handleUploaded} />

        {resume && !analysis && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all text-sm"
            >
              {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</> : <><Zap className="w-4 h-4" />Run Full Analysis</>}
            </button>
          </motion.div>
        )}
      </div>
      )}

      {/* Feature tabs — shown as soon as resume is uploaded */}
      {showTabs && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Tab bar */}
          <div className="flex flex-wrap gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setResumeTab(tab.id)}
                disabled={["analysis", "ats"].includes(tab.id) && !analysis}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                  activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {["analysis", "ats"].includes(activeTab) && !analysis && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
              <Zap className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white mb-1">No analysis yet</h3>
              <p className="text-sm text-gray-500 mb-4">Run a full analysis to unlock scoring, ATS feedback, and improvement suggestions.</p>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all text-sm"
              >
                {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Zap className="w-4 h-4" />Run Full Analysis</>}
              </button>
            </div>
          )}

          {/* Analysis tab */}
          {activeTab === "analysis" && analysis && (
            <>
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <div className="text-4xl font-extrabold mb-1" style={{ color: analysis.overall_score >= 80 ? "#10b981" : analysis.overall_score >= 60 ? "#f59e0b" : "#ef4444" }}>
                  {analysis.overall_score}
                </div>
                <div className="text-sm text-gray-400">Resume Score</div>
                {overallDelta && (
                  <div className={cn("mt-1 text-xs font-medium", deltaTone(overallDelta))}>
                    {overallDelta} since last scan
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  {Object.entries(analysis.section_scores || {}).map(([sec, score]) => {
                    const previousScore = previousAnalysis?.section_scores?.[sec] ?? null;
                    const sectionDelta = previousScore !== null ? formatDelta(score, previousScore) : null;
                    return (
                      <div key={sec} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-gray-500 capitalize">{sec}</span>
                        <span className="flex items-center gap-2">
                          {sectionDelta && <span className={cn("font-medium", deltaTone(sectionDelta))}>{sectionDelta}</span>}
                          <span className={cn("font-medium", scoreColor(score))}>{score}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
                <div className="lg:col-span-2 space-y-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4" />Strengths</h4>
                  <ul className="space-y-1.5">{analysis.strengths?.map((s, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-emerald-400 mt-0.5">•</span>{s}</li>)}</ul>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" />Weaknesses</h4>
                  <ul className="space-y-1.5">{analysis.weaknesses?.map((w, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-amber-400 mt-0.5">•</span>{w}</li>)}</ul>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2"><Lightbulb className="w-4 h-4" />Priority Improvements</h4>
                    <div className="flex rounded-lg border border-gray-800 bg-gray-950/60 p-0.5">
                      {(["all", "high", "medium", "low"] as SuggestionPriority[]).map((priority) => (
                        <button
                          key={priority}
                          onClick={() => setSuggestionPriority(priority)}
                          className={cn(
                            "rounded-md px-2 py-1 text-xs font-medium capitalize transition",
                            suggestionPriority === priority ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"
                          )}
                        >
                          {priority}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {visibleSuggestions.map((s, i) => (
                      <div key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className={cn("shrink-0 px-1.5 py-0.5 text-xs rounded font-medium uppercase", suggestionBadgeClass(s.priority))}>{s.priority}</span>{s.message}
                      </div>
                    ))}
                    {visibleSuggestions.length === 0 && (
                      <div className="text-sm text-gray-500">No suggestions in this priority.</div>
                    )}
                  </div>
                </div>
              </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-800 bg-gray-900 p-5">
                <h4 className="mb-3 text-sm font-semibold text-white">Next Resume Actions</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {ANALYSIS_ACTIONS.map((action) => (
                    <button
                      key={action.tab}
                      onClick={() => setResumeTab(action.tab)}
                      className="rounded-xl border border-gray-800 bg-gray-950/50 p-4 text-left transition hover:border-blue-700/60 hover:bg-gray-800/50"
                    >
                      <action.icon className="mb-3 h-4 w-4 text-blue-400" />
                      <div className="text-sm font-semibold text-white">{action.label}</div>
                      <div className="mt-1 text-xs leading-5 text-gray-500">{action.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Analysis history */}
          {activeTab === "analysis" && analysis && analysisHistory.length > 1 && (
            <div className="mt-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Analysis History</h4>
              <div className="flex flex-wrap gap-2">
                {analysisHistory.slice(0, 5).map((a, i) => (
                  <button key={i} onClick={() => setAnalysis(a)}
                    className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all",
                      analysis === a ? "bg-blue-600/20 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white")}>
                    <span className={scoreColor(a.overall_score)}>{a.overall_score}/100</span>
                    {a.created_at && <span className="text-gray-600">{new Date(a.created_at).toLocaleDateString()}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "ats" && analysis && (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <ATSScorePanel atsScore={analysis.ats_score} breakdown={analysis.ats_breakdown as any} />
          )}

          {activeTab === "jd" && resume && (
            <JDMatcher resumeId={resume.id} onMatchResult={setLastMatch} />
          )}

          {activeTab === "rewrite" && resume && (
            <BulletRewriter resumeId={resume.id} />
          )}

          {activeTab === "improve" && resume && (
            <SectionImprover resumeId={resume.id} parsedSections={resume.parsed_sections} />
          )}

          {activeTab === "projects" && resume && (
            <ProjectRecommendations
              resumeId={resume.id}
              missingSkills={lastMatch ? [...(lastMatch.skills_critical || []), ...(lastMatch.skills_missing || [])].slice(0, 8) : undefined}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}
