import { format, isWeekend, addDays } from "date-fns";

export function countWorkingDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  let count = 0;
  let cur = new Date(s);
  while (cur <= e) {
    if (!isWeekend(cur)) count++;
    cur = addDays(cur, 1);
  }
  return count;
}

export function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${format(s, "d")} – ${format(e, "d MMM yyyy")}`;
  }
  return `${format(s, "d MMM")} – ${format(e, "d MMM yyyy")}`;
}

export function generateReference(): string {
  const year = new Date().getFullYear();
  const num  = Math.floor(Math.random() * 9000) + 1000;
  return `LF-${year}-${num}`;
}

export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * 2-step flow: 1=dept_head → pending_hr, 2=hr → approved
 */
export function nextStatus(level: 1 | 2): string {
  return level === 1 ? "pending_hr" : "approved";
}

/**
 * dept_head = level 1, hr = level 2
 */
export function roleToApprovalLevel(role: string): 1 | 2 | null {
  if (role === "dept_head") return 1;
  if (role === "hr")        return 2;
  return null;
}

export function formatTimestamp(iso: string): string {
  return format(new Date(iso), "d MMM yyyy 'at' HH:mm");
}

export function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft:             "Draft",
    pending_dept_head: "Pending Dept Head",
    pending_hr:        "Pending HR",
    approved:          "Approved",
    rejected:          "Rejected",
  };
  return map[status] ?? status;
}
