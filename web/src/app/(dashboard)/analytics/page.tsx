"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell, Legend
} from "recharts";
import { CalendarDays, Download, TrendingUp, Mic, FileText, Target, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import StatCard from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadCsv, downloadJson } from "@/lib/export-utils";
import { cn, formatDelta, scoreLabel, scoreTone } from "@/lib/utils";

interface AnalyticsData {
  latest_ats_score: number | null;
  avg_interview_score: number | null;
  total_resumes_analyzed: number;
  total_interviews: number;
  readiness_score: number;
  ats_trend: Array<{ date: string; score: number }>;
  interview_trend: Array<{ date: string; score: number }>;
  match_trend: Array<{ date: string; score: number }>;
  interview_by_type: Record<string, number>;
  skill_coverage: { matched: number; missing: number; critical: number };
}

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];
const TIME_RANGES = [
  { value: "all", label: "All" },
  { value: "180", label: "180D" },
  { value: "90", label: "90D" },
  { value: "30", label: "30D" },
] as const;

type TimeRange = (typeof TIME_RANGES)[number]["value"];

function filterTrend<T extends { date: string }>(trend: T[], cutoff: string | null) {
  if (!cutoff) return trend;
  return trend.filter((item) => item.date >= cutoff);
}

function deltaTone(delta: string) {
  if (delta.startsWith("+")) return "text-emerald-400";
  if (delta.startsWith("-")) return "text-rose-400";
  return "text-gray-500";
}

function getAnalyticsFocusItems(data: AnalyticsData) {
  const items = [];
  if ((data.latest_ats_score ?? 0) < 75) {
    items.push({ href: "/resume?tab=ats", label: "Raise ATS score", desc: `Latest ATS score is ${data.latest_ats_score ?? "not started"}.` });
  }
  const latestMatch = data.match_trend.at(-1)?.score ?? null;
  if ((latestMatch ?? 0) < 75) {
    items.push({ href: "/resume?tab=jd", label: "Improve job match", desc: latestMatch === null ? "Run a JD match to expose skill gaps." : `Latest match is ${latestMatch}/100.` });
  }
  if ((data.avg_interview_score ?? 0) < 75) {
    items.push({ href: "/interview/setup", label: "Practice interview answers", desc: data.avg_interview_score === null ? "Complete a mock interview to start tracking readiness." : `Average interview score is ${data.avg_interview_score}/100.` });
  }
  if (items.length === 0) {
    items.push({ href: "/reports", label: "Export your progress", desc: "Download reports while your readiness indicators are strong." });
  }
  return items.slice(0, 3);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useLocalStorage<TimeRange>(LOCAL_STORAGE_KEYS.analyticsTimeRange, "all");
  const [readinessGoal, setReadinessGoal] = useLocalStorage(LOCAL_STORAGE_KEYS.readinessGoal, 80);

  useEffect(() => {
    api.get<AnalyticsData>("/analytics")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  const hasData = data && (
    data.ats_trend.length > 0 ||
    data.interview_trend.length > 0 ||
    data.match_trend.length > 0
  );

  if (!hasData) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Analytics</h2>
          <p className="text-sm text-gray-400 mt-1">Score trends and progress tracking</p>
        </div>
        <EmptyState
          icon={TrendingUp}
          title="Your progress charts will appear here"
          description="Analyze a resume to see your first ATS data point, or complete a mock interview to track score improvement."
          actionHref="/resume"
          actionLabel="Analyze Resume"
        />
      </div>
    );
  }

  // Merge trends into combined data
  const sourceDates = [...new Set([
    ...data.ats_trend.map((d) => d.date),
    ...data.interview_trend.map((d) => d.date),
    ...data.match_trend.map((d) => d.date),
  ])].sort();
  const latestDate = sourceDates.at(-1) ?? null;
  const cutoffDate = latestDate && timeRange !== "all"
    ? (() => {
        const date = new Date(`${latestDate}T00:00:00`);
        date.setDate(date.getDate() - Number(timeRange));
        return date.toISOString().slice(0, 10);
      })()
    : null;
  const atsTrend = filterTrend(data.ats_trend, cutoffDate);
  const interviewTrend = filterTrend(data.interview_trend, cutoffDate);
  const matchTrend = filterTrend(data.match_trend, cutoffDate);

  const allDates = [...new Set([
    ...atsTrend.map((d) => d.date),
    ...interviewTrend.map((d) => d.date),
    ...matchTrend.map((d) => d.date),
  ])].sort();

  const combinedTrend = allDates.map((date) => ({
    date: date.slice(5),
    ats: atsTrend.find((d) => d.date === date)?.score ?? null,
    interview: interviewTrend.find((d) => d.date === date)?.score ?? null,
    match: matchTrend.find((d) => d.date === date)?.score ?? null,
  }));
  const momentumCards = [
    { label: "ATS momentum", current: atsTrend.at(-1)?.score ?? null, previous: atsTrend.at(-2)?.score ?? null },
    { label: "Interview momentum", current: interviewTrend.at(-1)?.score ?? null, previous: interviewTrend.at(-2)?.score ?? null },
    { label: "Match momentum", current: matchTrend.at(-1)?.score ?? null, previous: matchTrend.at(-2)?.score ?? null },
  ];
  const readinessGap = Math.max(0, readinessGoal - data.readiness_score);
  const focusItems = getAnalyticsFocusItems(data);

  function exportTrends() {
    downloadCsv("careerpilot-score-trends.csv", combinedTrend.map((row) => ({
      date: row.date,
      ats_score: row.ats ?? "",
      interview_score: row.interview ?? "",
      job_match_score: row.match ?? "",
    })));
  }

  function exportAnalyticsJson() {
    if (!data) return;
    downloadJson("careerpilot-analytics.json", {
      exported_at: new Date().toISOString(),
      time_range: timeRange,
      readiness_score: data.readiness_score,
      latest_ats_score: data.latest_ats_score,
      avg_interview_score: data.avg_interview_score,
      total_resumes_analyzed: data.total_resumes_analyzed,
      total_interviews: data.total_interviews,
      trends: combinedTrend,
      skill_coverage: data.skill_coverage,
      interview_by_type: data.interview_by_type,
    });
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Analytics</h2>
          <p className="text-sm text-gray-400 mt-1">Your career readiness over time</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1">
            <CalendarDays className="ml-2 h-4 w-4 text-gray-500" />
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${timeRange === range.value ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"}`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button onClick={exportTrends} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-900 hover:text-white">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button onClick={exportAnalyticsJson} className="inline-flex items-center gap-2 rounded-xl border border-gray-700 px-3 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-600 hover:bg-gray-900 hover:text-white">
            <Download className="h-4 w-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Readiness score hero */}
      {data.readiness_score > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-950/60 to-violet-950/60 border border-blue-800/30 rounded-2xl p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="w-20 h-20 rounded-full border-4 border-blue-500/40 flex items-center justify-center shrink-0">
            <span className={`text-2xl font-extrabold ${data.readiness_score >= 75 ? "text-emerald-400" : data.readiness_score >= 50 ? "text-amber-400" : "text-rose-400"}`}>
              {data.readiness_score}
            </span>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-1">Career Readiness Score</div>
            <div className="text-lg font-bold text-white">
              {data.readiness_score >= 75 ? "Interview Ready 🚀" : data.readiness_score >= 50 ? "Almost Ready — Keep Practicing" : "Developing — More Practice Needed"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {readinessGap === 0 ? "Goal reached" : `${readinessGap} pts to your ${readinessGoal}/100 goal`}
            </div>
          </div>
          <label className="w-full md:w-56">
            <span className="mb-2 block text-xs font-medium text-gray-400">Readiness goal: {readinessGoal}</span>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              value={readinessGoal}
              onChange={(e) => setReadinessGoal(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </label>
          </div>
        </motion.div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Latest ATS Score" value={data.latest_ats_score ? `${data.latest_ats_score}/100` : "—"} icon={FileText} color="blue" />
        <StatCard title="Avg Interview Score" value={data.avg_interview_score ? `${data.avg_interview_score}/100` : "—"} icon={Mic} color="violet" />
        <StatCard title="Resumes Analyzed" value={data.total_resumes_analyzed} icon={Target} color="emerald" />
        <StatCard title="Interviews Done" value={data.total_interviews} icon={TrendingUp} color="amber" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          ["ATS health", data.latest_ats_score],
          ["Interview readiness", data.avg_interview_score],
          ["Overall readiness", data.readiness_score],
        ].map(([label, score]) => (
          <div key={label as string} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className={`text-sm font-semibold ${scoreTone(score as number | null)}`}>{scoreLabel(score as number | null)}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {momentumCards.map((card) => {
          const delta = formatDelta(card.current, card.previous);
          return (
            <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="text-xs text-gray-500 mb-1">{card.label}</div>
              <div className={cn("text-sm font-semibold", deltaTone(delta))}>{delta}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Analytics Focus</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {focusItems.map((item) => (
            <Link key={item.label} href={item.href} className="rounded-xl border border-gray-800 bg-gray-950/50 p-4 transition hover:border-blue-700/60 hover:bg-gray-800/50">
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="mt-1 text-xs leading-5 text-gray-500">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Score trends */}
      {combinedTrend.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="font-medium text-white mb-4">Score Trends Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={combinedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px" }} labelStyle={{ color: "#fff" }} />
              <Line type="monotone" dataKey="ats" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} name="ATS Score" connectNulls />
              <Line type="monotone" dataKey="interview" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} name="Interview" connectNulls />
              <Line type="monotone" dataKey="match" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} name="Job Match" connectNulls />
              <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 12 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ATS breakdown bar chart */}
      {atsTrend.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="font-medium text-white mb-4">ATS Score History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={atsTrend.map((d) => ({ ...d, date: d.date.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px" }} labelStyle={{ color: "#fff" }} />
              <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="ATS Score" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Bottom row: Donut + Radar */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Interview type donut */}
        {Object.keys(data.interview_by_type).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-medium text-white mb-4">Interview Practice by Type</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={Object.entries(data.interview_by_type).map(([name, value]) => ({ name, value }))}
                  cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                  paddingAngle={3} dataKey="value"
                >
                  {Object.keys(data.interview_by_type).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Skill coverage radar */}
        {(data.skill_coverage.matched + data.skill_coverage.missing) > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 className="font-medium text-white mb-4">Skill Coverage Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={[
                { skill: "Matched", value: data.skill_coverage.matched },
                { skill: "Missing", value: data.skill_coverage.missing },
                { skill: "Critical", value: data.skill_coverage.critical },
                { skill: "ATS Score", value: data.latest_ats_score ?? 0 },
                { skill: "Interview", value: data.avg_interview_score ?? 0 },
              ]}>
                <PolarGrid stroke="#1f2937" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#6b7280", fontSize: 11 }} />
                <Radar name="Coverage" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: "8px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
}
