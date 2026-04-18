"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getNotifications, markAllRead, markOneRead } from "@/app/actions/notifications";
import type { Notification } from "@/lib/types";
import Link from "next/link";

interface Props { initialCount: number; userId: string; }

const TYPE_ICONS: Record<string, string> = {
  request_submitted:      "📋",
  approval_required:      "⏳",
  approved:               "✅",
  rejected:               "❌",
  request_fully_approved: "🎉",
};

export function NotificationBell({ initialCount, userId }: Props) {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(initialCount);
  const [loaded,        setLoaded]        = useState(false);
  const [isPending,     startTransition]  = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleOpen() {
    setOpen((p) => !p);
    if (!loaded) {
      const data = await getNotifications();
      setNotifications(data);
      setLoaded(true);
    }
  }

  useEffect(() => {
    const channel = supabase
      .channel("notifs_rt")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setUnreadCount((c) => c + 1);
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]); // eslint-disable-line

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }

  function handleMarkOneRead(id: string) {
    startTransition(async () => {
      await markOneRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  }

  function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days < 7 ? `${days}d ago` : new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-[34px] h-[34px] bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-colors"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[15px] h-[15px] rounded-full bg-green-600 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white font-mono px-0.5">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-green-100 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] z-50 overflow-hidden animate-fadeUp">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-green-100">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-px rounded-full font-mono">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} disabled={isPending}
                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-green-600 transition-colors disabled:opacity-40">
                  <CheckCheck size={11} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-600 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[360px]">
            {!loaded ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Bell size={28} className="text-gray-200 mb-3" />
                <p className="text-[13px] text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id}
                  onClick={() => { if (!n.read) handleMarkOneRead(n.id); }}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? "bg-green-50/50" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${!n.read ? "bg-green-100" : "bg-gray-100"}`}>
                    {TYPE_ICONS[n.type] ?? "📣"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[12px] leading-relaxed ${!n.read ? "text-gray-900 font-medium" : "text-gray-500"}`}>{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{formatTime(n.created_at)}</span>
                      {n.request_id && (
                        <Link href={`/status/${n.request_id}`}
                          className="text-[10px] text-green-600 hover:text-green-700 transition-colors"
                          onClick={(e) => e.stopPropagation()}>
                          View →
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 text-center">
              <Link href="/notifications" className="text-[11px] text-green-600 hover:text-green-700 transition-colors" onClick={() => setOpen(false)}>
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
