"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, CheckCircle, Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn, scoreColor } from "@/lib/utils";

const PROGRESS_STEPS = [
  "Parsing job description…",
  "Matching skills and computing semantic similarity…",
  "Generating learning roadmap…",
];

function MatchingProgress() {
  const [step, setStep] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1));
    }, 2200);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="space-y-2 py-4">
      {PROGRESS_STEPS.map((label, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
          className="flex items-center gap-3">
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all",
            i < step ? "bg-emerald-500/20" : i === step ? "bg-blue-500/20" : "bg-gray-800")}>
            {i < step ? (
              <CheckCircle className="w-3 h-3 text-emerald-400" />
            ) : i === step ? (
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            )}
          </div>
          <span className={cn("text-sm transition-colors",
            i < step ? "text-gray-500 line-through" : i === step ? "text-white" : "text-gray-600")}>
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

interface MatchResult {
  match_id: string;
  overall_score: number;
  semantic_score: number;
  keyword_score: number;
  skills_matched: string[];
  skills_missing: string[];
  skills_critical: string[];
  learning_roadmap: Array<{
    skill: string;
    priority: string;
    why_it_matters: string;
    resources: string[];
    project_idea: string;
    weeks_to_learn: number;
  }>;
}

interface JDMatcherProps {
  resumeId: string;
  onMatchResult?: (result: MatchResult) => void;
}

export default function JDMatcher({ resumeId, onMatchResult }: JDMatcherProps) {
  const [jdText, setJdText] = useState("");
  const [jdTitle, setJdTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [expandedRoadmap, setExpandedRoadmap] = useState<string | null>(null);

  async function handleMatch() {
    if (!jdText.trim()) { toast.error("Paste a job description first"); return; }
    setLoading(true);
    try {
      const data = await api.post<MatchResult>("/resume/matcher", {
        resume_id: resumeId,
        jd_text: jdText,
        jd_title: jdTitle || undefined,
      });
      setResult(data);
      onMatchResult?.(data);
      toast.success("Match analysis complete!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* JD Input */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
        <input
          type="text"
          value={jdTitle}
          onChange={(e) => setJdTitle(e.target.value)}
          placeholder="Job title (optional — e.g. Senior Backend Engineer)"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all"
        />
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here…"
          rows={8}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none transition-all"
        />
        <button
          onClick={handleMatch}
          disabled={loading || !jdText.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white font-semibold rounded-xl transition-all text-sm"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</> : <><Target className="w-4 h-4" />Match Resume to JD</>}
        </button>
        {loading && <MatchingProgress />}
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Score summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Overall Match", value: `${result.overall_score}%`, color: scoreColor(result.overall_score) },
                { label: "Semantic Similarity", value: `${Math.round(result.semantic_score * 100)}%`, color: "text-blue-400" },
                { label: "Keyword Match", value: `${result.keyword_score}%`, color: "text-violet-400" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
                  <div className={cn("text-2xl font-extrabold mb-0.5", s.color)}>{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-emerald-400 mb-3">
                  Matched Skills <span className="text-gray-500 font-normal">({result.skills_matched.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.skills_matched.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">{s}</span>
                  ))}
                  {result.skills_matched.length === 0 && <span className="text-xs text-gray-500">None detected</span>}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-amber-400 mb-3">
                  Missing Skills <span className="text-gray-500 font-normal">({result.skills_missing.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.skills_critical.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-medium">
                      ★ {s}
                    </span>
                  ))}
                  {result.skills_missing.filter((s) => !result.skills_critical.includes(s)).map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">{s}</span>
                  ))}
                  {result.skills_missing.length === 0 && <span className="text-xs text-emerald-400">Great match — no missing skills!</span>}
                </div>
                {result.skills_critical.length > 0 && (
                  <p className="text-xs text-rose-400 mt-2">★ = Critical (mentioned multiple times in JD)</p>
                )}
              </div>
            </div>

            {/* Learning roadmap */}
            {result.learning_roadmap.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-blue-400 mb-4">Learning Roadmap</h4>
                <div className="space-y-2">
                  {result.learning_roadmap.map((item) => (
                    <div key={item.skill} className="border border-gray-800 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedRoadmap(expandedRoadmap === item.skill ? null : item.skill)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium border",
                            item.priority === "critical" ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : item.priority === "high" ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          )}>
                            {item.priority}
                          </span>
                          <span className="text-sm font-medium text-white capitalize">{item.skill}</span>
                          <span className="text-xs text-gray-500">{item.weeks_to_learn}w</span>
                        </div>
                        {expandedRoadmap === item.skill ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>
                      <AnimatePresence>
                        {expandedRoadmap === item.skill && (
                          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                            className="overflow-hidden border-t border-gray-800">
                            <div className="px-4 py-3 space-y-3 text-sm">
                              <p className="text-gray-300">{item.why_it_matters}</p>
                              {item.project_idea && (
                                <p className="text-blue-300 italic">💡 Project idea: {item.project_idea}</p>
                              )}
                              {item.resources?.length > 0 && (
                                <div>
                                  <span className="text-xs text-gray-500 uppercase tracking-wide">Resources</span>
                                  <ul className="mt-1 space-y-1">
                                    {item.resources.map((r, i) => (
                                      <li key={i} className="text-xs text-gray-400 flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3 shrink-0" />{r}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
