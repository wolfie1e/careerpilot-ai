"use client";

import { motion } from "framer-motion";
import { Upload, Search, Lightbulb, Mic, BarChart2 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Resume",
    description: "Drag and drop your PDF, DOCX, or TXT resume. We extract and structure every section automatically.",
    color: "blue",
  },
  {
    icon: Search,
    step: "02",
    title: "Paste a Job Description",
    description: "Copy any job posting into the matcher. Our semantic engine computes your match score and skills gap.",
    color: "violet",
  },
  {
    icon: Lightbulb,
    step: "03",
    title: "Get AI Feedback",
    description: "Receive an ATS score, section-level feedback, bullet rewrites, and recommended projects — instantly.",
    color: "amber",
  },
  {
    icon: Mic,
    step: "04",
    title: "Practice Interviews",
    description: "Start a voice or text mock interview tailored to your target role. Get STAR-evaluated feedback per answer.",
    color: "emerald",
  },
  {
    icon: BarChart2,
    step: "05",
    title: "Track Progress",
    description: "Watch your scores improve over time with analytics that show readiness trends and skill coverage growth.",
    color: "rose",
  },
];

const colorMap: Record<string, { badge: string; icon: string; line: string }> = {
  blue: { badge: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: "bg-blue-500/10 text-blue-400", line: "bg-blue-500/40" },
  violet: { badge: "text-violet-400 bg-violet-500/10 border-violet-500/20", icon: "bg-violet-500/10 text-violet-400", line: "bg-violet-500/40" },
  amber: { badge: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: "bg-amber-500/10 text-amber-400", line: "bg-amber-500/40" },
  emerald: { badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: "bg-emerald-500/10 text-emerald-400", line: "bg-emerald-500/40" },
  rose: { badge: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: "bg-rose-500/10 text-rose-400", line: "bg-rose-500/40" },
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-900/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            From upload to interview-ready in minutes
          </h2>
        </motion.div>

        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500/30 via-violet-500/30 to-rose-500/30 hidden sm:block" />

          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative flex gap-5 sm:gap-8"
              >
                {/* Step number + icon */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center z-10 ${colorMap[step.color].badge}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <div className={`inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border mb-2 ${colorMap[step.color].badge}`}>
                    Step {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
