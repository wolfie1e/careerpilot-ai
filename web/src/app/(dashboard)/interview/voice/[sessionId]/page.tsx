"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, RotateCcw, Loader2, CheckCircle, AlertCircle, Trophy, Lightbulb, Download } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn, scoreColor } from "@/lib/utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadJson } from "@/lib/export-utils";

interface Question {
  id: string;
  number: number;
  text: string;
  type: string;
}

interface SessionData {
  session: { id: string; role_title: string; question_count: number };
  questions: Question[];
}

interface Feedback {
  transcript: string;
  score: number;
  feedback_positive: string[];
  feedback_improve: string[];
  model_answer_hint: string;
}

export default function VoiceInterviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { state, seconds, start, stop, reset } = useAudioRecorder();
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get<SessionData>(`/interview/sessions/${sessionId}`)
      .then(setSession)
      .catch(() => toast.error("Failed to load session"));
  }, [sessionId]);

  const questions = session?.questions || [];
  const currentQ = questions[currentIdx];
  const feedbackSummary = feedback ? [
    `Transcript: ${feedback.transcript}`,
    `Score: ${feedback.score}/100`,
    `What worked: ${feedback.feedback_positive.join("; ") || "None"}`,
    `To improve: ${feedback.feedback_improve.join("; ") || "None"}`,
    `Model hint: ${feedback.model_answer_hint || "None"}`,
  ].join("\n") : "";
  const transcriptWordCount = feedback?.transcript.trim().split(/\s+/).filter(Boolean).length ?? 0;

  async function handleStopAndSubmit() {
    setProcessing(true);
    try {
      const audioBlob = await stop();
      const form = new FormData();
      form.append("audio", audioBlob, "answer.webm");
      form.append("question_id", currentQ.id);

      // Get token from cookie for this direct fetch
      const res = await fetch(`/api/interview/voice/${sessionId}`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error("Transcription failed");
      const data: Feedback = await res.json();
      setFeedback(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to process audio");
      reset();
    } finally {
      setProcessing(false);
    }
  }

  function handleNext() {
    if (currentIdx + 1 >= questions.length) { setDone(true); return; }
    setCurrentIdx((i) => i + 1);
    setFeedback(null);
    reset();
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (done) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Voice Interview Complete!</h2>
        <p className="text-gray-400 mb-6">Great work! Your answers have been transcribed and evaluated.</p>
        <button onClick={() => router.push(`/interview/history/${sessionId}`)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all">
          View Full Review
        </button>
      </motion.div>
    );
  }

  if (!session) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-400 animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>{session.session.role_title} · Voice</span>
          <span>Question {currentIdx + 1} / {questions.length}</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full">
          <div className="h-1.5 bg-violet-500 rounded-full transition-all" style={{ width: `${(currentIdx / Math.max(questions.length, 1)) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      {currentQ && (
        <motion.div key={currentQ.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <span className="text-xs px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20 capitalize inline-block mb-3">
            {currentQ.type?.replace("_", " ") || "Question"}
          </span>
          <CopyButton value={currentQ.text} label="Copy question" className="float-right" />
          <p className="text-white font-medium leading-relaxed">{currentQ.text}</p>
        </motion.div>
      )}

      {/* Recorder */}
      {!feedback && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
          {processing ? (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
              <div className="text-sm text-gray-400">Transcribing and evaluating…</div>
            </div>
          ) : state === "recording" ? (
            <div className="space-y-4">
              {/* Animated recording indicator */}
              <div className="flex items-center justify-center gap-1 h-10">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, delay: i * 0.07, repeat: Infinity }}
                    className="w-1 bg-violet-500 rounded-full"
                    style={{ height: "100%" }}
                  />
                ))}
              </div>
              <div className="text-sm text-violet-400 font-medium">Recording · {formatTime(seconds)}</div>
              <div className="text-xs text-gray-500">Aim for 1:00-2:00 with a clear situation, action, and result.</div>
              <button onClick={handleStopAndSubmit}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-all text-sm">
                <Square className="w-4 h-4 fill-current" />Stop & Evaluate
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto cursor-pointer transition-all",
                "bg-violet-500/10 hover:bg-violet-500/20 border-2 border-violet-500/30 hover:border-violet-500/60")}
                onClick={start}>
                <Mic className="w-7 h-7 text-violet-400" />
              </div>
              <div className="text-sm text-gray-400">Click to start recording</div>
              <div className="text-xs text-gray-600">Your audio is processed securely and not stored permanently</div>
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Transcript */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">Transcript</div>
                <CopyButton value={feedback.transcript} label="Copy transcript" />
              </div>
              <p className="text-sm text-gray-300 italic">&ldquo;{feedback.transcript}&rdquo;</p>
              <div className="mt-2 text-xs text-gray-500">{transcriptWordCount} words · about {Math.max(1, Math.round((transcriptWordCount / 130) * 60))} seconds spoken</div>
            </div>

            {/* Score */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-0.5">Answer Score</div>
                <div className={cn("text-3xl font-extrabold", scoreColor(feedback.score))}>{feedback.score}<span className="text-sm font-normal text-gray-500">/100</span></div>
              </div>
              <CopyButton value={feedbackSummary} label="Copy feedback" />
              <button onClick={() => downloadJson(`careerpilot-voice-feedback-${currentQ?.number || currentIdx + 1}.json`, { question: currentQ, feedback })} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 px-2.5 py-1.5 text-xs font-medium text-gray-400 transition hover:text-white">
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            </div>

            {feedback.feedback_positive?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3"><CheckCircle className="w-4 h-4" />What worked</h4>
                <ul className="space-y-1.5">{feedback.feedback_positive.map((p, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-emerald-400">•</span>{p}</li>)}</ul>
              </div>
            )}

            {feedback.feedback_improve?.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4" />To improve</h4>
                <ul className="space-y-1.5">{feedback.feedback_improve.map((p, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-amber-400">•</span>{p}</li>)}</ul>
              </div>
            )}

            {feedback.model_answer_hint && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-400">
                  <Lightbulb className="h-4 w-4" />
                  Model answer hint
                </h4>
                <p className="text-sm leading-relaxed text-gray-300">{feedback.model_answer_hint}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setFeedback(null); reset(); }} className="flex items-center gap-2 px-4 py-2 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-xl text-sm transition-all">
                <RotateCcw className="w-3.5 h-3.5" />Re-record
              </button>
              <button onClick={handleNext} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all text-sm">
                {currentIdx + 1 >= questions.length ? "Finish Interview" : "Next Question →"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
