"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countWorkingDays, generateReference, nextStatus, roleToApprovalLevel, formatDateRange } from "@/lib/utils";
import { sendEmail, sendEmailToMany } from "@/lib/email";
import {
  emailRequestSubmitted,
  emailApprovalRequired,
  emailStepApproved,
  emailFullyApproved,
  emailRejected,
} from "@/lib/email-templates";
import type { LeaveTypeName } from "@/lib/types";
import { LEAVE_TYPE_META } from "@/lib/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── SUBMIT ────────────────────────────────────────────────────────

export async function submitLeaveRequest(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Not authenticated" };

  const start_date = formData.get("start_date") as string;
  const end_date = formData.get("end_date") as string;
  const leave_type = formData.get("leave_type") as LeaveTypeName;
  const reason = formData.get("reason") as string;
  const handover_person_id = formData.get("handover_person_id") as string | null;

  if (!start_date || !end_date || !leave_type || !reason) {
    return { error: "All fields are required." };
  }

  if (new Date(start_date) > new Date(end_date)) {
    return { error: "Start date must be before end date." };
  }

  const working_days = countWorkingDays(start_date, end_date);
  const reference = generateReference();
  const meta = LEAVE_TYPE_META[leave_type];

  // Get staff profile with department
  const { data: staff, error: staffError } = await supabase
    .from("profiles")
    .select("id, full_name, email, department_id")
    .eq("id", user.id)
    .single();

  if (staffError || !staff) {
    return { error: "Staff profile not found." };
  }

  if (!staff.department_id) {
    return { error: "Your profile is not assigned to any department yet." };
  }

  // Get HR approver
  const { data: hrUser, error: hrError } = await supabase
    .from("profiles")
    .select("id, full_name, email, department_id")
    .eq("role", "hr")
    .single();

  if (hrError || !hrUser) {
    return { error: "No HR approver has been configured yet." };
  }

  const isHRStaff = staff.department_id === hrUser.department_id;

  let firstApprover: { id: string; full_name: string | null; email: string | null } | null = null;
  let initialStatus: "pending_dept_head" | "pending_hr" = "pending_dept_head";

  if (isHRStaff) {
    firstApprover = {
      id: hrUser.id,
      full_name: hrUser.full_name,
      email: hrUser.email,
    };
    initialStatus = "pending_hr";
    console.log("HR STAFF DETECTED:", staff.department_id);
    console.log("SELECTED HR APPROVER:", hrUser);
  } else {
    const { data: deptHead, error: deptHeadError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "dept_head")
      .eq("department_id", staff.department_id)
      .single();

    if (deptHeadError || !deptHead) {
      return { error: "No department head is assigned to your department yet." };
    }

    firstApprover = deptHead;
    initialStatus = "pending_dept_head";
        console.log("STAFF DEPARTMENT:", staff.department_id);
    console.log("SELECTED DEPT HEAD:", deptHead);
  }

  // Create leave request
  const { data: request, error: insertError } = await supabase
    .from("leave_requests")
    .insert({
      staff_id: user.id,
      reference,
      leave_type,
      start_date,
      end_date,
      working_days,
      reason,
      handover_person_id: handover_person_id || null,
      status: initialStatus,
      department_id: staff.department_id,
    })
    .select()
    .single();

  if (insertError || !request) {
    return { error: insertError?.message || "Failed to create leave request." };
  }

  // Remove any old pending level-1 approval row for this request first
  await supabase
    .from("approvals")
    .delete()
    .eq("request_id", request.id)
    .eq("level", 1);

  // Create assigned approval row
  const { error: approvalError } = await supabase.from("approvals").insert({
    request_id: request.id,
    level: 1,
    approver_id: firstApprover.id,
    status: "pending",
  });

  if (approvalError) {
    return { error: approvalError.message };
  }

  const staffName = staff.full_name ?? "Staff member";
  const staffEmail = staff.email ?? user.email ?? "";

  const emailData = {
    staffName,
    staffEmail,
    leaveType: meta.label,
    leaveIcon: meta.icon,
    startDate: new Date(start_date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    endDate: new Date(end_date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    workingDays: working_days,
    reason,
    reference,
    requestUrl: `${APP_URL}/status/${request.id}`,
  };

  // Email staff confirmation
  const submitted = emailRequestSubmitted(emailData);
  await sendEmail({
    to: staffEmail,
    subject: submitted.subject,
    html: submitted.html,
  });

  // Notify only the assigned approver
  await supabase.from("notifications").insert({
    user_id: firstApprover.id,
    request_id: request.id,
    type: "approval_required",
    message: `New leave request from ${staffName} requires your approval.`,
  });

  if (firstApprover.email) {
    const approvalEmail = emailApprovalRequired({
      ...emailData,
      approverName: firstApprover.full_name ?? (isHRStaff ? "HR Manager" : "Dept Head"),
      stepLabel: isHRStaff ? "HR Manager" : "Head of Department",
      approvalsUrl: `${APP_URL}/approvals`,
    });

    await sendEmail({
      to: firstApprover.email,
      subject: approvalEmail.subject,
      html: approvalEmail.html,
    });
  }

  // Notify staff in app
  await supabase.from("notifications").insert({
    user_id: user.id,
    request_id: request.id,
    type: "request_submitted",
    message: isHRStaff
      ? `Your leave request (${reference}) has been submitted and sent to HR for approval.`
      : `Your leave request (${reference}) has been submitted and is awaiting Department Head approval.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/history");
  revalidatePath("/approvals");
  revalidatePath(`/status/${request.id}`);

  redirect(`/status/${request.id}`);
}

// ── APPROVE ───────────────────────────────────────────────────────

export async function approveRequest(requestId: string, comment?: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name, email").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };

  const level = roleToApprovalLevel(profile.role);
  if (!level) return { error: "You are not an approver" };

const { error: approvalError } = await supabase
  .from("approvals")
  .update({
    status: "approved",
    comment: comment || null,
    acted_at: new Date().toISOString(),
  })
  .eq("request_id", requestId)
  .eq("level", level)
  .eq("approver_id", user.id);
  if (approvalError) return { error: approvalError.message };

  const newStatus = nextStatus(level);

  await supabase.from("leave_requests")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", requestId);

  // Get full request + staff details
  const { data: lr } = await supabase
    .from("leave_requests")
    .select("*, staff:profiles!staff_id(full_name, email)")
    .eq("id", requestId).single();

  if (!lr) return { success: true };

  const meta       = LEAVE_TYPE_META[lr.leave_type as LeaveTypeName];
  const staffName  = lr.staff?.full_name ?? "Staff member";
  const staffEmail = lr.staff?.email     ?? "";

  const emailData = {
    staffName, staffEmail,
    leaveType:   meta.label,
    leaveIcon:   meta.icon,
    startDate:   new Date(lr.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    endDate:     new Date(lr.end_date).toLocaleDateString("en-GB",   { day: "numeric", month: "long", year: "numeric" }),
    workingDays: lr.working_days,
    reason:      lr.reason,
    reference:   lr.reference,
    requestUrl:  `${APP_URL}/status/${requestId}`,
  };

if (newStatus === "pending_hr") {
  // 🔥 Move to HR approval

  const { data: hrUser } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "hr")
    .single();

  await supabase.from("approvals").insert({
    request_id: requestId,
    level: 2,
    approver_id: hrUser?.id,
    status: "pending",
  });

  if (hrUser) {
    await supabase.from("notifications").insert({
      user_id: hrUser.id,
      request_id: requestId,
      type: "approval_required",
      message: `Leave request from ${staffName} awaiting your approval.`,
    });
  }

  await supabase.from("notifications").insert({
    user_id: lr.staff_id,
    request_id: requestId,
    type: "approved",
    message: `Your request is now awaiting HR approval.`,
  });

} else if (newStatus === "approved") {
    // Fully approved — notify staff
    await supabase.from("notifications").insert({
      user_id: lr.staff_id, request_id: requestId, type: "request_fully_approved",
      message: `🎉 Your leave request (${lr.reference}) has been fully approved.`,
    });

    const approvedEmail = emailFullyApproved(emailData);
    await sendEmail({ to: staffEmail, subject: approvedEmail.subject, html: approvedEmail.html });
  }

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath(`/status/${requestId}`);
  return { success: true };
}

// ── REJECT ────────────────────────────────────────────────────────

export async function rejectRequest(requestId: string, comment: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };

  const level = roleToApprovalLevel(profile.role);
  if (!level) return { error: "You are not an approver" };

  await supabase.from("approvals")
    .update({ approver_id: user.id, status: "rejected", comment: comment || null, acted_at: new Date().toISOString() })
    .eq("request_id", requestId).eq("level", level);

  await supabase.from("leave_requests")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", requestId);

  const { data: lr } = await supabase
    .from("leave_requests")
    .select("*, staff:profiles!staff_id(full_name, email)")
    .eq("id", requestId).single();

  if (lr) {
    const meta       = LEAVE_TYPE_META[lr.leave_type as LeaveTypeName];
    const staffName  = lr.staff?.full_name ?? "Staff member";
    const staffEmail = lr.staff?.email     ?? "";
    const rejectedBy = profile.role === "dept_head" ? "Head of Department" : "HR Manager";

    await supabase.from("notifications").insert({
      user_id: lr.staff_id, request_id: requestId, type: "rejected",
      message: `Your leave request (${lr.reference}) has been declined by ${rejectedBy}. Reason: ${comment}`,
    });

    const rejEmail = emailRejected({
      staffName, staffEmail,
      leaveType:   meta.label,
      leaveIcon:   meta.icon,
      startDate:   new Date(lr.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      endDate:     new Date(lr.end_date).toLocaleDateString("en-GB",   { day: "numeric", month: "long", year: "numeric" }),
      workingDays: lr.working_days,
      reason:      lr.reason,
      reference:   lr.reference,
      requestUrl:  `${APP_URL}/status/${requestId}`,
      comment,
      rejectedBy,
    });
    await sendEmail({ to: staffEmail, subject: rejEmail.subject, html: rejEmail.html });
  }

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath(`/status/${requestId}`);
  return { success: true };
}

// ── FETCH HELPERS ─────────────────────────────────────────────────

export async function getMyRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("leave_requests")
    .select("*, staff:profiles!staff_id(*), handover_person:profiles!handover_person_id(*)")
    .eq("staff_id", user.id).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPendingForApprover() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) return [];

  if (!["dept_head", "hr"].includes(profile.role)) return [];

  const { data, error } = await supabase
    .from("approvals")
    .select(`
      request_id,
      level,
      status,
      request:leave_requests(
        *,
        staff:profiles!staff_id(*)
      )
    `)
    .eq("approver_id", profile.id)
    .eq("status", "pending")
    .order("level", { ascending: true });

  if (error || !data) return [];

  return data
    .map((row: any) => row.request)
    .filter(Boolean);
}

export async function getRequestById(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leave_requests")
    .select("*, staff:profiles!staff_id(*), handover_person:profiles!handover_person_id(*), approvals(*, approver:profiles!approver_id(*))")
    .eq("id", id).single();
  return data;
}

export async function getLeaveBalances() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("leave_balances").select("*")
    .eq("staff_id", user.id).eq("year", new Date().getFullYear());
  return data ?? [];
}
