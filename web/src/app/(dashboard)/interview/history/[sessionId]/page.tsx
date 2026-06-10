"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Lightbulb, Loader2, Trophy, Mic, MessageSquare, Download } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatDate, scoreColor, cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadJson } from "@/lib/export-utils";

interface Answer {
  id: string;
  answer_text: string | null;
  transcript: string | null;
  score: number | null;
  rubric_scores: Record<string, number> | null;
  feedback_positive: string[] | null;
  feedback_improve: string[] | null;
  model_answer_hint: string | null;
}

interface Question {
  id: string;
  number: number;
  text: string;
  type: string | null;
  topic: string | null;
  answer: Answer | null;
}

interface SessionData {
  session: {
    id: string;
    role_title: string;
    difficulty: string;
    interview_type: string;
    session_mode: string;
    status: string;
    overall_score: number | null;
    summary: string | null;
    created_at: string;
  };
  questions: Question[];
}

function formatRubricLabel(key: string) {
  return key.replace(/_/g, " ");
}

function formatReviewSummary(session: SessionData, focusArea: string | null) {
  return [
    `Interview review: ${session.session.role_title}`,
    `Overall score: ${session.session.overall_score ?? "Unscored"}`,
    `Difficulty: ${session.session.difficulty}`,
    `Type: ${session.session.interview_type.replace("_", " ")}`,
    focusArea ? `Focus area: ${formatRubricLabel(focusArea)}` : null,
    session.session.summary ? `Summary: ${session.session.summary}` : null,
  ].filter(Boolean).join("\n");
}

export default function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  useEffect(() => {
    api.get<SessionData>(`/interview/sessions/${sessionId}`)
      .then(setSession)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>;
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">Session not found.</p>
        <Link href="/interview/history" className="text-blue-400 text-sm mt-2 inline-block">← Back to history</Link>
      </div>
    );
  }

  const answeredCount = session.questions.filter((q) => q.answer).length;
  const scores = session.questions.map((q) => q.answer?.score).filter((s): s is number => s !== null && s !== undefined);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const bestScore = scores.length ? Math.max(...scores) : null;
  const worstScore = scores.length ? Math.min(...scores) : null;
  const rubricAverages = Object.entries(
    session.questions.reduce<Record<string, { total: number; count: number }>>((acc, question) => {
      Object.entries(question.answer?.rubric_scores || {}).forEach(([key, value]) => {
        acc[key] = acc[key] || { total: 0, count: 0 };
        acc[key].total += value;
        acc[key].count += 1;
      });
      return acc;
    }, {})
  ).map(([key, value]) => ({
    key,
    average: Math.round(value.total / value.count),
  })).sort((a, b) => a.average - b.average);
  const weakestRubric = rubricAverages[0] ?? null;
  const strongestRubric = rubricAverages.at(-1) ?? null;

  function toggleExpanded(questionId: string) {
    setExpandedIds((prev) => (
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    ));
  }

  function exportReview() {
    downloadJson(`careerpilot-interview-review-${session.session.id}.json`, {
      exported_at: new Date().toISOString(),
      ...session,
      rubric_averages: rubricAverages,
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back link */}
      <Link href="/interview/history" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" />Back to history
      </Link>

      {/* Session header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">{session.session.role_title}</h2>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="capitalize">{session.session.difficulty}</span>
              <span>·</span>
              <span className="capitalize">{session.session.interview_type.replace("_", " ")}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {session.session.session_mode === "voice" ? <Mic className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                {session.session.session_mode}
              </span>
              <span>·</span>
              <span>{formatDate(session.session.created_at)}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {session.session.overall_score !== null && (
              <div className="text-right">
                <div className={cn("text-3xl font-extrabold", scoreColor(session.session.overall_score))}>
                  {session.session.overall_score}
                </div>
                <div className="text-xs text-gray-500">Overall</div>
              </div>
            )}
            <div className="flex gap-2">
              <CopyButton value={formatReviewSummary(session, weakestRubric?.key ?? null)} label="Copy review" />
              <button onClick={exportReview} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white">
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {session.session.summary && (
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Trophy className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-sm text-blue-300">{session.session.summary}</span>
          </div>
        )}

        {/* Mini stats */}
        {scores.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[
              { label: "Answered", value: `${answeredCount}/${session.questions.length}` },
              { label: "Avg Score", value: avgScore ? `${avgScore}/100` : "—" },
              { label: "Best", value: bestScore !== null ? `${bestScore}/100` : "—" },
              { label: "Worst", value: worstScore !== null ? `${worstScore}/100` : "—" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-800/50 rounded-xl p-3 text-center">
                <div className="text-sm font-semibold text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {weakestRubric && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-400">Focus area</div>
              <div className="mt-1 text-sm font-semibold capitalize text-white">{formatRubricLabel(weakestRubric.key)}</div>
              <div className="mt-1 text-xs text-gray-500">Average {weakestRubric.average}/20 across answered questions</div>
            </div>
            {strongestRubric && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Strongest area</div>
                <div className="mt-1 text-sm font-semibold capitalize text-white">{formatRubricLabel(strongestRubric.key)}</div>
                <div className="mt-1 text-xs text-gray-500">Average {strongestRubric.average}/20 across answered questions</div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex justify-end gap-2">
          <button onClick={() => setExpandedIds(session.questions.map((q) => q.id))} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white">
            <ChevronDown className="h-3.5 w-3.5" />
            Expand all
          </button>
          <button onClick={() => setExpandedIds([])} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-800 hover:text-white">
            <ChevronUp className="h-3.5 w-3.5" />
            Collapse all
          </button>
        </div>

        {session.questions.map((q, i) => {
          const isExpanded = expandedIds.includes(q.id);
          return (
          <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Question header */}
            <button
              onClick={() => toggleExpanded(q.id)}
              className="w-full flex items-start gap-4 p-5 text-left hover:bg-gray-800/30 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {q.number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white leading-relaxed">{q.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  {q.type && <span className="text-xs text-gray-500 capitalize">{q.type.replace("_", " ")}</span>}
                  {q.topic && <><span className="text-gray-700">·</span><span className="text-xs text-gray-500">{q.topic}</span></>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {q.answer?.score !== null && q.answer?.score !== undefined ? (
                  <span className={cn("text-sm font-bold", scoreColor(q.answer.score))}>{q.answer.score}</span>
                ) : (
                  <span className="text-xs text-gray-600">Unanswered</span>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </button>

            {/* Answer detail */}
            <AnimatePresence>
              {isExpanded && q.answer && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-gray-800">
                  <div className="p-5 space-y-4">
                    {/* Answer text */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Your Answer</div>
                        <CopyButton value={q.answer.transcript || q.answer.answer_text || "No answer recorded"} label="Copy answer" />
                      </div>
                      <p className="text-sm text-gray-300 bg-gray-800/50 rounded-xl px-4 py-3 italic">
                        &ldquo;{q.answer.transcript || q.answer.answer_text || "No answer recorded"}&rdquo;
                      </p>
                    </div>

                    {/* Rubric scores */}
                    {q.answer.rubric_scores && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">STAR Rubric</div>
                        <div className="space-y-1.5">
                          {Object.entries(q.answer.rubric_scores).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 capitalize w-40 shrink-0">{key.replace(/_/g, " ")}</span>
                              <div className="flex-1 h-1.5 bg-gray-800 rounded-full">
                                <div className={cn("h-1.5 rounded-full", val >= 16 ? "bg-emerald-500" : val >= 12 ? "bg-amber-500" : "bg-rose-500")}
                                  style={{ width: `${(val / 20) * 100}%` }} />
                              </div>
                              <span className={cn("text-xs font-medium w-8 text-right", val >= 16 ? "text-emerald-400" : val >= 12 ? "text-amber-400" : "text-rose-400")}>{val}/20</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {q.answer.feedback_positive?.length ? (
                        <div>
                          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2"><CheckCircle className="w-3.5 h-3.5" />What worked</div>
                          <ul className="space-y-1">{q.answer.feedback_positive.map((f, j) => <li key={j} className="text-xs text-gray-300 flex gap-1.5"><span className="text-emerald-400">•</span>{f}</li>)}</ul>
                        </div>
                      ) : null}
                      {q.answer.feedback_improve?.length ? (
                        <div>
                          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2"><AlertCircle className="w-3.5 h-3.5" />To improve</div>
                          <ul className="space-y-1">{q.answer.feedback_improve.map((f, j) => <li key={j} className="text-xs text-gray-300 flex gap-1.5"><span className="text-amber-400">•</span>{f}</li>)}</ul>
                        </div>
                      ) : null}
                    </div>

                    {/* Model hint */}
                    {q.answer.model_answer_hint && (
                      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3">
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400"><Lightbulb className="w-3.5 h-3.5" />Model answer hint</div>
                          <CopyButton value={q.answer.model_answer_hint} label="Copy hint" />
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{q.answer.model_answer_hint}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          );
        })}
      </div>
    </div>
  );
}
