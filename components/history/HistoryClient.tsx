"use client";
import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import type { LeaveStatus } from "@/lib/types";
import { Filter } from "lucide-react";

interface HistoryItem {
  id: string; reference: string; leave_type: string;
  leave_label: string; leave_icon: string; status: LeaveStatus;
  dates: string; working_days: number; created_at: string;
}

const STATUS_FILTERS = [
  { label: "All",      value: "all"      },
  { label: "Approved", value: "approved" },
  { label: "Pending",  value: "pending"  },
  { label: "Rejected", value: "rejected" },
];

const TYPE_FILTERS = [
  { label: "All types",           value: "all"                 },
  { label: "Annual",              value: "annual"              },
  { label: "Sick",                value: "sick"                },
  { label: "Emergency",           value: "emergency"           },
  { label: "Casual",              value: "casual"              },
  { label: "Maternity/Paternity", value: "maternity_paternity" },
];

export function HistoryClient({ requests }: { requests: HistoryItem[] }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter,   setTypeFilter]   = useState("all");
  const [showFilters,  setShowFilters]  = useState(false);

  const filtered = requests.filter((r) => {
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && r.status.startsWith("pending")) ||
      r.status === statusFilter;
    const matchType = typeFilter === "all" || r.leave_type === typeFilter;
    return matchStatus && matchType;
  });

  const totalDays = requests
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.working_days, 0);

  const hasFilter = statusFilter !== "all" || typeFilter !== "all";

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-green-100 text-[12px] shadow-sm">
          <span className="text-gray-400">Total:</span>
          <span className="text-gray-900 font-semibold">{requests.length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-green-100 text-[12px] shadow-sm">
          <span className="text-gray-400">Days taken:</span>
          <span className="text-gray-900 font-semibold">{totalDays}</span>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] border transition-colors ${
            showFilters || hasFilter
              ? "bg-green-50 border-green-300 text-green-700"
              : "bg-white border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <Filter size={12} />
          Filters
          {hasFilter && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button key={f.value} onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    statusFilter === f.value
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-white border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-700"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Leave type</p>
            <div className="flex gap-2 flex-wrap">
              {TYPE_FILTERS.map((f) => (
                <button key={f.value} onClick={() => setTypeFilter(f.value)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                    typeFilter === f.value
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-white border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-700"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader title="All requests" subtitle={`${filtered.length} of ${requests.length}`} />
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <p className="text-[13px] text-gray-400">No requests match your filters.</p>
            <button onClick={() => { setStatusFilter("all"); setTypeFilter("all"); }}
              className="text-[12px] text-green-600 hover:text-green-700 mt-2 transition-colors">
              Clear filters
            </button>
          </div>
        ) : (
          <div>
            {filtered.map((req) => (
              <Link key={req.id} href={`/status/${req.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-green-50/40 transition-colors group">
                <span className="text-lg flex-shrink-0">{req.leave_icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-medium text-gray-900 group-hover:text-green-700 transition-colors">{req.leave_label}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {req.dates} · {req.working_days} day{req.working_days !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-[10px] text-gray-300 font-mono hidden sm:block">{req.reference}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
