"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, BriefcaseBusiness, Download, FileText, LayoutDashboard, ListChecks, MessageSquare, Plus, Settings } from "lucide-react";
import UserMenu from "@/components/dashboard/UserMenu";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const pageTitles: Record<string, { title: string; subtitle: string; actionHref: string; actionLabel: string; actionIcon: typeof Plus }> = {
  "/dashboard": { title: "Overview", subtitle: "Your career progress at a glance", actionHref: "/resume", actionLabel: "Add Resume", actionIcon: Plus },
  "/resume": { title: "Resume", subtitle: "Upload, analyze, and improve your resume", actionHref: "/reports", actionLabel: "Reports", actionIcon: Download },
  "/interview": { title: "Interview", subtitle: "Practice and track your sessions", actionHref: "/interview/setup", actionLabel: "New Interview", actionIcon: MessageSquare },
  "/planner": { title: "Career Planner", subtitle: "Turn career insights into focused actions", actionHref: "/resume", actionLabel: "Resume", actionIcon: ListChecks },
  "/applications": { title: "Applications", subtitle: "Track opportunities and follow-ups", actionHref: "/planner", actionLabel: "Planner", actionIcon: BriefcaseBusiness },
  "/analytics": { title: "Analytics", subtitle: "Score trends and skill progress", actionHref: "/dashboard", actionLabel: "Overview", actionIcon: LayoutDashboard },
  "/reports": { title: "Reports", subtitle: "Download your analysis reports", actionHref: "/resume", actionLabel: "Resume", actionIcon: FileText },
  "/settings": { title: "Settings", subtitle: "Profile, security, and privacy controls", actionHref: "/analytics", actionLabel: "Analytics", actionIcon: BarChart2 },
};

export default function TopBar() {
  const pathname = usePathname();
  const base = "/" + pathname.split("/")[1];
  const nestedInterviewPage = pathname.startsWith("/interview/setup")
    ? { ...pageTitles["/interview"], title: "Interview Setup", subtitle: "Configure your next practice session" }
    : pathname.startsWith("/interview/history/")
      ? { ...pageTitles["/interview"], title: "Interview Review", subtitle: "Review scores, answers, and feedback" }
      : pathname === "/interview/history"
        ? { ...pageTitles["/interview"], title: "Interview History", subtitle: "Search, filter, and revisit sessions" }
        : pathname.startsWith("/interview/text/") || pathname.startsWith("/interview/voice/")
          ? { ...pageTitles["/interview"], title: "Practice Session", subtitle: "Answer questions and receive feedback" }
          : null;
  const page = nestedInterviewPage || pageTitles[base] || { title: "CareerPilot AI", subtitle: "", actionHref: "/settings", actionLabel: "Settings", actionIcon: Settings };
  const ActionIcon = page.actionIcon;
  const todayLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date());
  const fullDateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date());

  return (
    <header aria-label="Page header" className="h-16 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-base font-semibold text-white">{page.title}</h1>
        <p className="text-xs text-gray-500">{page.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <span title={fullDateLabel} className="hidden rounded-xl border border-gray-800 px-3 py-2 text-xs font-medium text-gray-500 md:inline-flex">
          {todayLabel}
        </span>
        <Link href={page.actionHref} className="hidden items-center gap-2 rounded-xl border border-gray-800 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white sm:inline-flex">
          <ActionIcon className="h-3.5 w-3.5" />
          {page.actionLabel}
        </Link>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
