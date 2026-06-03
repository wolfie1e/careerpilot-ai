"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Mic, Clock, ChevronRight, Loader2, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { downloadCsv } from "@/lib/export-utils";
import { formatRelativeTime, scoreColor, cn } from "@/lib/utils";
import { DIFFICULTY_LEVELS, INTERVIEW_MODES, INTERVIEW_STATUSES, INTERVIEW_TYPES } from "@/lib/constants";

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
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [sessionMode, setSessionMode] = useState("");
  const [status, setStatus] = useState("");
  const deferredSearch = useDeferredValue(search);
  const hasFilters = Boolean(search || difficulty || interviewType || sessionMode || status);

  function clearFilters() {
    setSearch("");
    setDifficulty("");
    setInterviewType("");
    setSessionMode("");
    setStatus("");
  }

  function exportSessions() {
    downloadCsv("careerpilot-interview-history.csv", sessions.map((session) => ({
      role: session.role_title,
      difficulty: session.difficulty,
      type: session.interview_type,
      mode: session.session_mode,
      status: session.status,
      score: session.overall_score ?? "",
      questions: session.question_count,
      created_at: session.created_at,
    })));
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
    if (difficulty) params.set("difficulty", difficulty);
    if (interviewType) params.set("interview_type", interviewType);
    if (sessionMode) params.set("session_mode", sessionMode);
    if (status) params.set("status", status);

    setLoading(true);
    api.get<{ sessions: Session[] }>(`/interview/history${params.size ? `?${params}` : ""}`)
      .then((d) => setSessions(d.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deferredSearch, difficulty, interviewType, sessionMode, status]);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Interview History</h2>
        <p className="text-sm text-gray-400 mt-1">{sessions.length} session{sessions.length !== 1 ? "s" : ""} total</p>
        {sessions.length > 0 && (
          <button onClick={exportSessions} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-900 hover:text-white">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
          <SlidersHorizontal className="h-4 w-4 text-blue-400" />
          Filter sessions
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto text-xs font-medium text-gray-500 transition hover:text-white">
              Clear filters
            </button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles..."
              className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-blue-500"
            />
          </label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500">
            <option value="">All difficulties</option>
            {DIFFICULTY_LEVELS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <select value={interviewType} onChange={(e) => setInterviewType(e.target.value)} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500">
            <option value="">All types</option>
            {INTERVIEW_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={sessionMode} onChange={(e) => setSessionMode(e.target.value)} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500">
            <option value="">Any mode</option>
            {INTERVIEW_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 md:col-span-5">
            <option value="">Any status</option>
            {INTERVIEW_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
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
