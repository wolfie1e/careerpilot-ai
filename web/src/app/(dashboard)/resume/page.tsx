"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Zap, Loader2, CheckCircle, AlertCircle, Lightbulb, ChevronDown, Plus } from "lucide-react";
import ResumeDropzone from "@/components/resume/ResumeDropzone";
import ATSScorePanel from "@/components/resume/ATSScorePanel";
import JDMatcher from "@/components/resume/JDMatcher";
import BulletRewriter from "@/components/resume/BulletRewriter";
import SectionImprover from "@/components/resume/SectionImprover";
import ProjectRecommendations from "@/components/resume/ProjectRecommendations";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn, scoreColor, formatRelativeTime } from "@/lib/utils";

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
}

interface MatchResult {
  skills_missing: string[];
  skills_critical: string[];
}

interface ResumeListItem {
  id: string;
  filename: string;
  file_type: string;
  created_at: string;
}

type Tab = "analysis" | "ats" | "jd" | "rewrite" | "improve" | "projects";

const TABS: { id: Tab; label: string }[] = [
  { id: "analysis", label: "Analysis" },
  { id: "ats", label: "ATS Score" },
  { id: "jd", label: "JD Match" },
  { id: "rewrite", label: "Rewrite Bullets" },
  { id: "improve", label: "Improve Section" },
  { id: "projects", label: "Projects" },
];

export default function ResumePage() {
  const [pastResumes, setPastResumes] = useState<ResumeListItem[]>([]);
  const [showDropzone, setShowDropzone] = useState(false);
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    api.get<ResumeListItem[]>("/resume")
      .then((data) => {
        setPastResumes(data);
        if (data.length === 0) setShowDropzone(true);
      })
      .catch(() => setShowDropzone(true));
  }, []);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("analysis");
  const [lastMatch, setLastMatch] = useState<MatchResult | null>(null);

  async function handleAnalyze() {
    if (!resume) return;
    setAnalyzing(true);
    try {
      const data = await api.post<AnalysisData>(`/resume/${resume.id}/analyze`);
      setAnalysis(data);
      toast.success("Analysis complete!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  const showTabs = resume !== null;

  function handleUploaded(r: ResumeData) {
    setResume(r);
    setAnalysis(null);
    setShowDropzone(false);
    setPastResumes((prev) => [{ id: r.id, filename: r.filename, file_type: "pdf", created_at: new Date().toISOString() }, ...prev.filter((p) => p.id !== r.id)]);
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
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />My Resumes
            </h3>
            <button onClick={() => { setShowDropzone(true); setResume(null); setAnalysis(null); }}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              <Plus className="w-3 h-3" />Upload New
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {pastResumes.map((r) => (
              <button key={r.id} onClick={() => { setResume({ id: r.id, filename: r.filename, parsed_sections: {} }); setAnalysis(null); }}
                className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-all",
                  resume?.id === r.id ? "bg-blue-600/20 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
                )}>
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[140px]">{r.filename}</span>
                <span className="text-xs text-gray-600">{formatRelativeTime(r.created_at)}</span>
              </button>
            ))}
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
                onClick={() => setActiveTab(tab.id)}
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

          {/* Analysis tab */}
          {activeTab === "analysis" && analysis && (
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
                <div className="text-4xl font-extrabold mb-1" style={{ color: analysis.overall_score >= 80 ? "#10b981" : analysis.overall_score >= 60 ? "#f59e0b" : "#ef4444" }}>
                  {analysis.overall_score}
                </div>
                <div className="text-sm text-gray-400">Resume Score</div>
                <div className="mt-4 space-y-2">
                  {Object.entries(analysis.section_scores || {}).map(([sec, score]) => (
                    <div key={sec} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 capitalize">{sec}</span>
                      <span className={cn("font-medium", scoreColor(score))}>{score}</span>
                    </div>
                  ))}
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
                  <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4" />Priority Improvements</h4>
                  <div className="space-y-2">
                    {analysis.suggestions?.filter((s) => s.priority === "high").map((s, i) => (
                      <div key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="shrink-0 px-1.5 py-0.5 text-xs bg-rose-500/20 text-rose-400 rounded font-medium">HIGH</span>{s.message}
                      </div>
                    ))}
                    {analysis.suggestions?.filter((s) => s.priority !== "high").slice(0, 3).map((s, i) => (
                      <div key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="shrink-0 px-1.5 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded font-medium capitalize">{s.priority}</span>{s.message}
                      </div>
                    ))}
                  </div>
                </div>
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
