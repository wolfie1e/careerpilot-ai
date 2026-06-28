"use client";

import { motion } from "framer-motion";
import { Award, Building2, FileText, Target, TrendingUp, Mic, BarChart2, GitBranch, Sparkles, BookOpen, Library, ListChecks, BriefcaseBusiness, NotebookPen, UserCheck, UsersRound, Medal, Handshake } from "lucide-react";

const features = [
  {
    icon: FileText,
    color: "blue",
    title: "Resume Analysis",
    description: "Get section-by-section quality scores, identify weak bullet points, and receive specific improvement suggestions with priority fixes.",
  },
  {
    icon: Target,
    color: "violet",
    title: "Job Description Matching",
    description: "Paste any job description and instantly see your match percentage, semantic similarity score, and exactly what's holding you back.",
  },
  {
    icon: TrendingUp,
    color: "emerald",
    title: "ATS Score Calculator",
    description: "7-category rubric scoring with full breakdown. Know exactly why you're failing ATS filters and what to fix — no guesswork.",
  },
  {
    icon: GitBranch,
    color: "amber",
    title: "Skill Gap Detection",
    description: "See matched vs. missing skills side by side. Get a personalized week-by-week learning roadmap to close the gap for your target role.",
  },
  {
    icon: Sparkles,
    color: "rose",
    title: "AI Bullet Rewriter",
    description: "Transform vague bullets into impact-driven achievements. Before/after comparison with keyword injection and measurable outcome scoring.",
  },
  {
    icon: BookOpen,
    color: "cyan",
    title: "Project Recommendations",
    description: "Get tailored portfolio project ideas based on your missing skills. Each project comes with a tech stack, timeline, and ready-to-use resume bullet.",
  },
  {
    icon: Mic,
    color: "indigo",
    title: "Voice Mock Interviews",
    description: "Record your answers in the browser. Audio gets transcribed and evaluated against STAR rubric in real time. Train until interview-ready.",
  },
  {
    icon: BarChart2,
    color: "teal",
    title: "Progress Analytics",
    description: "Track your ATS score trend, interview score improvement, and skill gap closure over time with interactive charts and readiness metrics.",
  },
  {
    icon: ListChecks,
    color: "blue",
    title: "Career Action Planner",
    description: "Turn insights into prioritized, recurring actions with deadlines, effort estimates, tags, and portable plans.",
  },
  {
    icon: BookOpen,
    color: "cyan",
    title: "Learning Path",
    description: "Organize courses, books, projects, and practice resources with progress, deadlines, skill areas, and planner handoff.",
  },
  {
    icon: Building2,
    color: "emerald",
    title: "Target Company Research",
    description: "Prioritize a company shortlist with fit, interest, research depth, contacts, open roles, and clear next actions.",
  },
  {
    icon: UserCheck,
    color: "emerald",
    title: "Professional References",
    description: "Prepare trusted advocates with permission status, relationship context, supporting stories, strengths, and follow-up reminders.",
  },
  {
    icon: Library,
    color: "violet",
    title: "Interview Question Bank",
    description: "Build reusable answer outlines, track confidence and difficulty, and revisit weak questions with spaced review.",
  },
  {
    icon: BriefcaseBusiness,
    color: "emerald",
    title: "Application Pipeline",
    description: "Track opportunities, contacts, follow-ups, upcoming interviews, next actions, and response rates in one focused workspace.",
  },
  {
    icon: NotebookPen,
    color: "violet",
    title: "Weekly Career Review",
    description: "Capture wins, blockers, lessons, confidence, and next week's focus while reviewing your real activity.",
  },
  {
    icon: UsersRound,
    color: "cyan",
    title: "Networking Follow-ups",
    description: "Manage contacts, relationship strength, warm follow-ups, tags, LinkedIn links, and planner-ready outreach tasks.",
  },
  {
    icon: Handshake,
    color: "emerald",
    title: "Mentorship Tracker",
    description: "Track mentors, advisors, peers, goals, conversation cadence, follow-ups, topics, and planner-ready next steps.",
  },
  {
    icon: Medal,
    color: "rose",
    title: "Achievement Vault",
    description: "Capture reusable STAR stories with metrics, tags, confidence, and export-ready interview examples.",
  },
  {
    icon: Award,
    color: "cyan",
    title: "Certification Tracker",
    description: "Plan certification attempts, track study progress, store credential proof, and monitor renewal windows.",
  },
];

const colorMap: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20",
  violet: "bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20",
  emerald: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20",
  rose: "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20",
  cyan: "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20",
  indigo: "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20",
  teal: "bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20",
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
            Platform Features
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything you need to land the job
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            From resume quality to interview confidence — CareerPilot AI covers the full career preparation journey in one platform.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group bg-gray-900/60 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${colorMap[feature.color]}`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
