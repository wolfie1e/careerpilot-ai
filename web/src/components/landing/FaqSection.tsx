"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How does the ATS scoring work?",
    a: "Our ATS scorer evaluates your resume across 7 weighted categories: section completeness (20%), keyword density (20%), action verb usage (15%), quantification rate (15%), formatting integrity (15%), contact completeness (10%), and length compliance (5%). It's rule-based for consistency — no guessing, full transparency.",
  },
  {
    q: "How is the job description match score calculated?",
    a: "We use a 60/40 blend of semantic similarity (via text embeddings comparing your resume's meaning to the JD) and keyword overlap. The 60% semantic weighting means we understand context — \"built APIs\" matches \"REST API development\" even without exact keyword overlap.",
  },
  {
    q: "Is my resume data private?",
    a: "Yes. Your resume is processed only to generate your analysis and is never shared with third parties or used to train models. You can delete your resume and all associated data at any time from your settings page.",
  },
  {
    q: "How does the voice interview work?",
    a: "Your browser records audio using the built-in microphone. The audio is sent securely to our servers, transcribed locally using a speech recognition model, and then evaluated against a structured rubric. Your audio is not stored permanently after transcription.",
  },
  {
    q: "What file formats are supported for resume upload?",
    a: "We support PDF, DOCX (Microsoft Word), and TXT files up to 10MB. PDF is recommended for best parsing accuracy. We extract text, structure, and section boundaries automatically.",
  },
  {
    q: "Can I practice for a specific company's interview style?",
    a: "You can paste any job description to generate targeted interview questions. While we don't have company-specific question banks in the current version, questions are tuned to the role level, difficulty, and interview type you select.",
  },
  {
    q: "How many resumes can I upload?",
    a: "Free users can upload 2 resumes per month. Pro users have unlimited uploads. You can keep multiple resume versions and compare their scores side by side.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-3xl font-bold text-white">Common questions</h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`faq-answer-${i}`}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-medium text-white text-sm">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed border-t border-gray-800 pt-3">
                      <span id={`faq-answer-${i}`}>
                      {faq.a}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
