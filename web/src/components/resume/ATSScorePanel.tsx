"use client";

import { motion } from "framer-motion";
import { cn, scoreColor } from "@/lib/utils";

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
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-white">ATS Score</h3>
        <span className={cn("text-3xl font-extrabold", scoreColor(atsScore))}>
          {atsScore}<span className="text-sm font-normal text-gray-500">/100</span>
        </span>
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

      {/* Category breakdown */}
      <div className="space-y-3">
        {Object.entries(breakdown).map(([key, score]) => (
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
