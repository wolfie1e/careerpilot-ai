"use client";

import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with core resume tools",
    features: [
      "2 resume uploads/month",
      "1 JD match per day",
      "Basic ATS scoring",
      "5 bullet rewrites/month",
      "3 mock interview sessions",
      "Text interviews only",
    ],
    cta: "Get Started Free",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    badge: "Most Popular",
    price: "$19",
    period: "/month",
    description: "Full platform access for active job seekers",
    features: [
      "Unlimited resume uploads",
      "Unlimited JD matching",
      "Advanced ATS + skill gap analysis",
      "Unlimited bullet & section rewrites",
      "Unlimited mock interviews",
      "Voice interviews + transcription",
      "Project recommendations",
      "Analytics dashboard",
      "PDF report export",
      "Priority processing",
    ],
    cta: "Start Pro Trial",
    href: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Campus",
    price: "$9",
    period: "/month",
    description: "For students and recent graduates",
    features: [
      "Everything in Pro",
      "Student discount pricing",
      "Campus-specific roles",
      "Entry-level question bank",
      "Internship matching",
      "Resume templates included",
    ],
    cta: "Student Discount",
    href: "/register?plan=campus",
    highlighted: false,
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-gray-900/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-gray-400">Start free. Upgrade when you&apos;re ready to accelerate.</p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.highlighted
                  ? "bg-blue-600 border-2 border-blue-500 shadow-2xl shadow-blue-600/30"
                  : "bg-gray-900 border border-gray-800"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-amber-400 text-gray-900 text-xs font-bold rounded-full">
                  <Zap className="w-3 h-3" />
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-bold text-lg ${plan.highlighted ? "text-white" : "text-white"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-white"}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.highlighted ? "text-blue-200" : "text-gray-500"}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${plan.highlighted ? "text-blue-200" : "text-gray-400"}`}>
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlighted ? "text-blue-200" : "text-emerald-400"}`} />
                    <span className={`text-sm ${plan.highlighted ? "text-blue-100" : "text-gray-300"}`}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlighted
                    ? "bg-white text-blue-600 hover:bg-blue-50 shadow-lg"
                    : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
