"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Download } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import { cn, scoreColor } from "@/lib/utils";
import { downloadJson } from "@/lib/export-utils";

interface ATSBreakdown {
  section_presence: number;
  keyword_density: number;
  action_verbs: number;
  quantification: number;
  formatting: number;
  contact_completeness: number;
  length_compliance: number;
}

interface ATSScorePanelProps {
  atsScore: number;
  breakdown: ATSBreakdown;
}

const categoryLabels: Record<string, string> = {
  section_presence: "Section Presence",
  keyword_density: "Keyword Density",
  action_verbs: "Action Verbs",
  quantification: "Quantification",
  formatting: "Formatting",
  contact_completeness: "Contact Info",
  length_compliance: "Length",
};

const categoryWeights: Record<string, number> = {
  section_presence: 20,
  keyword_density: 20,
  action_verbs: 15,
  quantification: 15,
  formatting: 15,
  contact_completeness: 10,
  length_compliance: 5,
};

export default function ATSScorePanel({ atsScore, breakdown }: ATSScorePanelProps) {
  const [sortWeakestFirst, setSortWeakestFirst] = useState(false);
  const weakestCategory = Object.entries(breakdown).sort(([, a], [, b]) => a - b)[0];
  const categories = sortWeakestFirst
    ? Object.entries(breakdown).sort(([, a], [, b]) => a - b)
    : Object.entries(breakdown);
  const summary = [
    `ATS score: ${atsScore}/100`,
    ...Object.entries(breakdown).map(([key, score]) => `${categoryLabels[key] || key}: ${score}/100`),
  ].join("\n");

  function exportAtsBreakdown() {
    downloadJson("careerpilot-ats-breakdown.json", {
      exported_at: new Date().toISOString(),
      ats_score: atsScore,
      weakest_category: weakestCategory ? {
        category: categoryLabels[weakestCategory[0]] || weakestCategory[0],
        score: weakestCategory[1],
      } : null,
      breakdown,
      weights: categoryWeights,
    });
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-white">ATS Score</h3>
        <div className="flex items-center gap-3">
          <CopyButton value={summary} label="Copy summary" />
          <button onClick={exportAtsBreakdown} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <span className={cn("text-3xl font-extrabold", scoreColor(atsScore))}>
            {atsScore}<span className="text-sm font-normal text-gray-500">/100</span>
          </span>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6">
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${atsScore}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn("h-3 rounded-full", atsScore >= 80 ? "bg-emerald-500" : atsScore >= 60 ? "bg-amber-500" : "bg-rose-500")}
          />
        </div>
      </div>

      {weakestCategory && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-400">Top ATS focus</div>
          <div className="mt-1 text-sm font-semibold text-white">{categoryLabels[weakestCategory[0]] || weakestCategory[0]}</div>
          <div className="mt-1 text-xs text-gray-500">Currently scoring {weakestCategory[1]}/100 in this category.</div>
        </div>
      )}

      {/* Category breakdown */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Category breakdown</div>
        <button onClick={() => setSortWeakestFirst((value) => !value)} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition", sortWeakestFirst ? "border-blue-500/40 bg-blue-500/10 text-blue-300" : "border-gray-700 text-gray-500 hover:text-white")}>
          <ArrowUpDown className="h-3.5 w-3.5" />
          Weakest first
        </button>
      </div>
      <div className="space-y-3">
        {categories.map(([key, score]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{categoryLabels[key] || key}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">×{categoryWeights[key]}%</span>
                <span className={cn("text-xs font-semibold", scoreColor(score))}>{score}</span>
              </div>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                className={cn("h-1.5 rounded-full", score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-rose-500")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
