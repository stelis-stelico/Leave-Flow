"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { StatusBadge } from "@/components/ui/Badge";
import { MiniStepper } from "@/components/dashboard/ApprovalChain";
import type { LeaveRequest, ApprovalStep } from "@/lib/types";
import { LEAVE_TYPE_META } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";

interface LeaveItemProps {
  request: LeaveRequest;
  steps?: ApprovalStep[];
  showStepper?: boolean;
  showAvatar?: boolean;
}

export function LeaveItem({ request, steps, showStepper, showAvatar = true }: LeaveItemProps) {
  const meta = LEAVE_TYPE_META[request.leave_type];
  const name = request.staff?.full_name ?? "You";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/status/${request.id}`}
      className="flex items-start gap-3 px-4 py-3 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
    >
      {showAvatar && (
        <div className="w-8 h-8 rounded-full bg-navy-600 border-[1.5px] border-white/10 flex items-center justify-center text-[10px] font-semibold text-gold-300 flex-shrink-0 font-mono mt-0.5">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-cream">{meta.label}</span>
          <StatusBadge status={request.status} />
        </div>
        <p className="text-[11px] text-navy-300 mt-0.5">
          {formatDateRange(request.start_date, request.end_date)} · {request.working_days} day{request.working_days !== 1 ? "s" : ""}
        </p>
        {showStepper && steps && steps.length > 0 && (
          <MiniStepper steps={steps} />
        )}
      </div>
    </Link>
  );
}
