import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { LEAVE_TYPE_META } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";
import { redirect } from "next/navigation";

async function getTeamData() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const in14  = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

  const [onLeaveRes, upcomingRes] = await Promise.all([
    supabase.from("leave_requests")
      .select("*, staff:profiles!staff_id(full_name, department, role)")
      .eq("status", "approved").lte("start_date", today).gte("end_date", today),
    supabase.from("leave_requests")
      .select("*, staff:profiles!staff_id(full_name, department, role)")
      .eq("status", "approved").gt("start_date", today).lte("start_date", in14)
      .order("start_date", { ascending: true }),
  ]);

  return { onLeave: onLeaveRes.data ?? [], upcoming: upcomingRes.data ?? [] };
}

function PersonRow({ req }: { req: any }) {
  const meta     = LEAVE_TYPE_META[req.leave_type as keyof typeof LEAVE_TYPE_META];
  const initials = req.staff?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0">
      <div className="w-9 h-9 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-[11px] font-bold text-green-700 font-mono flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-900">{req.staff?.full_name}</p>
        <p className="text-[11px] text-gray-400">{req.staff?.department}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1.5 justify-end">
          <span className="text-sm">{meta?.icon}</span>
          <span className="text-[11px] text-gray-600">{meta?.label}</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">{formatDateRange(req.start_date, req.end_date)}</p>
      </div>
    </div>
  );
}

export default async function TeamPage() {
  const profile = await requireProfile();
  if (!["dept_head", "hr", "admin"].includes(profile.role)) redirect("/dashboard");

  const { onLeave, upcoming } = await getTeamData();

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h2 className="font-display text-[22px] md:text-[26px] text-gray-900 mb-1">Team overview</h2>
        <p className="text-[13px] text-gray-400">Leave calendar for your organisation</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader
            title="On leave today"
            subtitle={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            right={
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                onLeave.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                {onLeave.length}
              </span>
            }
          />
          {onLeave.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-[13px] text-gray-400">No one is on leave today.</p>
            </div>
          ) : (
            <div>{onLeave.map((req) => <PersonRow key={req.id} req={req} />)}</div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Upcoming leaves"
            subtitle="Next 14 days"
            right={
              <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                upcoming.length > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                {upcoming.length}
              </span>
            }
          />
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-[13px] text-gray-400">No approved leaves in the next 14 days.</p>
            </div>
          ) : (
            <div>{upcoming.map((req) => <PersonRow key={req.id} req={req} />)}</div>
          )}
        </Card>
      </div>
    </div>
  );
}
