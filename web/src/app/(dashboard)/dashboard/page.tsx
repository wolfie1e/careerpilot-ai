"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Award, BookOpen, Building2, FileText, Target, Mic, BarChart2, ArrowRight, Upload, TrendingUp, CheckCircle, X, Flame, ListChecks, RefreshCw, Download, BriefcaseBusiness, NotebookPen, UsersRound, Medal, Handshake } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { CopyButton } from "@/components/shared/CopyButton";
import { useAuth } from "@/hooks/useAuth";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { api } from "@/lib/api-client";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";
import { downloadJson } from "@/lib/export-utils";
import { formatDelta, formatRelativeTime, scoreColor, cn } from "@/lib/utils";
import type { PlannerTask } from "@/lib/career-planner";
import type { JobApplication } from "@/lib/application-tracker";
import type { WeeklyReview } from "@/lib/weekly-review";
import type { NetworkingContact } from "@/lib/networking";
import type { CareerGoal } from "@/lib/career-goals";
import type { OfferComparison } from "@/lib/offer-tracker";
import type { AchievementStory } from "@/lib/achievement-vault";
import { certificationRemainingStudyHours, certificationTotalCost, isCertificationActive, isCertificationExpiring, type CertificationRecord } from "@/lib/certification-tracker";
import { learningRemainingHours, learningTotalCost, type LearningResource } from "@/lib/learning-path";
import { mentorshipAverageConfidence, mentorshipConversationTotal, mentorshipFollowUpDueCount, nextMentorshipContact, type MentorshipContact } from "@/lib/mentorship";
import { companyAverageFit, companyOpenRoleTotal, isCompanyActionDue, topTargetCompany, type TargetCompany } from "@/lib/target-companies";

interface AnalyticsData {
  latest_ats_score: number | null;
  avg_interview_score: number | null;
  total_resumes_analyzed: number;
  total_interviews: number;
  readiness_score: number;
  ats_trend: Array<{ date: string; score: number }>;
  interview_trend: Array<{ date: string; score: number }>;
  match_trend: Array<{ date: string; score: number }>;
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
  { key: "plan", label: "Add a career action", href: "/planner", done: false },
  { key: "learning", label: "Add a learning resource", href: "/learning", done: false },
  { key: "application", label: "Track a job opportunity", href: "/applications", done: false },
  { key: "review", label: "Complete a weekly review", href: "/review", done: false },
  { key: "networking", label: "Add a networking contact", href: "/networking", done: false },
  { key: "mentorship", label: "Add a mentorship contact", href: "/mentorship", done: false },
  { key: "goal", label: "Create a career goal", href: "/goals", done: false },
  { key: "offer", label: "Compare an offer", href: "/offers", done: false },
  { key: "achievement", label: "Capture an achievement", href: "/achievements", done: false },
  { key: "certification", label: "Plan a certification", href: "/certifications", done: false },
  { key: "company", label: "Research a target company", href: "/companies", done: false },
];

const quickActions = [
  { href: "/resume", icon: Upload, label: "Upload Resume", desc: "Add or update your resume", color: "text-blue-400" },
  { href: "/resume?tab=jd", icon: Target, label: "Match a Job Description", desc: "Compare with a JD", color: "text-violet-400" },
  { href: "/interview/setup", icon: Mic, label: "Start Mock Interview", desc: "Practice your answers", color: "text-emerald-400" },
  { href: "/analytics", icon: BarChart2, label: "View Analytics", desc: "Track your progress", color: "text-amber-400" },
  { href: "/planner", icon: ListChecks, label: "Open Career Planner", desc: "Focus your next actions", color: "text-blue-400" },
  { href: "/learning", icon: BookOpen, label: "Build Learning Path", desc: "Plan courses, books, and practice", color: "text-cyan-400" },
  { href: "/applications", icon: BriefcaseBusiness, label: "Track Applications", desc: "Manage your opportunity pipeline", color: "text-emerald-400" },
  { href: "/review", icon: NotebookPen, label: "Complete Weekly Review", desc: "Reflect and choose the next focus", color: "text-violet-400" },
  { href: "/networking", icon: UsersRound, label: "Manage Network", desc: "Track contacts and warm follow-ups", color: "text-cyan-400" },
  { href: "/mentorship", icon: Handshake, label: "Track Mentorship", desc: "Manage mentors and recurring conversations", color: "text-emerald-400" },
  { href: "/goals", icon: Target, label: "Set Career Goals", desc: "Track outcomes and deadlines", color: "text-rose-400" },
  { href: "/offers", icon: BriefcaseBusiness, label: "Compare Offers", desc: "Evaluate compensation tradeoffs", color: "text-amber-400" },
  { href: "/achievements", icon: Medal, label: "Capture Achievements", desc: "Build reusable STAR stories", color: "text-fuchsia-400" },
  { href: "/certifications", icon: Award, label: "Plan Certifications", desc: "Track exams, credentials, and renewals", color: "text-cyan-400" },
  { href: "/companies", icon: Building2, label: "Research Companies", desc: "Build and prioritize your target list", color: "text-emerald-400" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function previousDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function getPracticeStreak(sessions: Session[]) {
  const sessionDays = [...new Set(sessions.map((session) => session.created_at.slice(0, 10)))].sort().reverse();
  if (sessionDays.length === 0) return 0;

  let expectedDay = sessionDays[0];
  let streak = 0;
  for (const day of sessionDays) {
    if (day !== expectedDay) break;
    streak += 1;
    expectedDay = previousDateKey(expectedDay);
  }
  return streak;
}

function getFocusItems(analytics: AnalyticsData | null, resumes: Resume[], sessions: Session[]) {
  const latestAts = analytics?.latest_ats_score ?? null;
  const latestMatch = analytics?.match_trend?.at(-1)?.score ?? null;
  const avgInterview = analytics?.avg_interview_score ?? null;

  if (resumes.length === 0) {
    return [{ href: "/resume", label: "Upload a resume", desc: "Create your first baseline before matching jobs." }];
  }

  const items = [];
  if (latestAts === null) {
    items.push({ href: "/resume", label: "Run a resume analysis", desc: "Unlock ATS scoring and priority edits." });
  } else if (latestAts < 75) {
    items.push({ href: "/resume?tab=ats", label: "Improve ATS coverage", desc: `Latest ATS score is ${latestAts}/100.` });
  }

  if (latestMatch === null) {
    items.push({ href: "/resume?tab=jd", label: "Match a target JD", desc: "Find missing skills for your next application." });
  } else if (latestMatch < 75) {
    items.push({ href: "/resume?tab=jd", label: "Close JD skill gaps", desc: `Latest job match is ${latestMatch}/100.` });
  }

  if (sessions.length === 0) {
    items.push({ href: "/interview/setup", label: "Complete a mock interview", desc: "Start tracking answer readiness." });
  } else if (avgInterview !== null && avgInterview < 75) {
    items.push({ href: "/interview/history", label: "Review interview feedback", desc: `Average interview score is ${avgInterview}/100.` });
  }

  return items.slice(0, 3);
}

function fetchDashboardData() {
  return Promise.all([
    api.get<AnalyticsData>("/analytics"),
    api.get<Resume[]>("/resume"),
    api.get<{ sessions: Session[] }>("/interview/history").then((data) => data.sessions || []),
  ]);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useLocalStorage(LOCAL_STORAGE_KEYS.onboardingDismissed, false);
  const [plannerTasks] = useLocalStorage<PlannerTask[]>(LOCAL_STORAGE_KEYS.plannerTasks, []);
  const [jobApplications] = useLocalStorage<JobApplication[]>(LOCAL_STORAGE_KEYS.jobApplications, []);
  const [weeklyReviews] = useLocalStorage<WeeklyReview[]>(LOCAL_STORAGE_KEYS.weeklyReviews, []);
  const [networkingContacts] = useLocalStorage<NetworkingContact[]>(LOCAL_STORAGE_KEYS.networkingContacts, []);
  const [careerGoals] = useLocalStorage<CareerGoal[]>(LOCAL_STORAGE_KEYS.careerGoals, []);
  const [offerComparisons] = useLocalStorage<OfferComparison[]>(LOCAL_STORAGE_KEYS.offerComparisons, []);
  const [achievementStories] = useLocalStorage<AchievementStory[]>(LOCAL_STORAGE_KEYS.achievementStories, []);
  const [certificationRecords] = useLocalStorage<CertificationRecord[]>(LOCAL_STORAGE_KEYS.certificationRecords, []);
  const [learningResources] = useLocalStorage<LearningResource[]>(LOCAL_STORAGE_KEYS.learningResources, []);
  const [mentorshipContacts] = useLocalStorage<MentorshipContact[]>(LOCAL_STORAGE_KEYS.mentorshipContacts, []);
  const [targetCompanies] = useLocalStorage<TargetCompany[]>(LOCAL_STORAGE_KEYS.targetCompanies, []);
  const nextMentorship = nextMentorshipContact(mentorshipContacts);

  useEffect(() => {
    fetchDashboardData()
      .then(([analyticsData, resumeData, sessionData]) => {
        setAnalytics(analyticsData);
        setResumes(resumeData);
        setSessions(sessionData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function refreshDashboard() {
    setRefreshing(true);
    try {
      const [analyticsData, resumeData, sessionData] = await fetchDashboardData();
      setAnalytics(analyticsData);
      setResumes(resumeData);
      setSessions(sessionData);
    } finally {
      setRefreshing(false);
    }
  }

  const stepsCompleted = [
    resumes.length > 0,
    (analytics?.total_resumes_analyzed ?? 0) > 0,
    (analytics?.ats_trend?.length ?? 0) > 0,
    sessions.length > 0,
    plannerTasks.length > 0,
    learningResources.length > 0,
    jobApplications.length > 0,
    weeklyReviews.length > 0,
    networkingContacts.length > 0,
    mentorshipContacts.length > 0,
    careerGoals.length > 0,
    offerComparisons.length > 0,
    achievementStories.length > 0,
    certificationRecords.length > 0,
    targetCompanies.length > 0,
  ].filter(Boolean).length;

  const showOnboarding = !onboardingDismissed && stepsCompleted < ONBOARDING_STEPS.length;
  const latestAts = analytics?.ats_trend?.at(-1)?.score ?? null;
  const previousAts = analytics?.ats_trend?.at(-2)?.score ?? null;
  const latestMatch = analytics?.match_trend?.at(-1)?.score ?? null;
  const bestMatch = analytics?.match_trend?.length ? Math.max(...analytics.match_trend.map((item) => item.score)) : null;
  const practiceStreak = getPracticeStreak(sessions);
  const atsDelta = formatDelta(latestAts, previousAts);
  const atsTrend = atsDelta.startsWith("+") ? "up" : atsDelta.startsWith("-") ? "down" : "neutral";
  const nextStep =
    resumes.length === 0
      ? { href: "/resume", label: "Upload a resume", desc: "Start with an ATS scan and section feedback." }
      : sessions.length === 0
        ? { href: "/interview/setup", label: "Practice an interview", desc: "Turn your resume work into answer confidence." }
        : { href: "/analytics", label: "Review progress", desc: "Compare score trends and choose your next focus area." };
  const focusItems = getFocusItems(analytics, resumes, sessions);
  const focusPlanText = focusItems.map((item, index) => `${index + 1}. ${item.label} - ${item.desc}`).join("\n");
  const readinessScore = analytics?.readiness_score ?? 0;
  const readinessLabel = readinessScore >= 85 ? "Application ready" : readinessScore >= 70 ? "Nearly ready" : readinessScore >= 50 ? "Needs polish" : "Build the basics";
  const networkingFollowUpsDue = networkingContacts.filter((contact) => contact.nextFollowUpAt && contact.nextFollowUpAt <= new Date().toISOString().slice(0, 10) && !contact.archived).length;

  function dismissOnboarding() {
    setOnboardingDismissed(true);
  }

  function exportDashboardSnapshot() {
    downloadJson("careerpilot-dashboard-snapshot.json", {
      exported_at: new Date().toISOString(),
      user: user?.username || user?.full_name || null,
      readiness_score: analytics?.readiness_score ?? null,
      latest_ats_score: analytics?.latest_ats_score ?? null,
      best_match_score: bestMatch,
      latest_match_score: latestMatch,
      average_interview_score: analytics?.avg_interview_score ?? null,
      resumes_uploaded: resumes.length,
      interviews_completed: analytics?.total_interviews ?? sessions.length,
      practice_streak_days: practiceStreak,
      open_planner_actions: plannerTasks.filter((task) => task.status !== "done").length,
      learning_resources: learningResources.filter((resource) => resource.status !== "archived").length,
      learning_in_progress: learningResources.filter((resource) => resource.status === "in_progress").length,
      learning_completed: learningResources.filter((resource) => resource.status === "completed").length,
      learning_hours_remaining: learningRemainingHours(learningResources),
      learning_budget_total: learningTotalCost(learningResources),
      active_job_applications: jobApplications.filter((application) => !application.archived && !["offer", "rejected", "withdrawn"].includes(application.stage)).length,
      weekly_reviews_completed: weeklyReviews.length,
      networking_contacts: networkingContacts.filter((contact) => !contact.archived).length,
      networking_follow_ups_due: networkingFollowUpsDue,
      mentorship_contacts: mentorshipContacts.filter((contact) => contact.status !== "archived").length,
      mentorship_follow_ups_due: mentorshipFollowUpDueCount(mentorshipContacts),
      mentorship_conversations: mentorshipConversationTotal(mentorshipContacts),
      mentorship_average_confidence: mentorshipAverageConfidence(mentorshipContacts),
      target_companies: targetCompanies.filter((company) => company.stage !== "archived").length,
      target_company_actions_due: targetCompanies.filter((company) => isCompanyActionDue(company)).length,
      target_company_open_roles: companyOpenRoleTotal(targetCompanies),
      next_mentorship_contact: nextMentorship,
      career_goals: careerGoals.filter((goal) => goal.status !== "archived").length,
      completed_career_goals: careerGoals.filter((goal) => goal.status === "completed").length,
      active_offers: offerComparisons.filter((offer) => !["accepted", "declined", "archived"].includes(offer.status)).length,
      negotiating_offers: offerComparisons.filter((offer) => offer.status === "negotiating").length,
      achievement_stories: achievementStories.filter((story) => story.status !== "archived").length,
      ready_achievement_stories: achievementStories.filter((story) => story.status === "ready").length,
      certification_records: certificationRecords.filter((record) => record.status !== "archived").length,
      earned_certifications: certificationRecords.filter((record) => record.status === "earned").length,
      expiring_certifications: certificationRecords.filter((record) => isCertificationExpiring(record)).length,
      certification_study_hours_remaining: certificationRemainingStudyHours(certificationRecords),
      certification_budget_total: certificationTotalCost(certificationRecords),
      recommended_next_step: nextStep,
      priority_focus: focusItems,
    });
  }

  function exportRecentActivity() {
    downloadJson("careerpilot-recent-activity.json", {
      exported_at: new Date().toISOString(),
      recent_resumes: resumes.slice(0, 5),
      recent_interviews: sessions.slice(0, 5),
      recent_networking_contacts: networkingContacts
        .filter((contact) => !contact.archived)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recent_mentorship_contacts: mentorshipContacts
        .filter((contact) => contact.status !== "archived")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recent_target_companies: targetCompanies
        .filter((company) => company.stage !== "archived")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recent_career_goals: careerGoals
        .filter((goal) => goal.status !== "archived")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recent_offers: offerComparisons
        .filter((offer) => offer.status !== "archived")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recent_achievement_stories: achievementStories
        .filter((story) => story.status !== "archived")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recent_certifications: certificationRecords
        .filter((record) => record.status !== "archived")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
      recent_learning_resources: learningResources
        .filter((resource) => resource.status !== "archived")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 5),
    });
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
        <h2 className="text-xl font-semibold text-white">
          Good {getGreeting()},{" "}
          <span className="gradient-text">{user?.full_name || user?.username || "there"}</span> 👋
        </h2>
        <p className="text-gray-400 text-sm mt-1">Here&apos;s your career readiness snapshot</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {!loading && (
            <button onClick={exportDashboardSnapshot} className="inline-flex items-center gap-2 rounded-xl border border-gray-800 px-3 py-2 text-xs font-semibold text-gray-400 transition hover:bg-gray-900 hover:text-white">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          )}
          <button onClick={refreshDashboard} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-gray-800 px-3 py-2 text-xs font-semibold text-gray-400 transition hover:bg-gray-900 hover:text-white disabled:opacity-50">
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
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
                <span>Progress</span><span>{stepsCompleted}/{ONBOARDING_STEPS.length} complete</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full">
                <motion.div
                  className="h-1.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                  animate={{ width: `${(stepsCompleted / ONBOARDING_STEPS.length) * 100}%` }}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
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
              value={bestMatch !== null ? `${bestMatch}/100` : "—"}
              subtitle={latestMatch !== null ? `Latest ${latestMatch}/100` : "No JD match yet"}
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
            <StatCard
              title="Streak" icon={Flame} color="amber"
              value={practiceStreak}
              subtitle={practiceStreak === 1 ? "practice day" : "practice days"}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/planner" className="rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:border-blue-700/60">
          <div className="text-xs text-gray-500">Open planner actions</div>
          <div className="mt-1 text-2xl font-bold text-white">{plannerTasks.filter((task) => task.status !== "done" && !task.archived).length}</div>
          <div className="mt-1 text-xs text-gray-500">{plannerTasks.filter((task) => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "done").length} overdue</div>
        </Link>
        <Link href="/learning" className="rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:border-cyan-700/60">
          <div className="text-xs text-gray-500">Learning resources</div>
          <div className="mt-1 text-2xl font-bold text-white">{learningResources.filter((resource) => resource.status !== "archived").length}</div>
          <div className="mt-1 text-xs text-gray-500">{learningResources.filter((resource) => resource.status === "in_progress").length} in progress</div>
        </Link>
        <Link href="/applications" className="rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:border-emerald-700/60">
          <div className="text-xs text-gray-500">Active applications</div>
          <div className="mt-1 text-2xl font-bold text-white">{jobApplications.filter((application) => !application.archived && !["offer", "rejected", "withdrawn"].includes(application.stage)).length}</div>
          <div className="mt-1 text-xs text-gray-500">{jobApplications.filter((application) => application.followUpAt && application.followUpAt <= new Date().toISOString().slice(0, 10)).length} follow-ups due</div>
        </Link>
        <Link href="/networking" className="rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:border-cyan-700/60">
          <div className="text-xs text-gray-500">Networking contacts</div>
          <div className="mt-1 text-2xl font-bold text-white">{networkingContacts.filter((contact) => !contact.archived).length}</div>
          <div className="mt-1 text-xs text-gray-500">{networkingFollowUpsDue} follow-ups due</div>
        </Link>
        <Link href="/mentorship" className="rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:border-emerald-700/60">
          <div className="text-xs text-gray-500">Mentorship contacts</div>
          <div className="mt-1 text-2xl font-bold text-white">{mentorshipContacts.filter((contact) => contact.status !== "archived").length}</div>
          <div className="mt-1 text-xs text-gray-500">{mentorshipContacts.filter((contact) => contact.status === "active").length} active</div>
        </Link>
        <Link href="/goals" className="rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:border-rose-700/60">
          <div className="text-xs text-gray-500">Career goals</div>
          <div className="mt-1 text-2xl font-bold text-white">{careerGoals.filter((goal) => goal.status === "active").length}</div>
          <div className="mt-1 text-xs text-gray-500">{careerGoals.filter((goal) => goal.status === "completed").length} completed</div>
        </Link>
        <Link href="/offers" className="rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:border-amber-700/60">
          <div className="text-xs text-gray-500">Active offers</div>
          <div className="mt-1 text-2xl font-bold text-white">{offerComparisons.filter((offer) => !["accepted", "declined", "archived"].includes(offer.status)).length}</div>
          <div className="mt-1 text-xs text-gray-500">{offerComparisons.filter((offer) => offer.status === "negotiating").length} negotiating</div>
        </Link>
        <Link href="/achievements" className="rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:border-fuchsia-700/60">
          <div className="text-xs text-gray-500">Achievement stories</div>
          <div className="mt-1 text-2xl font-bold text-white">{achievementStories.filter((story) => story.status !== "archived").length}</div>
          <div className="mt-1 text-xs text-gray-500">{achievementStories.filter((story) => story.status === "ready").length} ready</div>
        </Link>
        <Link href="/certifications" className="rounded-2xl border border-gray-800 bg-gray-900 p-5 transition hover:border-cyan-700/60">
          <div className="text-xs text-gray-500">Certifications</div>
          <div className="mt-1 text-2xl font-bold text-white">{certificationRecords.filter((record) => record.status !== "archived").length}</div>
          <div className="mt-1 text-xs text-gray-500">{certificationRecords.filter((record) => isCertificationActive(record)).length} active · {certificationRecords.filter((record) => isCertificationExpiring(record)).length} renewals</div>
        </Link>
      </div>

      {!loading && (
        <div className="flex items-center gap-2">
        <Link
          href={nextStep.href}
          className="flex flex-1 items-center justify-between gap-4 bg-gray-900 border border-gray-800 hover:border-blue-700/60 rounded-2xl px-5 py-4 transition-colors"
        >
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Recommended Next Step</div>
            <div className="text-sm font-semibold text-white">{nextStep.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{nextStep.desc}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 shrink-0" />
        </Link>
        <CopyButton value={`${nextStep.label} - ${nextStep.desc}`} label="Copy next step" />
        </div>
      )}

      {!loading && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500">Readiness Pulse</div>
              <div className="mt-1 text-sm font-semibold text-white">{readinessLabel}</div>
            </div>
            <div className="text-2xl font-bold text-white">{readinessScore}<span className="text-sm text-gray-500">/100</span></div>
          </div>
          <div className="h-2 rounded-full bg-gray-800">
            <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${Math.min(readinessScore, 100)}%` }} />
          </div>
        </div>
      )}

      {!loading && focusItems.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Priority Focus</h3>
            </div>
            <CopyButton value={focusPlanText} label="Copy plan" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {focusItems.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-xl border border-gray-800 bg-gray-950/40 p-4 transition hover:border-blue-700/60 hover:bg-gray-800/50">
                <div className="text-sm font-semibold text-white">{item.label}</div>
                <div className="mt-1 text-xs leading-5 text-gray-500">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
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
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Recent Activity</h3>
        <button onClick={exportRecentActivity} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-white disabled:opacity-40">
          <Download className="h-3.5 w-3.5" />
          Export activity
        </button>
      </div>
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
