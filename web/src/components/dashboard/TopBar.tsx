"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Overview", subtitle: "Your career progress at a glance" },
  "/resume": { title: "Resume", subtitle: "Upload, analyze, and improve your resume" },
  "/interview": { title: "Interview", subtitle: "Practice and track your sessions" },
  "/analytics": { title: "Analytics", subtitle: "Score trends and skill progress" },
  "/reports": { title: "Reports", subtitle: "Download your analysis reports" },
};

export default function TopBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const base = "/" + pathname.split("/")[1];
  const page = pageTitles[base] || { title: "CareerPilot AI", subtitle: "" };

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-white">{page.title}</h1>
        <p className="text-xs text-gray-500">{page.subtitle}</p>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all relative">
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
          {(user?.full_name || user?.username || "U").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
