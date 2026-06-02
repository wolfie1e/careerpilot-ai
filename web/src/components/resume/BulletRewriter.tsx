"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared/CopyButton";

interface RewriteResult {
  original?: string;
  rewritten: string;
  impact_score: number;
  keywords_added: string[];
  rationale: string;
}

interface BulletRewriterProps {
  resumeId: string;
}

export default function BulletRewriter({ resumeId }: BulletRewriterProps) {
  const [targetRole, setTargetRole] = useState("");
  const [bullets, setBullets] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RewriteResult[]>([]);

  const addBullet = () => setBullets((b) => [...b, ""]);
  const removeBullet = (i: number) => setBullets((b) => b.filter((_, j) => j !== i));
  const updateBullet = (i: number, val: string) =>
    setBullets((b) => b.map((x, j) => (j === i ? val : x)));

  async function handleRewrite() {
    const filled = bullets.filter((b) => b.trim());
    if (!filled.length) { toast.error("Add at least one bullet to rewrite"); return; }
    setLoading(true);
    try {
      if (filled.length === 1) {
        const data = await api.post<RewriteResult>(`/resume/${resumeId}/rewrite`, {
          bullet: filled[0],
          target_role: targetRole,
        });
        setResults([{ ...data, original: filled[0] }]);
      } else {
        const data = await api.post<RewriteResult[]>(`/resume/${resumeId}/rewrite`, {
          bullet: filled[0],
          bullets: filled,
          target_role: targetRole,
        });
        setResults(Array.isArray(data) ? data : [data]);
      }
      toast.success("Bullets rewritten!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Rewrite failed");
    } finally {
      setLoading(false);
    }
  }

  const impactColor = (score: number) =>
    score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : score >= 60 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-rose-400 bg-rose-500/10 border-rose-500/20";

  return (
    <div className="space-y-5">
      {/* Input section */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="Target role (e.g. Backend Engineer, Product Manager)"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all"
        />

        <div className="space-y-2">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Bullets to rewrite</label>
          {bullets.map((b, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={b}
                onChange={(e) => updateBullet(i, e.target.value)}
                placeholder={`Bullet ${i + 1} — e.g. "Made a website using React"`}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-all"
              />
              {bullets.length > 1 && (
                <button onClick={() => removeBullet(i)} className="p-2.5 text-gray-600 hover:text-rose-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={addBullet} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
            <Plus className="w-3.5 h-3.5" />Add another bullet
          </button>
          <button
            onClick={handleRewrite}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 ml-auto bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 text-white font-semibold rounded-xl text-sm transition-all"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Rewriting…</> : <><Sparkles className="w-4 h-4" />Rewrite Bullets</>}
          </button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                {/* Before */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Before</div>
                  <div className="text-sm text-gray-400 bg-gray-800/50 rounded-xl px-4 py-3 flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5">•</span>
                    {r.original || bullets[i] || "—"}
                  </div>
                </div>

                {/* After */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">After</div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-white">{r.rewritten}</span>
                    </div>
                    <CopyButton value={r.rewritten} className="shrink-0" />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", impactColor(r.impact_score))}>
                    Impact: {r.impact_score}/100
                  </span>
                  {r.keywords_added?.map((kw) => (
                    <span key={kw} className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">+{kw}</span>
                  ))}
                </div>

                {r.rationale && (
                  <p className="text-xs text-gray-500 italic">{r.rationale}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
