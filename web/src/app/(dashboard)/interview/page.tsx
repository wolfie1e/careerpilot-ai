"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Mic, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { formatRelativeTime, scoreColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  role_title: string;
  difficulty: string;
  interview_type: string;
  session_mode: string;
  status: string;
  overall_score: number | null;
  question_count: number;
  created_at: string;
}

export default function InterviewPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ sessions: Session[] }>("/interview/history")
      .then((d) => setSessions(d.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function sessionHref(session: Session) {
    if (session.status === "active") return `/interview/${session.session_mode}/${session.id}`;
    return `/interview/history/${session.id}`;
  }

  const scoredSessions = sessions.filter((session) => session.overall_score !== null);
  const avgScore = scoredSessions.length
    ? `${Math.round(scoredSessions.reduce((sum, session) => sum + (session.overall_score || 0), 0) / scoredSessions.length)}/100`
    : "—";
  const bestScore = scoredSessions.length ? `${Math.max(...scoredSessions.map((session) => session.overall_score || 0))}/100` : "—";

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Mock Interview</h2>
          <p className="text-sm text-gray-400 mt-0.5">Practice with AI-evaluated feedback on every answer</p>
        </div>
        <Link
          href="/interview/setup"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          New Interview
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Sessions", value: sessions.length, icon: Mic, color: "blue" },
          { label: "Completed", value: sessions.filter((s) => s.status === "completed").length, icon: TrendingUp, color: "emerald" },
          { label: "Active", value: sessions.filter((s) => s.status === "active").length, icon: Clock, color: "amber" },
          { label: "Best Score", value: bestScore, icon: TrendingUp, color: "violet" },
          { label: "Avg Score", value: avgScore, icon: Clock, color: "violet" },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Session history */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-medium text-white text-sm">Recent Sessions</h3>
          <Link href="/interview/history" className="text-xs font-medium text-blue-400 transition hover:text-blue-300">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-800">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-800 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="px-6 py-14 text-center">
            {/* Stylized illustration */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
              <Mic className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1.5">Master your interviews with AI feedback</h3>
            <p className="text-sm text-gray-400 mb-2 max-w-sm mx-auto">
              Practice with role-specific questions, get STAR rubric scores on every answer, and track improvement over time.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 mb-6">
              {["Real-time feedback", "Voice + Text modes", "STAR evaluation", "Personalized questions"].map((f) => (
                <span key={f} className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-blue-400" />{f}
                </span>
              ))}
            </div>
            <Link href="/interview/setup" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20">
              <Plus className="w-4 h-4" />Start Your First Interview
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {sessions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-5 py-4 flex items-center gap-4 hover:bg-gray-800/40 transition-colors"
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  s.session_mode === "voice" ? "bg-violet-500/10" : "bg-blue-500/10"
                )}>
                  <Mic className={cn("w-5 h-5", s.session_mode === "voice" ? "text-violet-400" : "text-blue-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">{s.role_title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                    <span className="capitalize">{s.difficulty}</span>
                    <span>·</span>
                    <span className="capitalize">{s.interview_type.replace("_", " ")}</span>
                    <span>·</span>
                    <span>{s.question_count}Q</span>
                    <span>·</span>
                    <span>{formatRelativeTime(s.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {s.overall_score !== null ? (
                    <span className={cn("text-sm font-bold", scoreColor(s.overall_score))}>
                      {s.overall_score}/100
                    </span>
                  ) : (
                    <span className="text-xs text-gray-600 capitalize">{s.status}</span>
                  )}
                  <Link href={sessionHref(s)} className="text-gray-600 hover:text-gray-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
