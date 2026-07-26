"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, FileText, MessageSquare, BarChart2, Download, ListChecks, BriefcaseBusiness, NotebookPen, UsersRound, Medal, Award, BookOpen, Handshake, Building2, UserCheck, Library, FolderKanban,
  Zap, ChevronLeft, ChevronRight, LogOut, Settings, Plus, Target, Command
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LOCAL_STORAGE_KEYS } from "@/lib/constants";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/command-center", icon: Command, label: "Command Center" },
  { href: "/resume", icon: FileText, label: "Resume" },
  { href: "/interview", icon: MessageSquare, label: "Interview" },
  { href: "/question-bank", icon: Library, label: "Question Bank" },
  { href: "/planner", icon: ListChecks, label: "Planner" },
  { href: "/learning", icon: BookOpen, label: "Learning" },
  { href: "/portfolio", icon: FolderKanban, label: "Portfolio" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/achievements", icon: Medal, label: "Achievements" },
  { href: "/certifications", icon: Award, label: "Certifications" },
  { href: "/companies", icon: Building2, label: "Target Companies" },
  { href: "/references", icon: UserCheck, label: "References" },
  { href: "/applications", icon: BriefcaseBusiness, label: "Applications" },
  { href: "/offers", icon: BriefcaseBusiness, label: "Offers" },
  { href: "/review", icon: NotebookPen, label: "Weekly Review" },
  { href: "/networking", icon: UsersRound, label: "Networking" },
  { href: "/mentorship", icon: Handshake, label: "Mentorship" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/reports", icon: Download, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useLocalStorage(LOCAL_STORAGE_KEYS.sidebarCollapsed, false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col bg-gray-900 border-r border-gray-800 h-screen shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <Link href="/dashboard" title="Dashboard overview" className={cn("flex items-center gap-2 h-16 px-4 border-b border-gray-800 shrink-0", collapsed && "justify-center px-0")}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-white text-sm whitespace-nowrap overflow-hidden"
            >
              CareerPilot AI
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Nav */}
      <nav aria-label="Dashboard navigation" className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + logout */}
      <div className="px-2 pb-4 space-y-1 border-t border-gray-800 pt-3">
        <Link href="/interview/setup" title="New interview" aria-label="Start a new interview" className={cn("mb-2 flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500", collapsed && "justify-center px-0")}>
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New Interview</span>}
        </Link>
        <button
          onClick={() => logout()}
          title="Sign out"
          aria-label="Sign out"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {!collapsed && user && (
          <div className="px-3 py-2 rounded-xl bg-gray-800/50">
            <div className="text-xs font-semibold text-white truncate">{user.full_name || user.username}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-md z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
