"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Target, Mic, BarChart2, ArrowRight, Upload, TrendingUp, CheckCircle, X } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { useAuth } from "@/hooks/useAuth";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { api } from "@/lib/api-client";
import { formatDelta, formatRelativeTime, scoreColor, cn } from "@/lib/utils";

interface AnalyticsData {
  latest_ats_score: number | null;
  avg_interview_score: number | null;
  total_resumes_analyzed: number;
  total_interviews: number;
  readiness_score: number;
  ats_trend: Array<{ date: string; score: number }>;
  interview_trend: Array<{ date: string; score: number }>;
}

interface Resume {
  id: string;
  filename: string;
  created_at: string;
}

interface Session {
  id: string;
  role_title: string;
  overall_score: number | null;
  created_at: string;
  interview_type: string;
}

const ONBOARDING_STEPS = [
  { key: "upload", label: "Upload your resume", href: "/resume", done: false },
  { key: "analyze", label: "Run a resume analysis", href: "/resume", done: false },
  { key: "match", label: "Match with a job description", href: "/resume", done: false },
  { key: "interview", label: "Complete a mock interview", href: "/interview/setup", done: false },
];

const ONBOARDING_KEY = "careerpilot_onboarding_dismissed";

const quickActions = [
  { href: "/resume", icon: Upload, label: "Upload Resume", desc: "Add or update your resume", color: "text-blue-400" },
  { href: "/resume", icon: Target, label: "Match a Job Description", desc: "Compare with a JD", color: "text-violet-400" },
  { href: "/interview/setup", icon: Mic, label: "Start Mock Interview", desc: "Practice your answers", color: "text-emerald-400" },
  { href: "/analytics", icon: BarChart2, label: "View Analytics", desc: "Track your progress", color: "text-amber-400" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingDismissed, setOnboardingDismissed] = useLocalStorage(ONBOARDING_KEY, false);

  useEffect(() => {
    Promise.all([
      api.get<AnalyticsData>("/analytics"),
      api.get<Resume[]>("/resume"),
      api.get<{ sessions: Session[] }>("/interview/history").then((d) => d.sessions || []),
    ])
      .then(([analyticsData, resumeData, sessionData]) => {
        setAnalytics(analyticsData);
        setResumes(resumeData);
        setSessions(sessionData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stepsCompleted = [
    resumes.length > 0,
    (analytics?.total_resumes_analyzed ?? 0) > 0,
    (analytics?.ats_trend?.length ?? 0) > 0,
    sessions.length > 0,
  ].filter(Boolean).length;

  const showOnboarding = !onboardingDismissed && stepsCompleted < 4;
  const latestAts = analytics?.ats_trend?.at(-1)?.score ?? null;
  const previousAts = analytics?.ats_trend?.at(-2)?.score ?? null;
  const atsDelta = formatDelta(latestAts, previousAts);
  const atsTrend = atsDelta.startsWith("+") ? "up" : atsDelta.startsWith("-") ? "down" : "neutral";
  const nextStep =
    resumes.length === 0
      ? { href: "/resume", label: "Upload a resume", desc: "Start with an ATS scan and section feedback." }
      : sessions.length === 0
        ? { href: "/interview/setup", label: "Practice an interview", desc: "Turn your resume work into answer confidence." }
        : { href: "/analytics", label: "Review progress", desc: "Compare score trends and choose your next focus area." };

  function dismissOnboarding() {
    setOnboardingDismissed(true);
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-semibold text-white">
          Good {getGreeting()},{" "}
          <span className="gradient-text">{user?.full_name || user?.username || "there"}</span> 👋
        </h2>
        <p className="text-gray-400 text-sm mt-1">Here&apos;s your career readiness snapshot</p>
      </motion.div>

      {/* Onboarding checklist */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-br from-blue-950/60 to-violet-950/60 border border-blue-800/40 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-white text-sm">Get started with CareerPilot AI</h3>
                <p className="text-xs text-gray-400 mt-0.5">Complete these steps to unlock your full career toolkit</p>
              </div>
              <button onClick={dismissOnboarding} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Progress</span><span>{stepsCompleted}/4 complete</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full">
                <motion.div
                  className="h-1.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                  animate={{ width: `${(stepsCompleted / 4) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {ONBOARDING_STEPS.map((step, i) => {
                const done = i < stepsCompleted;
                return (
                  <Link
                    key={step.key}
                    href={done ? "#" : step.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                      done ? "opacity-50 cursor-default" : "hover:bg-white/5 hover:border-blue-500/30",
                      "border border-gray-800"
                    )}
                  >
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 border",
                      done ? "bg-emerald-500/20 border-emerald-500/40" : "bg-gray-800 border-gray-700")}>
                      {done ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <span className="text-xs text-gray-600">{i + 1}</span>}
                    </div>
                    <span className={done ? "line-through text-gray-500" : "text-gray-300"}>{step.label}</span>
                    {!done && <ArrowRight className="w-3 h-3 text-gray-600 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="ATS Score" icon={FileText} color="blue"
              value={analytics?.latest_ats_score ? `${analytics.latest_ats_score}/100` : "—"}
              subtitle={analytics?.latest_ats_score ? "Latest scan" : "No resume yet"}
              trend={latestAts !== null && previousAts !== null ? atsTrend : undefined}
              trendValue={latestAts !== null && previousAts !== null ? atsDelta : undefined}
            />
            <StatCard
              title="Job Match" icon={Target} color="violet"
              value={analytics?.ats_trend?.length ? "View →" : "—"}
              subtitle="Best match score"
            />
            <StatCard
              title="Resumes" icon={FileText} color="emerald"
              value={resumes.length}
              subtitle="Uploaded"
            />
            <StatCard
              title="Interviews" icon={Mic} color="amber"
              value={analytics?.total_interviews ?? 0}
              subtitle="Completed"
            />
            <StatCard
              title="Avg Score" icon={TrendingUp} color="rose"
              value={analytics?.avg_interview_score ? `${analytics.avg_interview_score}/100` : "—"}
              subtitle="Interview avg"
            />
          </>
        )}
      </div>

      {!loading && (
        <Link
          href={nextStep.href}
          className="flex items-center justify-between gap-4 bg-gray-900 border border-gray-800 hover:border-blue-700/60 rounded-2xl px-5 py-4 transition-colors"
        >
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Recommended Next Step</div>
            <div className="text-sm font-semibold text-white">{nextStep.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{nextStep.desc}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 shrink-0" />
        </Link>
      )}

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="group flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl transition-all hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-gray-700 transition-colors">
                <action.icon className={`w-4 h-4 ${action.color}`} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white">{action.label}</div>
                <div className="text-xs text-gray-500 truncate">{action.desc}</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-600 ml-auto shrink-0 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent resumes */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Recent Resumes</h3>
            <Link href="/resume" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all →</Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-2 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-12 bg-gray-800 rounded-lg" />)}
            </div>
          ) : resumes.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <FileText className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No resumes uploaded yet</p>
              <Link href="/resume" className="text-xs text-blue-400 hover:text-blue-300">Upload your first resume →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {resumes.slice(0, 3).map((r) => (
                <Link key={r.id} href="/resume" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{r.filename}</div>
                    <div className="text-xs text-gray-500">{formatRelativeTime(r.created_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent interviews */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Recent Interviews</h3>
            <Link href="/interview/history" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all →</Link>
          </div>
          {loading ? (
            <div className="p-4 space-y-2 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-12 bg-gray-800 rounded-lg" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Mic className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No interviews completed yet</p>
              <Link href="/interview/setup" className="text-xs text-blue-400 hover:text-blue-300">Start your first interview →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {sessions.slice(0, 3).map((s) => (
                <Link key={s.id} href={`/interview/history/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{s.role_title}</div>
                    <div className="text-xs text-gray-500">{s.interview_type} · {formatRelativeTime(s.created_at)}</div>
                  </div>
                  {s.overall_score !== null && (
                    <span className={cn("text-xs font-bold", scoreColor(s.overall_score))}>{s.overall_score}/100</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
