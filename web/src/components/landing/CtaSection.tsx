"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="py-24 bg-gray-900/40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden border border-gray-800 bg-gradient-to-br from-blue-950/50 via-gray-900 to-violet-950/50 p-12 sm:p-16"
        >
          {/* Glow */}
          <div className="absolute top-0 left-1/4 w-64 h-32 bg-blue-600/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-32 bg-violet-600/20 blur-3xl pointer-events-none" />

          <span className="relative inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            Start for free today
          </span>

          <h2 className="relative text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            Stop guessing why your{" "}
            <span className="gradient-text">resume isn&apos;t working</span>
          </h2>

          <p className="relative text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Upload your resume and get your full ATS score, job match analysis, and improvement roadmap — in under 60 seconds.
          </p>

          <div className="relative flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Analyze My Resume Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield className="w-3.5 h-3.5" />
            Free to start · No credit card required · Data processed securely
          </div>
        </motion.div>
      </div>
    </section>
  );
}
