"use client";

import { useEffect } from "react";
import { clsx } from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusSquare,
  Clock,
  ClipboardList,
  Users,
  Settings,
  X,
  LogOut,
  Shield,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import type { Profile } from "@/lib/types";

interface SidebarProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  pendingCount?: number;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export function Sidebar({
  profile,
  isOpen,
  onClose,
  pendingCount = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const isApprover = ["dept_head", "hr", "admin"].includes(profile.role);
  const isAdminOnly = profile.role === "admin";

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const portalLabel =
    profile.role === "staff"
      ? "Staff Portal"
      : profile.role === "dept_head"
      ? "Dept Head Portal"
      : profile.role === "hr"
      ? "HR Portal"
      : "Admin Portal";

  const mainNav: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard size={15} />,
    },
    {
      label: "Apply for leave",
      href: "/apply",
      icon: <PlusSquare size={15} />,
    },
    { label: "My history", href: "/history", icon: <Clock size={15} /> },
  ];

  const approvalNav: NavItem[] = [
    {
      label: "Pending queue",
      href: "/approvals",
      icon: <ClipboardList size={15} />,
      badge: pendingCount || undefined,
    },
    { label: "Team overview", href: "/team", icon: <Users size={15} /> },
  ];

  return (
    <>
      <aside className="hidden lg:flex lg:min-h-screen lg:w-[230px] lg:flex-col lg:border-r lg:border-green-100 lg:bg-white lg:green-line-top">
        <SidebarInner
          profile={profile}
          pathname={pathname}
          initials={initials}
          portalLabel={portalLabel}
          mainNav={mainNav}
          approvalNav={approvalNav}
          isApprover={isApprover}
          isAdminOnly={isAdminOnly}
        />
      </aside>

      <div
        onClick={onClose}
        className={clsx(
          "fixed inset-0 z-[200] bg-black/30 transition-opacity duration-200 lg:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={clsx(
          "fixed left-0 top-0 bottom-0 z-[201] flex w-[230px] max-w-[85vw] flex-col border-r border-green-100 bg-white shadow-lg transition-transform duration-200 ease-out green-line-top lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-md bg-green-50 text-green-600 transition-colors hover:bg-green-100"
        >
          <X size={13} />
        </button>

        <SidebarInner
          profile={profile}
          pathname={pathname}
          initials={initials}
          portalLabel={portalLabel}
          mainNav={mainNav}
          approvalNav={approvalNav}
          isApprover={isApprover}
          isAdminOnly={isAdminOnly}
        />
      </aside>
    </>
  );
}

function SidebarInner({
  profile,
  pathname,
  initials,
  portalLabel,
  mainNav,
  approvalNav,
  isApprover,
  isAdminOnly,
}: {
  profile: Profile;
  pathname: string;
  initials: string;
  portalLabel: string;
  mainNav: NavItem[];
  approvalNav: NavItem[];
  isApprover: boolean;
  isAdminOnly: boolean;
}) {
  return (
    <>
      <div className="border-b border-green-100 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg bg-green-600 shadow-sm">
            <svg viewBox="0 0 17 17" fill="none" className="h-4 w-4">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" />
              <rect
                x="9"
                y="2"
                width="6"
                height="6"
                rx="1.5"
                fill="white"
                opacity="0.7"
              />
              <rect
                x="2"
                y="9"
                width="6"
                height="6"
                rx="1.5"
                fill="white"
                opacity="0.7"
              />
              <rect
                x="9"
                y="9"
                width="6"
                height="6"
                rx="1.5"
                fill="white"
                opacity="0.4"
              />
            </svg>
          </div>
          <div>
            <p className="font-display text-[16px] leading-tight text-gray-900">
              LeaveFlow
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-green-600">
              {portalLabel}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-4">
          <p className="mb-1 px-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Overview
          </p>
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {isApprover && (
          <div className="mb-4">
            <p className="mb-1 px-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Approvals
            </p>
            {approvalNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}

        {isAdminOnly && (
          <div className="mb-4">
            <p className="mb-1 px-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              System
            </p>
            <NavLink
              item={{
                label: "Admin panel",
                href: "/admin",
                icon: <Shield size={15} />,
              }}
              pathname={pathname}
            />
          </div>
        )}

        <div>
          <p className="mb-1 px-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Account
          </p>
          <NavLink
            item={{
              label: "Settings",
              href: "/settings",
              icon: <Settings size={15} />,
            }}
            pathname={pathname}
          />
        </div>
      </nav>

      <div className="mt-auto border-t border-green-100 p-3">
        <form action={logout}>
          <button
            type="submit"
            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-green-50"
          >
            <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full border-2 border-green-200 bg-green-100 font-mono text-[10px] font-bold text-green-700">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-800">
                {profile.full_name}
              </p>
              <p className="truncate text-[10px] capitalize text-gray-400">
                {profile.role.replace(/_/g, " ")}
              </p>
            </div>
            <LogOut
              size={13}
              className="flex-shrink-0 text-gray-400 transition-colors group-hover:text-red-500"
            />
          </button>
        </form>
      </div>
    </>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={clsx(
        "relative mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-normal transition-all duration-150",
        isActive
          ? "nav-active-indicator bg-green-50 font-semibold text-green-700"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
      )}
    >
      <span className={clsx(isActive ? "text-green-600" : "text-gray-400")}>
        {item.icon}
      </span>
      <span className="flex-1">{item.label}</span>
      {item.badge != null && (
        <span className="ml-auto rounded-full bg-green-600 px-1.5 py-px font-mono text-[10px] font-bold text-white">
          {item.badge}
        </span>
      )}
    </Link>
  );
}