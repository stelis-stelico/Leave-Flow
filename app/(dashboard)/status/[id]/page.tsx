import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ApprovalChain } from "@/components/dashboard/ApprovalChain";
import { StatusBadge } from "@/components/ui/Badge";
import { LEAVE_TYPE_META } from "@/lib/types";
import { formatDateRange, formatTimestamp } from "@/lib/utils";
import type { ApprovalStep } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LeaveLetter } from "@/components/pdf/LeaveLetter";

interface PageProps { params: Promise<{ id: string }>; }

async function getRequest(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, staff:profiles!staff_id(id,full_name,email,role,department), handover_person:profiles!handover_person_id(id,full_name), approvals(id,level,status,comment,acted_at,approver:profiles!approver_id(full_name,role))")
    .eq("id", id).single();
  if (error || !data) return null;
  return data;
}

// 2-step: level 1 = dept_head, level 2 = hr
function buildSteps(request: any): ApprovalStep[] {
  const lvlMap: Record<string, number> = { pending_dept_head: 1, pending_hr: 2, approved: 3, rejected: 0 };
  const cur = lvlMap[request.status] ?? 1;
  return [
    { level: 1 as const, label: "Head of Department", approver_role: "dept_head" as const },
    { level: 2 as const, label: "HR Department",       approver_role: "hr"        as const },
  ].map((def) => {
    const ap     = request.approvals?.find((a: any) => a.level === def.level);
    const isDone = ap?.status === "approved";
    const isAct  = !isDone && def.level === cur && request.status !== "rejected" && request.status !== "approved";
    return {
      ...def, status: isDone ? "done" : isAct ? "active" : "waiting",
      approver_name: ap?.approver?.full_name ?? (def.level === 1 ? "Dept Head" : "HR Manager"),
      acted_at: ap?.acted_at ?? null, comment: ap?.comment ?? null,
    } as ApprovalStep;
  });
}

export default async function StatusPage({ params }: PageProps) {
  const { id }    = await params;
  const [profile, request] = await Promise.all([requireProfile(), getRequest(id)]);
  if (!request) notFound();

  const isOwner    = request.staff_id === profile.id;
  const isApprover = ["dept_head", "hr", "admin"].includes(profile.role);
  if (!isOwner && !isApprover) notFound();

  const steps    = buildSteps(request);
  const meta     = LEAVE_TYPE_META[request.leave_type as keyof typeof LEAVE_TYPE_META];
  const initials = request.staff?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";

  const notifLog = [
    { dot: "bg-green-400", text: "Request submitted successfully", time: formatTimestamp(request.created_at) },
    ...steps.map((s) => {
      const ap = request.approvals?.find((a: any) => a.level === s.level);
      return [
        { dot: s.status === "done" ? "bg-green-400" : s.status === "active" ? "bg-green-300" : "bg-gray-200", text: `${s.label} notified`, time: ap?.created_at ? formatTimestamp(ap.created_at) : "—" },
        ...(s.status === "done" ? [{ dot: "bg-green-500", text: `${s.label} approved`, time: s.acted_at ? formatTimestamp(s.acted_at) : "—" }] : []),
      ];
    }).flat(),
  ];

  return (
    <div className="p-4 md:p-6">
      <Link href="/history" className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-green-600 transition-colors mb-4">
        <ArrowLeft size={13} /> Back to history
      </Link>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
        <div>
          <h2 className="font-display text-[22px] md:text-[26px] text-gray-900 mb-1">Request {request.reference}</h2>
          <p className="text-[12px] text-gray-400">
            Submitted {formatTimestamp(request.created_at)}
            {isApprover && request.staff && <span> · {request.staff.full_name}</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 mt-1">
          <StatusBadge status={request.status} />
          <LeaveLetter
            request={{
              ...request,
              leave_label: LEAVE_TYPE_META[request.leave_type as keyof typeof LEAVE_TYPE_META]?.label ?? request.leave_type,
              approvals:   request.approvals ?? [],
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Approval timeline" />
            <CardBody><ApprovalChain steps={steps} /></CardBody>
          </Card>
          <Card>
            <CardHeader title="Notification log" />
            <CardBody>
              {notifLog.map((n, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-b-0 text-[11px]">
                  <div className={`w-1.5 h-1.5 rounded-full ${n.dot} flex-shrink-0 mt-1`} />
                  <span className="text-gray-500 flex-1">{n.text}</span>
                  <span className="text-gray-300 font-mono text-[10px] flex-shrink-0 text-right max-w-[90px]">{n.time}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Request details" />
            <CardBody>

              <table className="w-full border-collapse">
                <tbody>
                {[
                  ["Leave type",   meta?.label ?? request.leave_type],
                  ["Start date",   new Date(request.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })],
                  ["End date",     new Date(request.end_date).toLocaleDateString("en-GB",   { day: "numeric", month: "long", year: "numeric" })],
                  ["Duration",     `${request.working_days} working day${request.working_days !== 1 ? "s" : ""}`],
                  ["Reference",    request.reference],
                  ["Handover",     request.handover_person?.full_name ?? "Not specified"],
                  ["Reason",       request.reason],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-50 last:border-b-0">
                    <td className="py-2 text-[12px] text-gray-400 w-[40%] align-top">{k}</td>
                    <td className={`py-2 text-right text-[12px] font-medium align-top ${
                      k === "Reference" ? "text-green-600 font-mono text-[11px]" :
                      k === "Reason"    ? "text-gray-500 font-normal text-[11px] leading-relaxed" :
                      "text-gray-900"}`}>{v}</td>
                  </tr>
                ))}
                  </tbody>
              </table>
              
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Request outcome" subtitle="Current processing state" />
            <CardBody>
              <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                <div className="flex items-start gap-3">
                  <div className="text-xl">{meta?.icon}</div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-gray-900">{meta?.label}</p>
                    <p className="mt-0.5 text-[11px] text-gray-500">This request covers {request.working_days} working day{request.working_days !== 1 ? "s" : ""} and follows the standard approval route for your workplace.</p>
                  </div>
                </div>
              </div>
              {request.status === "rejected" && (
                <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                  <p className="text-[11px] text-red-600">This request was rejected. Check the approval timeline or comments above for the latest decision details.</p>
                </div>
              )}
              {request.status === "approved" && (
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-[11px] text-green-700">✓ Approved — the request has completed the approval flow successfully.</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
