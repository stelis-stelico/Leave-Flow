import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { ApprovalChain, MiniStepper } from "@/components/dashboard/ApprovalChain";
import { StatusBadge } from "@/components/ui/Badge";
import { LEAVE_TYPE_META } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import type { ApprovalStep, LeaveRequest } from "@/lib/types";
import Link from "next/link";

async function getDashboardData(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leave_requests")
    .select("*, approvals(*, approver:profiles!approver_id(full_name, role))")
    .eq("staff_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  return { requests: (data ?? []) as (LeaveRequest & { approvals: any[] })[] };
}

function buildSteps(request: LeaveRequest & { approvals: any[] }): ApprovalStep[] {
  const lvlMap: Record<string, number> = { pending_dept_head: 1, pending_hr: 2, approved: 3, rejected: 0 };
  const cur = lvlMap[request.status] ?? 1;

  return [
    { level: 1 as const, label: "Head of Department", approver_role: "dept_head" as const },
    { level: 2 as const, label: "HR Department", approver_role: "hr" as const },
  ].map((def) => {
    const ap = request.approvals?.find((a) => a.level === def.level);
    const isDone = ap?.status === "approved";
    const isAct = !isDone && def.level === cur && request.status !== "rejected" && request.status !== "approved";
    return {
      ...def,
      status: isDone ? "done" : isAct ? "active" : "waiting",
      approver_name: ap?.approver?.full_name ?? (def.level === 1 ? "Dept Head" : "HR Manager"),
      acted_at: ap?.acted_at ?? null,
      comment: ap?.comment ?? null,
    } as ApprovalStep;
  });
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const { requests } = await getDashboardData(profile.id);

  const pending = requests.filter((r) => r.status.startsWith("pending_")).length;
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected").length;
  const totalRequestedDays = requests.reduce((s, r) => s + r.working_days, 0);
  const approvedDays = approved.reduce((s, r) => s + r.working_days, 0);
  const activeReq = requests.find((r) => r.status.startsWith("pending_"));
  const activeSteps = activeReq ? buildSteps(activeReq) : null;
  const initials = profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const today = new Date();

  const calDays = Array.from({ length: 10 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 2 + i);
    const leave = activeReq ? d >= new Date(activeReq.start_date) && d <= new Date(activeReq.end_date) : false;
    return {
      wd: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2),
      n: d.getDate(),
      leave,
      today: d.toDateString() === today.toDateString(),
    };
  });

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  })();

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div>
        <h2 className="font-display text-[22px] leading-tight text-gray-900">Good {greeting}, {profile.full_name.split(" ")[0]}</h2>
        <p className="mt-0.5 text-[13px] text-gray-400">Here&apos;s your leave overview</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pending" value={pending} sub={pending === 1 ? "request in review" : "requests in review"} />
        <StatCard label="Approved" value={approved.length} sub={`requests approved in ${new Date().getFullYear()}`} />
        <StatCard label="Rejected" value={rejected} sub="requests declined" />
        <StatCard label="Days requested" value={totalRequestedDays} sub={`${approvedDays} approved day${approvedDays !== 1 ? "s" : ""}`} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Recent requests" subtitle="Your latest submissions" right={<Link href="/history" className="text-[11px] text-green-600 transition-colors hover:text-green-700">View all</Link>} />
            {requests.length === 0 ? (
              <CardBody>
                <div className="py-8 text-center">
                  <p className="text-[13px] text-gray-400">No requests yet.</p>
                  <Link href="/apply" className="mt-2 inline-block text-[12px] text-green-600 hover:text-green-700">Apply for leave →</Link>
                </div>
              </CardBody>
            ) : (
              <div>
                {requests.map((req, i) => {
                  const meta = LEAVE_TYPE_META[req.leave_type];
                  const steps = buildSteps(req);
                  return (
                    <Link key={req.id} href={`/status/${req.id}`} className="flex items-start gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-green-50/30 last:border-b-0">
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-green-200 bg-green-100 font-mono text-[10px] font-bold text-green-700">{initials}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-medium text-gray-900">{meta.label}</span>
                          <StatusBadge status={req.status} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-400">{formatDateRange(req.start_date, req.end_date)} · {req.working_days} day{req.working_days !== 1 ? "s" : ""}</p>
                        {i === 0 && req.status.startsWith("pending_") && <MiniStepper steps={steps} />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title={today.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} />
            <CardBody>
              <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                {calDays.map((d, i) => (
                  <div key={i} className={`w-9 flex-shrink-0 rounded-lg border py-1.5 text-center ${d.leave ? "border-green-300 bg-green-100" : "border-gray-100 bg-gray-50"} ${d.today && !d.leave ? "ring-1 ring-green-400/30 border-green-400" : ""}`}>
                    <p className={`text-[9px] font-semibold uppercase tracking-wide ${d.leave ? "text-green-600" : "text-gray-400"}`}>{d.wd}</p>
                    <p className={`mt-0.5 font-mono text-xs font-bold ${d.leave ? "text-green-700" : "text-gray-700"}`}>{d.n}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm border border-green-300 bg-green-200" /><span>Pending leave</span></div>
                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm border-2 border-green-400" /><span>Today</span></div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          {activeReq && activeSteps ? (
            <Card>
              <CardHeader title="Approval progress" subtitle={`${LEAVE_TYPE_META[activeReq.leave_type].label} · ${formatDateRange(activeReq.start_date, activeReq.end_date)}`} right={<StatusBadge status={activeReq.status} />} />
              <CardBody>
                <ApprovalChain steps={activeSteps} />
                <div className="mt-4 border-t border-green-100 pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Notification log</p>
                  {[
                    { dot: "bg-green-500", text: "Request submitted", time: new Date(activeReq.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) },
                    ...activeSteps.map((s) => ({
                      dot: s.status === "done" ? "bg-green-500" : s.status === "active" ? "bg-green-400" : "bg-gray-200",
                      text: s.status === "done" ? `${s.label} approved` : s.status === "active" ? `${s.label} notified · awaiting` : `${s.label} pending`,
                      time: s.acted_at ? new Date(s.acted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—",
                    })),
                  ].map((n, i) => (
                    <div key={i} className="flex items-start gap-2 border-b border-gray-50 py-1.5 text-[11px] last:border-b-0">
                      <div className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${n.dot}`} />
                      <span className="flex-1 text-gray-500">{n.text}</span>
                      <span className="flex-shrink-0 font-mono text-[10px] text-gray-300">{n.time}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-green-200 bg-green-100"><Check /></div>
                  <p className="mb-1 text-sm font-semibold text-gray-700">No pending requests</p>
                  <Link href="/apply" className="mt-1 text-[12px] text-green-600 transition-colors hover:text-green-700">Apply for leave →</Link>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6">
      <path d="M4 10l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
