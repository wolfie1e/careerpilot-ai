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

interface AnalyticsData {
  latest_ats_score: number | null;
  avg_interview_score: number | null;
  total_resumes_analyzed: number;
  total_interviews: number;
  ats_trend: Array<{ date: string; score: number }>;
  interview_trend: Array<{ date: string; score: number }>;
  match_trend: Array<{ date: string; score: number }>;
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

  const hasData = data && (data.ats_trend.length > 0 || data.interview_trend.length > 0);

  if (!hasData) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Analytics</h2>
          <p className="text-sm text-gray-400 mt-1">Score trends and progress tracking</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-12 text-center">
          <BarChart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="font-semibold text-white mb-2">No data yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Upload and analyze a resume, or complete a mock interview session to start seeing your progress here.
          </p>
        </div>
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

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Latest ATS Score" value={data.latest_ats_score ? `${data.latest_ats_score}/100` : "—"} icon={FileText} color="blue" />
        <StatCard title="Avg Interview Score" value={data.avg_interview_score ? `${data.avg_interview_score}/100` : "—"} icon={Mic} color="violet" />
        <StatCard title="Resumes Analyzed" value={data.total_resumes_analyzed} icon={Target} color="emerald" />
        <StatCard title="Interviews Done" value={data.total_interviews} icon={TrendingUp} color="amber" />
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
    </div>
  );
}
