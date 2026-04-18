import { clsx } from "clsx";
import type { LeaveStatus } from "@/lib/types";

type BadgeVariant = "approved" | "review" | "pending" | "rejected" | "draft";

const variantMap: Record<string, BadgeVariant> = {
  approved:          "approved",
  pending_dept_head: "pending",
  pending_hr:        "review",
  rejected:          "rejected",
  draft:             "draft",
};

const labels: Record<BadgeVariant, string> = {
  approved: "Approved",
  review:   "With HR",
  pending:  "Pending",
  rejected: "Rejected",
  draft:    "Draft",
};

export function Badge({ variant, status, children, className }: {
  variant?: BadgeVariant; status?: LeaveStatus;
  children: React.ReactNode; className?: string;
}) {
  const v = variant ?? (status ? variantMap[status] : "draft");
  return <span className={clsx("badge", `badge-${v}`, className)}>{children}</span>;
}

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const v = variantMap[status] ?? "draft";
  return <span className={clsx("badge", `badge-${v}`)}>{labels[v]}</span>;
}
