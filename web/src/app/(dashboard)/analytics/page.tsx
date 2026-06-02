"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, Mic, FileText, Target, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import StatCard from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { scoreLabel, scoreTone } from "@/lib/utils";

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

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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
  const allDates = [...new Set([
    ...data.ats_trend.map((d) => d.date),
    ...data.interview_trend.map((d) => d.date),
    ...data.match_trend.map((d) => d.date),
  ])].sort();

  const combinedTrend = allDates.map((date) => ({
    date: date.slice(5),
    ats: data.ats_trend.find((d) => d.date === date)?.score ?? null,
    interview: data.interview_trend.find((d) => d.date === date)?.score ?? null,
    match: data.match_trend.find((d) => d.date === date)?.score ?? null,
  }));

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Your career readiness over time</p>
      </div>

      {/* Readiness score hero */}
      {data.readiness_score > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-950/60 to-violet-950/60 border border-blue-800/30 rounded-2xl p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-4 border-blue-500/40 flex items-center justify-center shrink-0">
            <span className={`text-2xl font-extrabold ${data.readiness_score >= 75 ? "text-emerald-400" : data.readiness_score >= 50 ? "text-amber-400" : "text-rose-400"}`}>
              {data.readiness_score}
            </span>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Career Readiness Score</div>
            <div className="text-lg font-bold text-white">
              {data.readiness_score >= 75 ? "Interview Ready 🚀" : data.readiness_score >= 50 ? "Almost Ready — Keep Practicing" : "Developing — More Practice Needed"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Weighted blend of ATS score, interview score, and job match</div>
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
      {data.ats_trend.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="font-medium text-white mb-4">ATS Score History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.ats_trend.map((d) => ({ ...d, date: d.date.slice(5) }))}>
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
