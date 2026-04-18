import { requireProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getAllUsers,
  getAdminStats,
  getAllRequests,
  getAllDepartments,
} from "@/app/actions/admin";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";
import { LEAVE_TYPE_META } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";

export default async function AdminPage() {
  const profile = await requireProfile();

  if (profile.role !== "admin") {
    redirect("/dashboard");
  }

  const [{ data: users }, { data: departments }, stats, allRequests] =
    await Promise.all([
      getAllUsers(),
      getAllDepartments(),
      getAdminStats(),
      getAllRequests(20),
    ]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h2 className="mb-1 text-[22px] font-display text-gray-900 md:text-[26px]">
          Admin panel
        </h2>
        <p className="text-[13px] text-gray-400">
          User management, departments, and system overview
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={stats.totalUsers}
          sub="registered accounts"
        />
        <StatCard
          label="Pending leaves"
          value={stats.pendingLeaves}
          sub="awaiting approval"
        />
        <StatCard
          label="Approved (year)"
          value={stats.approvedYear}
          sub={`in ${new Date().getFullYear()}`}
        />
        <StatCard
          label="On leave today"
          value={stats.onLeaveToday}
          sub="currently out"
        />
      </div>

      <AdminUsersClient
        users={(users ?? []) as any}
        departments={(departments ?? []) as any}
      />

      <Card>
        <CardHeader
          title="All recent requests"
          subtitle="Last 20 across all staff"
        />
        <div>
          {allRequests.length === 0 ? (
            <CardBody>
              <p className="py-6 text-center text-[13px] text-gray-400">
                No requests found.
              </p>
            </CardBody>
          ) : (
            allRequests.map((req: any) => {
              const meta =
                LEAVE_TYPE_META[
                  req.leave_type as keyof typeof LEAVE_TYPE_META
                ];

              const initials =
                req.staff?.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ?? "??";

              return (
                <div
                  key={req.id}
                  className="flex items-center gap-3 border-b border-gray-50 px-4 py-3 last:border-b-0"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-green-200 bg-green-100 font-mono text-[10px] font-bold text-green-700">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-gray-900">
                        {req.staff?.full_name ?? "Unknown staff"}
                      </span>
                      <span className="text-[11px] text-gray-400">·</span>
                      <span className="text-[12px] text-gray-500">
                        {meta?.label ?? req.leave_type}
                      </span>
                      <StatusBadge status={req.status} />
                    </div>

                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {formatDateRange(req.start_date, req.end_date)} ·{" "}
                      {req.working_days} days
                      {req.staff?.department
                        ? ` · ${req.staff.department}`
                        : ""}
                    </p>
                  </div>

                  <span className="hidden flex-shrink-0 font-mono text-[10px] text-gray-300 sm:block">
                    {req.reference}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}