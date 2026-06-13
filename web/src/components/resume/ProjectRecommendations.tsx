"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderGit2, Loader2, Clock, ChevronDown, ChevronUp, Download, RotateCcw, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadCsv, downloadJson } from "@/lib/export-utils";

const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const DIFFICULTY_COLORS = {
  beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  advanced: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

interface Project {
  title: string;
  description: string;
  tech_stack: string[];
  skills_demonstrated: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_weeks: number;
  why_it_helps: string;
  resume_bullet: string;
}

interface ProjectRecommendationsProps {
  resumeId: string;
  missingSkills?: string[];
}

export default function ProjectRecommendations({ resumeId, missingSkills }: ProjectRecommendationsProps) {
  const [targetRole, setTargetRole] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const totalWeeks = projects.reduce((sum, project) => sum + project.estimated_weeks, 0);
  const averageWeeks = projects.length ? Math.round(totalWeeks / projects.length) : 0;
  const coveredSkills = new Set(projects.flatMap((project) => project.skills_demonstrated || [])).size;
  const projectPlanText = projects.map((project, index) => (
    `${index + 1}. ${project.title} (${project.difficulty}, ${project.estimated_weeks} weeks)\nStack: ${project.tech_stack.join(", ")}\nSkills: ${project.skills_demonstrated.join(", ")}`
  )).join("\n\n");

  async function handleGenerate() {
    if (!targetRole.trim()) { toast.error("Enter a target role"); return; }
    setLoading(true);
    try {
      const data = await api.post<Project[]>(`/resume/${resumeId}/projects`, {
        target_role: targetRole,
        missing_skills: missingSkills,
        level,
      });
      setProjects(Array.isArray(data) ? data : []);
      toast.success("Projects generated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function resetProjects() {
    setTargetRole("");
    setLevel("intermediate");
    setProjects([]);
    setExpanded([]);
  }

  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <input
          type="text"
          value={targetRole}
          maxLength={120}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="Target role (e.g. Backend Engineer, ML Engineer)"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all"
        />
        <div className="text-right text-xs text-gray-600">{targetRole.length}/120 characters</div>

        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">Experience level</label>
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={cn("px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border",
                  level === l ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                )}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {missingSkills && missingSkills.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1.5">Auto-targeting these missing skills:</div>
            <div className="flex flex-wrap gap-1.5">
              {missingSkills.slice(0, 8).map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={handleGenerate} disabled={loading || !targetRole.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/40 text-white font-semibold rounded-xl text-sm transition-all">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating…</> : <><FolderGit2 className="w-4 h-4" />Get Project Ideas</>}
          </button>
          <button onClick={resetProjects} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:text-white disabled:opacity-40">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <AnimatePresence>
        {projects.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Ideas", value: projects.length },
                { label: "Total weeks", value: totalWeeks },
                { label: "Skills covered", value: coveredSkills },
                { label: "Avg weeks", value: averageWeeks },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
                  <div className="text-lg font-bold text-white">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setProjects([]); setExpanded([]); }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white">
                <X className="h-3.5 w-3.5" />
                Clear results
              </button>
              <CopyButton value={projectPlanText} label="Copy build plan" />
              <CopyButton value={projects.map((project) => `• ${project.resume_bullet}`).join("\n")} label="Copy all bullets" />
              <button onClick={() => downloadJson("careerpilot-project-recommendations.json", { target_role: targetRole, level, projects })} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white">
                <Download className="h-3.5 w-3.5" />
                Export JSON
              </button>
              <button onClick={() => downloadCsv("careerpilot-project-recommendations.csv", projects.map((project) => ({ title: project.title, difficulty: project.difficulty, estimated_weeks: project.estimated_weeks, tech_stack: project.tech_stack.join(", "), skills: project.skills_demonstrated.join(", "), resume_bullet: project.resume_bullet })))} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </button>
              <button onClick={() => setExpanded(projects.map((project) => project.title))} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white">
                <ChevronDown className="h-3.5 w-3.5" />
                Expand all
              </button>
              <button onClick={() => setExpanded([])} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white">
                <ChevronUp className="h-3.5 w-3.5" />
                Collapse all
              </button>
            </div>
            {projects.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <button onClick={() => setExpanded((current) => current.includes(p.title) ? current.filter((title) => title !== p.title) : [...current, p.title])}
                  aria-expanded={expanded.includes(p.title)}
                  className="w-full flex items-start gap-4 p-5 text-left hover:bg-gray-800/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm">{p.title}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border capitalize", DIFFICULTY_COLORS[p.difficulty] || DIFFICULTY_COLORS.intermediate)}>
                        {p.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />{p.estimated_weeks}w
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{p.description}</p>
                  </div>
                  {expanded.includes(p.title) ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />}
                </button>

                <AnimatePresence>
                  {expanded.includes(p.title) && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-gray-800">
                      <div className="p-5 space-y-4">
                        {/* Tech stack */}
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Tech Stack</div>
                          <div className="flex flex-wrap gap-1.5">
                            {p.tech_stack?.map((t) => (
                              <span key={t} className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">{t}</span>
                            ))}
                          </div>
                        </div>

                        {/* Why it helps */}
                        <div>
                          <div className="mb-1 flex items-center justify-between gap-3">
                            <div className="text-xs uppercase tracking-wide text-gray-500">Why it helps</div>
                            <CopyButton value={`${p.title}\n${p.description}\nStack: ${p.tech_stack.join(", ")}\n${p.why_it_helps}`} label="Copy project" />
                          </div>
                          <p className="text-sm text-gray-300">{p.why_it_helps}</p>
                        </div>

                        {/* Resume bullet */}
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Ready-to-use resume bullet</div>
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                            <p className="text-sm text-white flex-1">{p.resume_bullet}</p>
                            <CopyButton value={p.resume_bullet} label="Bullet" className="shrink-0" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
