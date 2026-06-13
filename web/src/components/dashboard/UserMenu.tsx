"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { BarChart2, Download, LogOut, Settings, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const initials = (user?.full_name || user?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button aria-label="Open user menu" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-800 transition-colors group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="min-w-[200px] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl shadow-black/50 p-1.5 z-50 animate-in fade-in-0 zoom-in-95"
        >
          {/* User info header */}
          <div className="px-3 py-2 mb-1 border-b border-gray-800">
            <div className="text-sm font-semibold text-white truncate">
              {user?.full_name || user?.username}
            </div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
              {user?.plan || "free"} plan
            </div>
          </div>

          <DropdownMenu.Item asChild>
            <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors outline-none">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/analytics" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors outline-none">
              <BarChart2 className="w-3.5 h-3.5" />
              Analytics
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/reports" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors outline-none">
              <Download className="w-3.5 h-3.5" />
              Reports
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-gray-800" />

          <DropdownMenu.Item
            onSelect={() => logout()}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-default transition-colors outline-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
