"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Lightbulb, Send, Loader2, Trophy, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn, scoreColor } from "@/lib/utils";
import { CopyButton } from "@/components/shared/CopyButton";

interface Question {
  id: string;
  number: number;
  text: string;
  type: string;
  topic: string;
}

interface SessionData {
  session: { id: string; role_title: string; difficulty: string; question_count: number; status: string };
  questions: Array<Question & { answer?: { score: number; feedback_positive: string[]; feedback_improve: string[]; model_answer_hint: string } | null }>;
}

interface Feedback {
  score: number;
  feedback_positive: string[];
  feedback_improve: string[];
  model_answer_hint: string;
}

export default function TextInterviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get<SessionData>(`/interview/sessions/${sessionId}`)
      .then(setSession)
      .catch(() => toast.error("Failed to load session"));
  }, [sessionId]);

  const questions = session?.questions || [];
  const currentQ = questions[currentIdx];
  const progress = ((currentIdx) / Math.max(questions.length, 1)) * 100;
  const answerWordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const feedbackSummary = feedback ? [
    `Score: ${feedback.score}/100`,
    `What worked: ${feedback.feedback_positive.join("; ") || "None"}`,
    `To improve: ${feedback.feedback_improve.join("; ") || "None"}`,
    `Model hint: ${feedback.model_answer_hint || "None"}`,
  ].join("\n") : "";

  async function handleSubmit() {
    if (!answer.trim() || !currentQ) return;
    setSubmitting(true);
    try {
      const result = await api.post<Feedback>(`/interview/sessions/${sessionId}/answer`, {
        question_id: currentQ.id,
        answer_text: answer,
      });
      setFeedback(result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setAnswer("");
      setFeedback(null);
      setShowHint(false);
    }
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Interview Complete!</h2>
        <p className="text-gray-400 mb-6">Your answers have been evaluated. Check your history for the full report.</p>
        <button onClick={() => router.push("/interview")} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-sm">
          View History
        </button>
      </motion.div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{session.session.role_title} · {session.session.difficulty}</span>
          <span>Question {currentIdx + 1} / {questions.length}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full">
          <motion.div
            className="h-1.5 bg-blue-500 rounded-full"
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      {currentQ && (
        <motion.div key={currentQ.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 capitalize">
              {currentQ.type?.replace("_", " ") || "Question"}
            </span>
            {currentQ.topic && (
              <span className="text-xs text-gray-500">{currentQ.topic}</span>
            )}
          </div>
          <p className="text-white font-medium leading-relaxed">{currentQ.text}</p>
        </motion.div>
      )}

      {/* Answer area */}
      {!feedback && (
        <div className="space-y-3">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here…"
            rows={6}
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none transition-all"
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{answerWordCount} word{answerWordCount === 1 ? "" : "s"}</span>
            <span>{answer.length} characters</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 text-white font-semibold rounded-xl transition-all text-sm"
            >
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Evaluating…</> : <><Send className="w-4 h-4" />Submit Answer</>}
            </button>
            <button onClick={() => setAnswer("")} disabled={!answer || submitting} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 text-xs font-medium text-gray-400 transition hover:text-white disabled:opacity-40">
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Score */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-0.5">Answer Score</div>
                <div className={cn("text-3xl font-extrabold", scoreColor(feedback.score))}>{feedback.score}<span className="text-sm font-normal text-gray-500">/100</span></div>
              </div>
              <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: feedback.score >= 80 ? "#10b981" : feedback.score >= 60 ? "#f59e0b" : "#ef4444" }}>
                <span className={cn("text-sm font-bold", scoreColor(feedback.score))}>{feedback.score}</span>
              </div>
              <CopyButton value={feedbackSummary} label="Copy feedback" />
            </div>

            {/* Positives */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4" />What worked</h4>
              <ul className="space-y-1.5">
                {feedback.feedback_positive?.map((p, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-emerald-400">•</span>{p}</li>)}
              </ul>
            </div>

            {/* Improvements */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" />To improve</h4>
              <ul className="space-y-1.5">
                {feedback.feedback_improve?.map((p, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-amber-400">•</span>{p}</li>)}
              </ul>
            </div>

            {/* Model answer hint */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <button onClick={() => setShowHint((v) => !v)} className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                <Lightbulb className="w-4 h-4" />
                {showHint ? "Hide" : "Show"} model answer hint
              </button>
              <AnimatePresence>
                {showHint && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="mt-3 text-sm text-gray-300 leading-relaxed">
                    {feedback.model_answer_hint}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button onClick={handleNext} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all text-sm">
              {currentIdx + 1 >= questions.length ? "Finish Interview" : "Next Question →"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
