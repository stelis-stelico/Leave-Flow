// ─── USER & ROLES ─────────────────────────────────────────────────────────────
// shift_head removed — approval flow is now: staff → dept_head → hr

export type UserRole = "staff" | "dept_head" | "hr" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  shift: string | null;
  avatar_url: string | null;
  created_at: string;
}

// ─── LEAVE TYPES ─────────────────────────────────────────────────────────────

export type LeaveTypeName =
  | "annual"
  | "sick"
  | "maternity_paternity"
  | "emergency"
  | "casual";

export interface LeaveType {
  id: string;
  name: LeaveTypeName;
  label: string;
  max_days: number;
  color: string;
  icon: string;
}

// ─── LEAVE REQUEST ────────────────────────────────────────────────────────────

export type LeaveStatus =
  | "draft"
  | "pending_dept_head"
  | "pending_hr"
  | "approved"
  | "rejected";

export interface LeaveRequest {
  id: string;
  reference: string;
  staff_id: string;
  staff?: Profile;
  leave_type: LeaveTypeName;
  start_date: string;
  end_date: string;
  working_days: number;
  reason: string;
  handover_person_id: string | null;
  handover_person?: Profile;
  status: LeaveStatus;
  created_at: string;
  updated_at: string;
}

// ─── APPROVAL ────────────────────────────────────────────────────────────────
// Level 1 = dept_head, Level 2 = hr

export type ApprovalLevel = 1 | 2;
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Approval {
  id: string;
  request_id: string;
  approver_id: string;
  approver?: Profile;
  level: ApprovalLevel;
  status: ApprovalStatus;
  comment: string | null;
  acted_at: string | null;
  created_at: string;
}

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "request_submitted"
  | "approval_required"
  | "approved"
  | "rejected"
  | "request_fully_approved";

export interface Notification {
  id: string;
  user_id: string;
  request_id: string;
  request?: LeaveRequest;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}

// ─── LEAVE BALANCE ────────────────────────────────────────────────────────────

export interface LeaveBalance {
  id: string;
  staff_id: string;
  leave_type: LeaveTypeName;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────

export interface ApprovalStep {
  level: ApprovalLevel;
  label: string;
  approver_role: UserRole;
  status: "done" | "active" | "waiting";
  approver_name?: string;
  acted_at?: string | null;
  comment?: string | null;
}

export const STATUS_LABELS: Record<LeaveStatus, string> = {
  draft:             "Draft",
  pending_dept_head: "Pending Dept Head",
  pending_hr:        "Pending HR",
  approved:          "Approved",
  rejected:          "Rejected",
};

export const LEAVE_TYPE_META: Record<
  LeaveTypeName,
  { label: string; icon: string; defaultDays: number }
> = {
  annual:              { label: "Annual Leave",        icon: "🌴", defaultDays: 20 },
  sick:                { label: "Sick Leave",           icon: "🤒", defaultDays: 10 },
  maternity_paternity: { label: "Maternity/Paternity",  icon: "👶", defaultDays: 90 },
  emergency:           { label: "Emergency Leave",      icon: "🚨", defaultDays: 3  },
  casual:              { label: "Casual Leave",         icon: "☀️", defaultDays: 5  },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  staff:     "Staff",
  dept_head: "Head of Department",
  hr:        "HR Manager",
  admin:     "Administrator",
};

export const STATUS_TO_LEVEL: Partial<Record<LeaveStatus, ApprovalLevel>> = {
  pending_dept_head: 1,
  pending_hr:        2,
};
