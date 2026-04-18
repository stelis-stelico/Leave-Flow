"use client";
import { useState, useTransition } from "react";
import { approveRequest, rejectRequest } from "@/app/actions/leave";
import { Check, X, Eye, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface PendingRequest {
  id: string; reference: string; leave_type: string;
  leave_label: string; leave_icon: string; dates: string;
  working_days: number; reason: string; handover: string;
  staff_name: string; staff_dept: string; staff_role: string;
  staff_email: string; initials: string; created_at: string;
}

export function ApprovalQueueClient({ initialRequests }: { initialRequests: PendingRequest[] }) {
  const [requests, setRequests]   = useState(initialRequests);
  const [rejectId, setRejectId]   = useState<string | null>(null);
  const [expandId, setExpandId]   = useState<string | null>(null);
  const [comment,  setComment]    = useState("");
  const [error,    setError]      = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string) {
    setError(null);
    const prev = [...requests];
    setRequests((r) => r.filter((x) => x.id !== id));
    startTransition(async () => {
      const result = await approveRequest(id);
      if (result?.error) { setError(result.error); setRequests(prev); }
    });
  }

  function handleReject(id: string) {
    if (!comment.trim()) return;
    setError(null);
    const prev = [...requests];
    setRequests((r) => r.filter((x) => x.id !== id));
    startTransition(async () => {
      const result = await rejectRequest(id, comment);
      if (result?.error) { setError(result.error); setRequests(prev); }
      setRejectId(null); setComment("");
    });
  }

  if (requests.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-14 h-14 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-4">
            <Check size={24} className="text-green-600" />
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-1">All caught up!</p>
          <p className="text-[12px] text-gray-400 max-w-[220px]">No requests awaiting your approval right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-600">{error}</div>
      )}
      {requests.map((req) => {
        const isExpanded  = expandId === req.id;
        const isRejecting = rejectId === req.id;
        return (
          <div key={req.id} className="bg-white border border-green-100 rounded-xl shadow-sm hover:border-green-300 hover:shadow-md transition-all">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center text-[11px] font-bold text-green-700 font-mono flex-shrink-0">
                    {req.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900 leading-tight">{req.staff_name}</p>
                    <p className="text-[11px] text-gray-400">{req.staff_dept}{req.staff_dept && req.staff_role ? " · " : ""}{req.staff_role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-300">{req.reference}</span>
                  <span className="badge badge-pending">Awaiting you</span>
                </div>
              </div>

              <p className="text-[12px] text-gray-600 mb-3 leading-relaxed">
                <span className="text-base mr-1">{req.leave_icon}</span>
                <strong className="text-gray-900">{req.leave_label}</strong>
                {" · "}{req.dates}{" · "}{req.working_days} day{req.working_days !== 1 ? "s" : ""}
                {" · "}Handover: <span className="text-gray-700">{req.handover}</span>
              </p>

              {isExpanded && (
                <div className="mb-3 rounded-lg border border-green-100 bg-green-50 p-3 text-[12px]">
                  <p className="text-gray-400 mb-1 font-semibold uppercase text-[10px] tracking-wide">Reason</p>
                  <p className="text-gray-700 leading-relaxed">{req.reason}</p>
                  <div className="mt-3 grid gap-3 border-t border-green-100 pt-3 sm:grid-cols-2">
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Email</p>
                      <p className="text-gray-700">{req.staff_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Submitted</p>
                      <p className="text-gray-700">{new Date(req.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                </div>
              )}

              {isRejecting && (
                <div className="mb-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <MessageSquare size={11} />
                    <span>Reason for rejection (required):</span>
                  </div>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="e.g. Insufficient cover, conflicts with deadline…"
                    rows={3} className="input-base resize-none text-xs" autoFocus />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button onClick={() => handleReject(req.id)} disabled={!comment.trim() || isPending}
                      className="btn-reject flex-1 disabled:opacity-40">Confirm rejection</button>
                    <button onClick={() => { setRejectId(null); setComment(""); }} className="btn-view">Cancel</button>
                  </div>
                </div>
              )}

              {!isRejecting && (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button onClick={() => handleApprove(req.id)} disabled={isPending} className="btn-approve disabled:opacity-40">
                    <Check size={12} /> Approve
                  </button>
                  <button onClick={() => { setRejectId(req.id); setExpandId(null); }} className="btn-reject">
                    <X size={12} /> Reject
                  </button>
                  <Link href={`/status/${req.id}`} className="btn-view inline-flex items-center gap-1.5">
                    <Eye size={12} /> Full details
                  </Link>
                  <button onClick={() => setExpandId(isExpanded ? null : req.id)} className="btn-view sm:ml-auto">
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {isExpanded ? "Less" : "More"}
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
