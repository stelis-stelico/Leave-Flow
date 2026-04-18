import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HistoryClient } from "@/components/history/HistoryClient";
import { LEAVE_TYPE_META } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";

async function getHistory(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leave_requests").select("*")
    .eq("staff_id", userId).order("created_at", { ascending: false });

  return (data ?? []).map((req) => ({
    id:           req.id,
    reference:    req.reference,
    leave_type:   req.leave_type,
    leave_label:  LEAVE_TYPE_META[req.leave_type as keyof typeof LEAVE_TYPE_META]?.label ?? req.leave_type,
    leave_icon:   LEAVE_TYPE_META[req.leave_type as keyof typeof LEAVE_TYPE_META]?.icon  ?? "📄",
    status:       req.status,
    dates:        formatDateRange(req.start_date, req.end_date),
    working_days: req.working_days,
    created_at:   req.created_at,
  }));
}

export default async function HistoryPage() {
  const profile = await requireProfile();
  const history = await getHistory(profile.id);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h2 className="font-display text-[22px] md:text-[26px] text-gray-900 mb-1">Leave history</h2>
        <p className="text-[13px] text-gray-400">Your complete leave record · {new Date().getFullYear()}</p>
      </div>
      <HistoryClient requests={history} />
    </div>
  );
}
