"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Target, Mic, BarChart2, ArrowRight, Upload } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { useAuth } from "@/hooks/useAuth";

const quickActions = [
  { href: "/resume", icon: Upload, label: "Upload Resume", desc: "Add or update your resume", color: "text-blue-400" },
  { href: "/resume", icon: Target, label: "Match Job Description", desc: "Compare with a JD", color: "text-violet-400" },
  { href: "/interview/setup", icon: Mic, label: "Start Mock Interview", desc: "Practice your answers", color: "text-emerald-400" },
  { href: "/analytics", icon: BarChart2, label: "View Analytics", desc: "Track your progress", color: "text-amber-400" },
];

export default function DashboardPage() {
  const { user } = useAuth();

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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="ATS Score" value="—" subtitle="No resume yet" icon={FileText} color="blue" />
        <StatCard title="Best Match" value="—" subtitle="No JD matched yet" icon={Target} color="violet" />
        <StatCard title="Resumes" value="0" subtitle="Uploaded" icon={FileText} color="emerald" />
        <StatCard title="Interviews" value="0" subtitle="Completed" icon={Mic} color="amber" />
        <StatCard title="Avg Score" value="—" subtitle="Interview avg" icon={BarChart2} color="rose" />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl transition-all hover:-translate-y-0.5"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 group-hover:bg-gray-700 transition-colors">
                <action.icon className={`w-4.5 h-4.5 ${action.color}`} />
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

      {/* Empty states */}
      <div className="grid lg:grid-cols-2 gap-4">
        <EmptyPanel
          title="No resumes yet"
          description="Upload your first resume to get your ATS score, section analysis, and improvement suggestions."
          cta="Upload Resume"
          href="/resume"
          icon={FileText}
        />
        <EmptyPanel
          title="No interviews yet"
          description="Start a mock interview to practice your answers and get STAR-evaluated feedback from our AI coach."
          cta="Start Interview"
          href="/interview/setup"
          icon={Mic}
        />
      </div>
    </div>
  );
}

function EmptyPanel({ title, description, cta, href, icon: Icon }: {
  title: string; description: string; cta: string; href: string; icon: typeof FileText;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 border-dashed rounded-2xl p-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-gray-500" />
      </div>
      <h4 className="font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-400 mb-5 max-w-xs mx-auto">{description}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {cta}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
