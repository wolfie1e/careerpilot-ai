"use client";

import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "blue" | "violet" | "emerald" | "amber" | "rose";
  loading?: boolean;
}

const colorMap = {
  blue: "bg-blue-500/10 text-blue-400",
  violet: "bg-violet-500/10 text-violet-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  amber: "bg-amber-500/10 text-amber-400",
  rose: "bg-rose-500/10 text-rose-400",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "blue",
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-gray-800 rounded w-1/2 mb-3" />
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-800 rounded w-2/3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label={`${title}: ${value}`}
      className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">{title}</span>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colorMap[color])}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-gray-400"
            )}>
              {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
}
