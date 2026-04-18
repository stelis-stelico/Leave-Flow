"use client";

import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/layout/NotificationBell";
import type { Profile } from "@/lib/types";

interface TopbarProps {
  profile: Profile;
  unreadCount?: number;
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/apply":     "Apply for leave",
  "/approvals": "Approvals",
  "/history":   "Leave history",
  "/settings":  "Settings",
  "/team":      "Team overview",
  "/admin":     "Admin panel",
};

export function Topbar({ profile, unreadCount = 0, onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/status") ? "Request status" : "LeaveFlow");

  return (
    <header className="relative h-[58px] bg-white border-b border-green-100 flex items-center justify-between px-4 md:px-6 flex-shrink-0 shadow-sm">
      {/* Subtle green top line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-40" />

      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-[34px] h-[34px] rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors flex-shrink-0"
        >
          <Menu size={16} />
        </button>
        <div>
          <h1 className="font-display text-[18px] md:text-[20px] text-gray-900 leading-tight">{title}</h1>
          <p className="text-[11px] text-gray-400 mt-px hidden sm:block">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell initialCount={unreadCount} userId={profile.id} />
        {profile.role !== "admin" && (
          <Link href="/apply" className="btn-green px-3 py-[7px] text-[11px]">
            <Plus size={12} />
            <span className="hidden sm:inline">New request</span>
            <span className="sm:hidden">New</span>
          </Link>
        )}
      </div>
    </header>
  );
}
