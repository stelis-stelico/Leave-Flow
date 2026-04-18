"use client";

import { useCallback, useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import type { Profile } from "@/lib/types";

interface DashboardShellProps {
  profile: Profile;
  unreadCount: number;
  pendingCount: number;
  children: React.ReactNode;
}

export function DashboardShell({
  profile,
  unreadCount,
  pendingCount,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-navy-950 lg:grid lg:grid-cols-[230px_minmax(0,1fr)]">
      <Sidebar
        profile={profile}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        pendingCount={pendingCount}
      />

      <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
        <Topbar
          profile={profile}
          unreadCount={unreadCount}
          onMenuClick={openSidebar}
        />

        <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto bg-navy-950 pb-[64px] lg:pb-0">
          <div className="page-enter min-w-0 w-full">{children}</div>
        </main>

        <BottomNav
          profile={profile}
          pendingCount={pendingCount}
          onMenuClick={openSidebar}
        />
      </div>
    </div>
  );
}