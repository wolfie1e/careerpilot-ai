"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle, Star, TrendingUp, Mic, FileText } from "lucide-react";

const highlights = [
  "ATS score improvement",
  "Resume-job matching",
  "Voice mock interviews",
  "Skill gap roadmaps",
];

const floatingCards = [
  {
    icon: TrendingUp,
    color: "emerald",
    title: "ATS Score",
    value: "87/100",
    change: "+23 pts",
    top: "10%",
    right: "2%",
    delay: 0.3,
  },
  {
    icon: FileText,
    color: "blue",
    title: "Job Match",
    value: "92%",
    change: "Strong fit",
    top: "45%",
    right: "0%",
    delay: 0.5,
  },
  {
    icon: Mic,
    color: "violet",
    title: "Interview Score",
    value: "8.4/10",
    change: "Excellent",
    top: "75%",
    right: "4%",
    delay: 0.7,
  },
];

const colorMap: Record<string, string> = {
  emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
  blue: "from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400",
  violet: "from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400",
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gray-950 pt-16">
      {/* Gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/5 to-violet-600/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-6"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              AI-powered career acceleration
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight"
            >
              Your AI Career Coach for{" "}
              <span className="gradient-text">Resumes, Interviews</span>
              {" "}and Job Readiness
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg text-gray-400 leading-relaxed max-w-xl"
            >
              Upload your resume, match it with job descriptions, improve your ATS score, and practice interviews with real-time AI feedback.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 grid grid-cols-2 gap-y-2 gap-x-4"
            >
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  {h}
                </li>
              ))}
            </motion.ul>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/register"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                Analyze My Resume
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-6 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white font-semibold rounded-xl transition-all hover:bg-gray-800/50"
              >
                Try Mock Interview
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-xs text-gray-500"
            >
              Free to start · No credit card required · Your data is processed securely
            </motion.p>
          </div>

          {/* Right — floating cards */}
          <div className="relative h-[480px] hidden lg:block">
            {/* Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute inset-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="flex-1 mx-3 h-5 bg-gray-800 rounded-md" />
              </div>
              <div className="p-5 grid grid-cols-2 gap-3">
                {["ATS Score", "Job Match", "Interview", "Skill Gap"].map((label, i) => (
                  <div key={label} className="bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
                    <div className="text-xs text-gray-500 mb-1">{label}</div>
                    <div className={`text-xl font-bold ${i % 2 === 0 ? "text-blue-400" : "text-violet-400"}`}>
                      {["87%", "92%", "8.4", "4/12"][i]}
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-gray-700">
                      <div
                        className={`h-1.5 rounded-full ${i % 2 === 0 ? "bg-blue-500" : "bg-violet-500"}`}
                        style={{ width: ["87%", "92%", "84%", "33%"][i] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5">
                <div className="h-24 bg-gray-800/40 rounded-xl border border-gray-700/30 flex items-end p-3 gap-1">
                  {[30, 55, 45, 70, 60, 85, 75, 90].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500/60 rounded-sm"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating stat cards */}
            {floatingCards.map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: card.delay }}
                style={{ top: card.top, right: card.right }}
                className={`absolute bg-gradient-to-br ${colorMap[card.color]} border rounded-xl p-3 shadow-xl backdrop-blur-sm min-w-[120px]`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <card.icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium text-gray-300">{card.title}</span>
                </div>
                <div className="text-lg font-bold text-white">{card.value}</div>
                <div className="text-xs text-gray-400">{card.change}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
