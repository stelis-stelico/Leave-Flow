"use client";
import { useState, useTransition } from "react";
import { LeaveTypeGrid } from "@/components/apply/LeaveTypeGrid";
import { ApprovalRoute } from "@/components/apply/ApprovalRoute";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { submitLeaveRequest } from "@/app/actions/leave";
import { countWorkingDays } from "@/lib/utils";
import type { LeaveTypeName } from "@/lib/types";
import { Info, CheckCircle2 } from "lucide-react";

interface Props {
  approvers: { initials: string; name: string; role: string }[];
}

export function ApplyForm({ approvers }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [leaveType, setLeaveType] = useState<LeaveTypeName>("annual");
  const [startDate, setStartDate] = useState(tomorrow);
  const [endDate, setEndDate] = useState(tomorrow);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const workingDays = startDate && endDate ? countWorkingDays(startDate, endDate) : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("leave_type", leaveType);
    fd.set("start_date", startDate);
    fd.set("end_date", endDate);
    startTransition(async () => {
      const result = await submitLeaveRequest(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4 pb-6">
      <Card>
        <CardHeader title="Select leave type" />
        <CardBody>
          <LeaveTypeGrid selected={leaveType} onSelect={setLeaveType} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Leave dates" />
        <CardBody>
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-gray-500">Start date</label>
              <input
                name="start_date"
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-gray-500">End date</label>
              <input
                name="end_date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-base"
                required
              />
            </div>
          </div>

          {workingDays > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
              <Info size={13} className="mt-0.5 flex-shrink-0 text-green-600" />
              <p className="text-[12px] leading-relaxed text-green-700">
                Duration: <strong>{workingDays} working day{workingDays !== 1 ? "s" : ""}</strong>
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Supporting information" />
        <CardBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-gray-500">Reason for leave</label>
            <textarea name="reason" rows={4} placeholder="Briefly describe your reason…" className="input-base resize-none" required />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Approval route" />
        <CardBody>
          <p className="mb-4 text-[12px] text-gray-400">Your request will be routed through these approvers in order:</p>
          <ApprovalRoute
            approvers={approvers.length > 0 ? approvers : [
              { initials: "DH", name: "Dept Head", role: "Head of Department" },
              { initials: "HR", name: "HR Dept", role: "Final approval" },
            ]}
          />
        </CardBody>
      </Card>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">{error}</div>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" variant="gold" fullWidth loading={isPending} disabled={workingDays === 0}>
          <CheckCircle2 size={13} /> Submit request
        </Button>
      </div>
    </form>
  );
}
