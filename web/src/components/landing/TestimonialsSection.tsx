"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Software Engineer → Senior SWE",
    avatar: "PS",
    color: "from-blue-500 to-violet-500",
    quote: "My ATS score went from 54 to 89 after using the rewriter. Got three callbacks in the first week from companies that had been ignoring me for months.",
    stars: 5,
  },
  {
    name: "Marcus Johnson",
    role: "CS Graduate → Backend Developer",
    avatar: "MJ",
    color: "from-emerald-500 to-cyan-500",
    quote: "The project recommendations are genuinely specific. I built the suggested FastAPI + Redis system in 3 weeks and added it to my resume — landed a job the next month.",
    stars: 5,
  },
  {
    name: "Ayesha Rahman",
    role: "Career Switcher → Data Engineer",
    avatar: "AR",
    color: "from-rose-500 to-amber-500",
    quote: "Voice mock interviews changed everything. I practiced 40+ questions over two weeks. The STAR feedback taught me how to structure answers properly for the first time.",
    stars: 5,
  },
  {
    name: "David Chen",
    role: "Bootcamp Grad → Full Stack Dev",
    avatar: "DC",
    color: "from-violet-500 to-pink-500",
    quote: "The skill gap roadmap showed exactly which projects to build and in what order for React/Node roles. Four weeks later, my resume finally matched the job requirements.",
    stars: 5,
  },
  {
    name: "Zainab Al-Rashid",
    role: "ML Researcher → ML Engineer",
    avatar: "ZA",
    color: "from-amber-500 to-orange-500",
    quote: "The JD matcher semantic scoring is impressive. It caught that my resume emphasized research publication metrics when the JD wanted production deployment experience.",
    stars: 5,
  },
  {
    name: "Kevin Park",
    role: "Product Manager",
    avatar: "KP",
    color: "from-teal-500 to-emerald-500",
    quote: "Used it for behavioral interview prep before my Director PM interview. The STAR format feedback flagged that I wasn't quantifying outcomes — fixed it and got the offer.",
    stars: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-4">
            Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Real results from real job seekers
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Join thousands of engineers, designers, and professionals who leveled up their job search with CareerPilot AI.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-sm text-gray-300 leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
