import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "@/components/apply/ApplyForm";

async function getApprovers(userId: string) {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, department_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile || !profile.department_id) return [];

  const { data: hrUser } = await supabase
    .from("profiles")
    .select("id, full_name, role, department_id")
    .eq("role", "hr")
    .single();

  if (!hrUser) return [];

  const isHRStaff = profile.department_id === hrUser.department_id;

  if (isHRStaff) {
    return [{
      initials: hrUser.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
      name: hrUser.full_name.split(" ")[0] + " " + hrUser.full_name.split(" ").slice(-1)[0][0] + ".",
      role: "HR Manager",
    }];
  }

  const { data: deptHead } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("role", "dept_head")
    .eq("department_id", profile.department_id)
    .single();

  const approvers: Array<{ initials: string; name: string; role: string }> = [];

  if (deptHead) {
    approvers.push({
      initials: deptHead.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
      name: deptHead.full_name.split(" ")[0] + " " + deptHead.full_name.split(" ").slice(-1)[0][0] + ".",
      role: "Head of Department",
    });
  }

  approvers.push({
    initials: hrUser.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
    name: hrUser.full_name.split(" ")[0] + " " + hrUser.full_name.split(" ").slice(-1)[0][0] + ".",
    role: "HR Manager",
  });

  return approvers;
}

export default async function ApplyPage() {
  const profile = await requireProfile();
  const approvers = await getApprovers(profile.id);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 max-w-3xl">
        <h2 className="mb-1 font-display text-[22px] text-gray-900 md:text-[26px]">New leave request</h2>
        <p className="text-[13px] text-gray-400">Complete the form below and your request will be routed automatically for approval.</p>
      </div>
      <ApplyForm approvers={approvers} />
    </div>
  );
}
