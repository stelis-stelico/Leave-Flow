"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  PlusSquare,
  Clock,
  ClipboardList,
  User,
} from "lucide-react";
import type { Profile } from "@/lib/types";

interface BottomNavProps {
  profile: Profile;
  pendingCount?: number;
  onMenuClick: () => void;
}

export function BottomNav({
  profile,
  pendingCount = 0,
  onMenuClick,
}: BottomNavProps) {
  const pathname = usePathname();
  const isApprover = ["dept_head", "hr", "admin"].includes(profile.role);

  const items = [
    { label: "Home", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { label: "Apply", href: "/apply", icon: <PlusSquare size={20} /> },
    { label: "Status", href: "/history", icon: <Clock size={20} /> },
    ...(isApprover
      ? [
          {
            label: "Queue",
            href: "/approvals",
            icon: <ClipboardList size={20} />,
            badge: pendingCount,
          },
        ]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[150] h-[64px] border-t border-green-100 bg-white shadow-[0_-1px_8px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="flex h-full w-full items-stretch">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-150",
                isActive ? "text-green-600" : "text-gray-400"
              )}
            >
              {isActive && (
                <span className="absolute left-[20%] right-[20%] top-0 h-0.5 rounded-b-sm bg-green-500" />
              )}

              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>

              {"badge" in item && item.badge != null && item.badge > 0 && (
                <span className="absolute top-2 right-[calc(50%-16px)] flex h-[15px] w-[15px] items-center justify-center rounded-full bg-green-600 font-mono text-[9px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <button
          onClick={onMenuClick}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-gray-400 transition-colors hover:text-gray-600"
        >
          <User size={20} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}