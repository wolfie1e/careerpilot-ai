"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Loader2, Download, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn, scoreColor } from "@/lib/utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadJson } from "@/lib/export-utils";

const SECTIONS = ["summary", "experience", "projects", "skills", "achievements", "certifications"];

interface ImproveResult {
  improved_text: string;
  changes_made: string[];
  keywords_added: string[];
  quality_before: number;
  quality_after: number;
}

interface SectionImproverProps {
  resumeId: string;
  parsedSections?: Record<string, unknown>;
}

export default function SectionImprover({ resumeId, parsedSections }: SectionImproverProps) {
  const [section, setSection] = useState("summary");
  const [sectionText, setSectionText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImproveResult | null>(null);
  const wordCount = sectionText.trim().split(/\s+/).filter(Boolean).length;

  function handleSectionChange(s: string) {
    setSection(s);
    setResult(null);
    const existing = parsedSections?.[s];
    setSectionText(typeof existing === "string" ? existing : "");
  }

  async function handleImprove() {
    if (!sectionText.trim()) { toast.error("Add section content to improve"); return; }
    setLoading(true);
    try {
      const data = await api.post<ImproveResult>(`/resume/${resumeId}/improve`, {
        section_name: section,
        section_text: sectionText,
        target_role: targetRole,
      });
      setResult(data);
      toast.success("Section improved!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Improvement failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        {/* Section picker */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">Section to improve</label>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <button key={s} onClick={() => handleSectionChange(s)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border",
                  section === s ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-400 hover:text-white"
                )}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="Target role (optional)"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all"
        />

        <textarea
          value={sectionText}
          onChange={(e) => setSectionText(e.target.value)}
          placeholder={`Paste your ${section} section here…`}
          rows={6}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none transition-all"
        />

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{wordCount} word{wordCount === 1 ? "" : "s"}</span>
          <span>{sectionText.length} characters</span>
        </div>

        <button onClick={handleImprove} disabled={loading || !sectionText.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white font-semibold rounded-xl text-sm transition-all">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Improving…</> : <><Wand2 className="w-4 h-4" />Improve Section</>}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Score improvement */}
            <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="text-center">
                <div className={cn("text-2xl font-bold", scoreColor(result.quality_before))}>{result.quality_before}</div>
                <div className="text-xs text-gray-500">Before</div>
              </div>
              <div className="flex-1 h-1 bg-gray-800 rounded-full relative">
                <motion.div
                  initial={{ width: `${result.quality_before}%` }}
                  animate={{ width: `${result.quality_after}%` }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full"
                />
              </div>
              <div className="text-center">
                <div className={cn("text-2xl font-bold", scoreColor(result.quality_after))}>{result.quality_after}</div>
                <div className="text-xs text-gray-500">After</div>
              </div>
            </div>

            {/* Improved text */}
            <div className="bg-gray-900 border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-emerald-400">Improved {section}</span>
                <div className="flex gap-2">
                  <CopyButton value={result.improved_text} />
                  <button onClick={() => { setSectionText(result.improved_text); setResult(null); }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Use text
                  </button>
                  <button onClick={() => downloadJson(`careerpilot-${section}-improvement.json`, { section, target_role: targetRole || null, ...result })} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white">
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{result.improved_text}</p>
            </div>

            {/* Changes + keywords */}
            <div className="grid sm:grid-cols-2 gap-4">
              {result.changes_made?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Changes made</div>
                  <ul className="space-y-1">
                    {result.changes_made.map((c, i) => (
                      <li key={i} className="text-xs text-gray-300 flex gap-2"><span className="text-blue-400">•</span>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.keywords_added?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Keywords added</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywords_added.map((kw) => (
                      <span key={kw} className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">+{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
