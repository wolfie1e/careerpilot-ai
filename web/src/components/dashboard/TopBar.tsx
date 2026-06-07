"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Download, FileText, LayoutDashboard, MessageSquare, Plus, Settings } from "lucide-react";
import UserMenu from "@/components/dashboard/UserMenu";

const pageTitles: Record<string, { title: string; subtitle: string; actionHref: string; actionLabel: string; actionIcon: typeof Plus }> = {
  "/dashboard": { title: "Overview", subtitle: "Your career progress at a glance", actionHref: "/resume", actionLabel: "Add Resume", actionIcon: Plus },
  "/resume": { title: "Resume", subtitle: "Upload, analyze, and improve your resume", actionHref: "/reports", actionLabel: "Reports", actionIcon: Download },
  "/interview": { title: "Interview", subtitle: "Practice and track your sessions", actionHref: "/interview/setup", actionLabel: "New Interview", actionIcon: MessageSquare },
  "/analytics": { title: "Analytics", subtitle: "Score trends and skill progress", actionHref: "/dashboard", actionLabel: "Overview", actionIcon: LayoutDashboard },
  "/reports": { title: "Reports", subtitle: "Download your analysis reports", actionHref: "/resume", actionLabel: "Resume", actionIcon: FileText },
  "/settings": { title: "Settings", subtitle: "Profile, security, and privacy controls", actionHref: "/analytics", actionLabel: "Analytics", actionIcon: BarChart2 },
};

export default function TopBar() {
  const pathname = usePathname();
  const base = "/" + pathname.split("/")[1];
  const page = pageTitles[base] || { title: "CareerPilot AI", subtitle: "", actionHref: "/settings", actionLabel: "Settings", actionIcon: Settings };
  const ActionIcon = page.actionIcon;

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-white">{page.title}</h1>
        <p className="text-xs text-gray-500">{page.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link href={page.actionHref} className="hidden items-center gap-2 rounded-xl border border-gray-800 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white sm:inline-flex">
          <ActionIcon className="h-3.5 w-3.5" />
          {page.actionLabel}
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
