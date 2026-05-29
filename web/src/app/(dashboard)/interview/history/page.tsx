"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Clock, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { formatRelativeTime, scoreColor, cn } from "@/lib/utils";

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

export default function InterviewHistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ sessions: Session[] }>("/interview/history")
      .then((d) => setSessions(d.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Interview History</h2>
        <p className="text-sm text-gray-400 mt-1">{sessions.length} session{sessions.length !== 1 ? "s" : ""} total</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 text-center">
          <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-4">No interview sessions yet</p>
          <Link href="/interview/setup" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg">
            Start your first interview
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl transition-colors"
            ><Link href={`/interview/history/${s.id}`} className="flex items-center gap-4 p-4 w-full">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                s.session_mode === "voice" ? "bg-violet-500/10" : "bg-blue-500/10")}>
                <Mic className={cn("w-5 h-5", s.session_mode === "voice" ? "text-violet-400" : "text-blue-400")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm">{s.role_title}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {s.difficulty} · {s.interview_type.replace("_", " ")} · {s.question_count}Q · {s.session_mode} · {formatRelativeTime(s.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  {s.overall_score !== null ? (
                    <div className={cn("text-sm font-bold", scoreColor(s.overall_score))}>{s.overall_score}/100</div>
                  ) : (
                    <div className="text-xs text-gray-600 capitalize">{s.status}</div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
            </Link></motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
