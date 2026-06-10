"use client";

import { useDeferredValue, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Mic, Clock, ChevronRight, Loader2, Search, SlidersHorizontal, ArrowUpDown, Star, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import { interviewSessionHref } from "@/lib/interview-utils";
import { formatRelativeTime, scoreColor, cn } from "@/lib/utils";
import { DIFFICULTY_LEVELS, INTERVIEW_MODES, INTERVIEW_STATUSES, INTERVIEW_TYPES, LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { CopyButton } from "@/components/shared/CopyButton";

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

interface HistoryView {
  search: string;
  difficulty: string;
  interviewType: string;
  sessionMode: string;
  status: string;
  scoreFilter: string;
  showPinnedOnly: boolean;
  sortBy: string;
}

const DEFAULT_HISTORY_VIEW: HistoryView = {
  search: "",
  difficulty: "",
  interviewType: "",
  sessionMode: "",
  status: "",
  scoreFilter: "",
  showPinnedOnly: false,
  sortBy: "newest",
};

export default function InterviewHistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyView, setHistoryView] = useLocalStorage<HistoryView>(LOCAL_STORAGE_KEYS.interviewHistoryView, DEFAULT_HISTORY_VIEW);
  const [pinnedSessionIds, setPinnedSessionIds] = useLocalStorage<string[]>(LOCAL_STORAGE_KEYS.pinnedInterviewSessions, []);
  const deferredSearch = useDeferredValue(historyView.search);
  const hasFilters = Boolean(historyView.search || historyView.difficulty || historyView.interviewType || historyView.sessionMode || historyView.status || historyView.scoreFilter || historyView.showPinnedOnly);
  const pinnedSessionSet = new Set(pinnedSessionIds);
  const sortedSessions = [...sessions].sort((a, b) => {
    if (pinnedSessionSet.has(a.id) !== pinnedSessionSet.has(b.id)) {
      return pinnedSessionSet.has(a.id) ? -1 : 1;
    }
    if (historyView.sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (historyView.sortBy === "score_desc") return (b.overall_score ?? -1) - (a.overall_score ?? -1);
    if (historyView.sortBy === "score_asc") return (a.overall_score ?? 101) - (b.overall_score ?? 101);
    if (historyView.sortBy === "role") return a.role_title.localeCompare(b.role_title);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const visibleSessions = sortedSessions.filter((session) => {
    if (historyView.showPinnedOnly && !pinnedSessionSet.has(session.id)) return false;
    if (historyView.scoreFilter === "strong") return (session.overall_score ?? 0) >= 75;
    if (historyView.scoreFilter === "needs_focus") return session.overall_score !== null && session.overall_score < 75;
    if (historyView.scoreFilter === "unscored") return session.overall_score === null;
    return true;
  });
  const visibleScoredSessions = visibleSessions.filter((session) => session.overall_score !== null);
  const visibleAverageScore = visibleScoredSessions.length
    ? Math.round(visibleScoredSessions.reduce((sum, session) => sum + (session.overall_score || 0), 0) / visibleScoredSessions.length)
    : null;
  const visibleSessionText = visibleSessions.map((session) => (
    `${session.role_title} · ${session.difficulty} · ${session.interview_type.replace("_", " ")} · ${session.overall_score ?? session.status}`
  )).join("\n");

  function clearFilters() {
    setHistoryView((view) => ({ ...view, search: "", difficulty: "", interviewType: "", sessionMode: "", status: "", scoreFilter: "", showPinnedOnly: false }));
  }

  function resetHistoryView() {
    setHistoryView(DEFAULT_HISTORY_VIEW);
  }

  function togglePinnedSession(sessionId: string) {
    setPinnedSessionIds((prev) => (
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [sessionId, ...prev]
    ));
  }

  function exportSessions() {
    downloadCsv("careerpilot-interview-history.csv", visibleSessions.map((session) => ({
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

  function exportSessionsJson() {
    downloadJson("careerpilot-interview-history.json", visibleSessions);
  }

  function exportPinnedSessionsJson() {
    downloadJson("careerpilot-pinned-interviews.json", sessions.filter((session) => pinnedSessionSet.has(session.id)));
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
    if (historyView.difficulty) params.set("difficulty", historyView.difficulty);
    if (historyView.interviewType) params.set("interview_type", historyView.interviewType);
    if (historyView.sessionMode) params.set("session_mode", historyView.sessionMode);
    if (historyView.status) params.set("status", historyView.status);

    api.get<{ sessions: Session[] }>(`/interview/history${params.size ? `?${params}` : ""}`)
      .then((d) => setSessions(d.sessions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [deferredSearch, historyView.difficulty, historyView.interviewType, historyView.sessionMode, historyView.status]);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Interview History</h2>
        <p className="text-sm text-gray-400 mt-1">
          {visibleSessions.length} of {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </p>
        {sessions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={exportSessions} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-900 hover:text-white">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button onClick={exportSessionsJson} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-900 hover:text-white">
              <Download className="h-4 w-4" />
              Export JSON
            </button>
            <CopyButton value={visibleSessionText || "No sessions"} label="Copy visible" className="rounded-xl px-3 py-2 text-sm" />
            {pinnedSessionIds.length > 0 && (
              <>
              <button onClick={exportPinnedSessionsJson} className="inline-flex items-center gap-2 rounded-xl border border-amber-700/50 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                Export pinned
              </button>
              <button onClick={() => setPinnedSessionIds([])} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-400 transition hover:border-rose-500/40 hover:text-rose-300">
                <Trash2 className="h-4 w-4" />
                Clear pins
              </button>
              </>
            )}
          </div>
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
          <button onClick={resetHistoryView} className={cn("text-xs font-medium text-gray-500 transition hover:text-white", !hasFilters && "ml-auto")}>
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" />
            Reset view
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-6">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            <input
              value={historyView.search}
              onChange={(e) => setHistoryView((view) => ({ ...view, search: e.target.value }))}
              placeholder="Search roles..."
              className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2.5 pl-9 pr-16 text-sm text-white outline-none transition focus:border-blue-500"
            />
            {historyView.search && (
              <button
                type="button"
                onClick={() => setHistoryView((view) => ({ ...view, search: "" }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 transition hover:text-white"
              >
                Clear
              </button>
            )}
          </label>
          <select value={historyView.difficulty} onChange={(e) => setHistoryView((view) => ({ ...view, difficulty: e.target.value }))} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500">
            <option value="">All difficulties</option>
            {DIFFICULTY_LEVELS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <select value={historyView.interviewType} onChange={(e) => setHistoryView((view) => ({ ...view, interviewType: e.target.value }))} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500">
            <option value="">All types</option>
            {INTERVIEW_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={historyView.sessionMode} onChange={(e) => setHistoryView((view) => ({ ...view, sessionMode: e.target.value }))} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500">
            <option value="">Any mode</option>
            {INTERVIEW_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={historyView.status} onChange={(e) => setHistoryView((view) => ({ ...view, status: e.target.value }))} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500">
            <option value="">Any status</option>
            {INTERVIEW_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={historyView.scoreFilter} onChange={(e) => setHistoryView((view) => ({ ...view, scoreFilter: e.target.value }))} className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 md:col-span-3">
            <option value="">Any score</option>
            <option value="strong">75+ strong</option>
            <option value="needs_focus">Below 75</option>
            <option value="unscored">Unscored</option>
          </select>
          <label className="relative md:col-span-3">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
            <select value={historyView.sortBy} onChange={(e) => setHistoryView((view) => ({ ...view, sortBy: e.target.value }))} className="w-full appearance-none rounded-xl border border-gray-700 bg-gray-800 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition focus:border-blue-500">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="score_desc">Highest score</option>
              <option value="score_asc">Lowest score</option>
              <option value="role">Role A-Z</option>
            </select>
          </label>
        </div>
        {pinnedSessionIds.length > 0 && (
          <button
            onClick={() => setHistoryView((view) => ({ ...view, showPinnedOnly: !view.showPinnedOnly }))}
            className={cn(
              "mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition",
              historyView.showPinnedOnly ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"
            )}
          >
            <Star className={cn("h-3.5 w-3.5", historyView.showPinnedOnly && "fill-amber-400 text-amber-400")} />
            Pinned only
          </button>
        )}
      </div>

      {sessions.length > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Visible", value: visibleSessions.length },
            { label: "Avg score", value: visibleAverageScore !== null ? `${visibleAverageScore}/100` : "—" },
            { label: "Active", value: visibleSessions.filter((session) => session.status === "active").length },
            { label: "Pinned", value: visibleSessions.filter((session) => pinnedSessionSet.has(session.id)).length },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="mt-1 text-xl font-bold text-white">{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
      ) : visibleSessions.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 text-center">
          <Clock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 mb-4">{hasFilters ? "No sessions match these filters" : "No interview sessions yet"}</p>
          {hasFilters ? (
            <button onClick={clearFilters} className="px-4 py-2 bg-gray-800 text-white text-sm font-semibold rounded-lg">
              Clear filters
            </button>
          ) : (
            <Link href="/interview/setup" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg">
              Start your first interview
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleSessions.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "flex bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl transition-colors",
                pinnedSessionSet.has(s.id) && "border-amber-500/50"
              )}
            >
              <button
                onClick={() => togglePinnedSession(s.id)}
                className="px-3 text-gray-600 transition hover:text-amber-400"
                title={pinnedSessionSet.has(s.id) ? "Unpin session" : "Pin session"}
              >
                <Star className={cn("h-4 w-4", pinnedSessionSet.has(s.id) && "fill-amber-400 text-amber-400")} />
              </button>
              <Link href={interviewSessionHref(s)} className="flex flex-1 items-center gap-4 p-4 pl-0 w-full">
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
