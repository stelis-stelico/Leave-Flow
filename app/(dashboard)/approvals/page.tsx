import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApprovalQueueClient } from "@/components/approvals/ApprovalQueueClient";
import { LEAVE_TYPE_META } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  dept_head: "Head of Department",
  hr: "HR Manager",
};

async function getPendingRequests(userId: string, role: UserRole) {
  const supabase = await createClient();

  if (!["dept_head", "hr"].includes(role)) return [];

  const { data, error } = await supabase
    .from("approvals")
    .select(`
      id,
      request_id,
      level,
      status,
      request:leave_requests(
        id,
        reference,
        leave_type,
        start_date,
        end_date,
        working_days,
        reason,
        created_at,
        status,
        staff:profiles!staff_id(
          id,
          full_name,
          email,
          role,
          department_id,
          department:departments(name, code)
        ),
        handover_person:profiles!handover_person_id(
          full_name
        )
      )
    `)
    .eq("approver_id", userId)
    .eq("status", "pending")
    .order("level", { ascending: true });

  if (error || !data) return [];

  return data
    .map((row: any) => row.request)
    .filter(Boolean)
    .map((req: any) => {
      const dept =
        Array.isArray(req.staff?.department)
          ? req.staff.department[0]
          : req.staff?.department;

      return {
        id: req.id,
        reference: req.reference,
        leave_type: req.leave_type,
        leave_label:
          LEAVE_TYPE_META[req.leave_type as keyof typeof LEAVE_TYPE_META]?.label ??
          req.leave_type,
        leave_icon:
          LEAVE_TYPE_META[req.leave_type as keyof typeof LEAVE_TYPE_META]?.icon ??
          "📄",
        dates: formatDateRange(req.start_date, req.end_date),
        working_days: req.working_days,
        reason: req.reason,
        handover: req.handover_person?.full_name ?? "Not specified",
        staff_name: req.staff?.full_name ?? "Unknown",
        staff_dept: dept?.name ?? "",
        staff_role: req.staff?.role ?? "",
        staff_email: req.staff?.email ?? "",
        initials:
          req.staff?.full_name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() ?? "??",
        created_at: req.created_at,
      };
    });
}

export default async function ApprovalsPage() {
  const profile = await requireProfile();

  if (!["dept_head", "hr"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const requests = await getPendingRequests(profile.id, profile.role);
  const roleLabel = ROLE_LABELS[profile.role] ?? "Approver";

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h2 className="font-display text-[22px] md:text-[26px] text-gray-900 mb-1">
          Pending approvals
        </h2>
        <p className="text-[13px] text-gray-400">
          {requests.length} request{requests.length !== 1 ? "s" : ""} awaiting your approval as{" "}
          {roleLabel}
        </p>
      </div>

      <ApprovalQueueClient initialRequests={requests} />
    </div>
  );
}