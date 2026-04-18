"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole, LeaveTypeName } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: "Not authenticated", me: null as null };
  }

  const { data: me, error } = await supabase
    .from("profiles")
    .select("id, role, email, full_name")
    .eq("id", user.id)
    .single();

  if (error || !me) {
    return { supabase, error: "Profile not found", me: null as null };
  }

  if (me.role !== "admin") {
    return { supabase, error: "Admin only", me: null as null };
  }

  return { supabase, error: null, me };
}

// ── GET ALL DEPARTMENTS ────────────────────────────────────────────

export async function getAllDepartments() {
  const { supabase, error } = await requireAdmin();
  if (error) return { error, data: [] };

  const { data, error: queryError } = await supabase
    .from("departments")
    .select("id, name, code, created_at")
    .order("name", { ascending: true });

  if (queryError) return { error: queryError.message, data: [] };
  return { data: data ?? [], error: null };
}

// ── CREATE DEPARTMENT ──────────────────────────────────────────────

export async function createDepartment(name: string, code?: string | null) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const cleanName = name.trim();
  const cleanCode = code?.trim() ? code.trim().toUpperCase() : null;

  if (!cleanName) {
    return { error: "Department name is required" };
  }

  const { error: insertError } = await supabase.from("departments").insert({
    name: cleanName,
    code: cleanCode,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/admin");
  return { success: true };
}

// ── GET ALL USERS ──────────────────────────────────────────────────

export async function getAllUsers() {
  const { supabase, error } = await requireAdmin();
  if (error) return { error, data: [] };

  const { data, error: queryError } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      role,
      department_id,
      shift,
      avatar_url,
      created_at,
      department:departments(id, name, code)
    `)
    .order("full_name", { ascending: true });

  if (queryError) return { error: queryError.message, data: [] };

  const mapped =
    (data as any[] | null)?.map((user: any) => ({
      ...user,
      department:
        Array.isArray(user.department)
          ? user.department[0]?.name ?? null
          : user.department?.name ?? null,
      department_code:
        Array.isArray(user.department)
          ? user.department[0]?.code ?? null
          : user.department?.code ?? null,
    })) ?? [];

  return { data: mapped, error: null };
}

// ── UPDATE USER ROLE ───────────────────────────────────────────────

export async function updateUserRole(userId: string, role: UserRole) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const adminSupabase = createAdminClient();

  const validRoles: UserRole[] = ["staff", "dept_head", "hr", "admin"];
  if (!validRoles.includes(role)) {
    return { error: "Invalid role" };
  }

  if (role === "hr") {
    const { data: existingHr, error: hrError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "hr")
      .neq("id", userId)
      .maybeSingle();

    if (hrError) return { error: hrError.message };
    if (existingHr) {
      return { error: "Only one HR approver is allowed" };
    }
  }

  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin");
  return { success: true };
}

// ── UPDATE USER DEPARTMENT ─────────────────────────────────────────

export async function updateUserDepartment(
  userId: string,
  departmentId: string | null
) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const adminSupabase = createAdminClient();

  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({ department_id: departmentId })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin");
  return { success: true };
}

// ── UPDATE USER ROLE + DEPARTMENT TOGETHER ────────────────────────

export async function updateUserRoleAndDepartment(
  userId: string,
  role: UserRole,
  departmentId: string | null
) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const adminSupabase = createAdminClient();

  const validRoles: UserRole[] = ["staff", "dept_head", "hr", "admin"];
  if (!validRoles.includes(role)) {
    return { error: "Invalid role" };
  }

  if (role === "hr") {
    const { data: existingHr, error: hrError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "hr")
      .neq("id", userId)
      .maybeSingle();

    if (hrError) return { error: hrError.message };
    if (existingHr) {
      return { error: "Only one HR approver is allowed" };
    }
  }

  const { error: updateError } = await adminSupabase
    .from("profiles")
    .update({
      role,
      department_id: departmentId,
    })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin");
  return { success: true };
}

// ── GET USER BALANCES (for editing) ───────────────────────────────

export async function getUserBalances(userId: string) {
  const { supabase, error } = await requireAdmin();
  if (error) return [];

  const { data } = await supabase
    .from("leave_balances")
    .select("*")
    .eq("staff_id", userId)
    .eq("year", new Date().getFullYear())
    .order("leave_type", { ascending: true });

  return data ?? [];
}

// ── UPDATE LEAVE BALANCE ───────────────────────────────────────────

export async function updateLeaveBalance(
  userId: string,
  leaveType: LeaveTypeName,
  totalDays: number
) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const year = new Date().getFullYear();

  const { error: upsertError } = await supabase.from("leave_balances").upsert(
    {
      staff_id: userId,
      leave_type: leaveType,
      year,
      total_days: totalDays,
    },
    { onConflict: "staff_id,leave_type,year" }
  );

  if (upsertError) return { error: upsertError.message };

  revalidatePath("/admin");
  return { success: true };
}

// ── SEED BALANCES FOR NEW USER ─────────────────────────────────────

export async function seedUserBalances(userId: string) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const year = new Date().getFullYear();

  const defaults: { leave_type: LeaveTypeName; total_days: number }[] = [
    { leave_type: "annual", total_days: 20 },
    { leave_type: "sick", total_days: 10 },
    { leave_type: "maternity_paternity", total_days: 90 },
    { leave_type: "emergency", total_days: 3 },
    { leave_type: "casual", total_days: 5 },
  ];

  const rows = defaults.map((d) => ({
    staff_id: userId,
    year,
    ...d,
  }));

  const { error: upsertError } = await supabase
    .from("leave_balances")
    .upsert(rows, { onConflict: "staff_id,leave_type,year" });

  if (upsertError) return { error: upsertError.message };

  revalidatePath("/admin");
  return { success: true };
}

// ── ADMIN STATS ────────────────────────────────────────────────────

export async function getAdminStats() {
  const { supabase, error } = await requireAdmin();
  if (error) {
    return {
      totalUsers: 0,
      pendingLeaves: 0,
      approvedYear: 0,
      onLeaveToday: 0,
    };
  }

  const today = new Date().toISOString().split("T")[0];
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const [usersRes, pendingRes, approvedRes, onLeaveRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_dept_head", "pending_hr"]),
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("created_at", yearStart),
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved")
      .lte("start_date", today)
      .gte("end_date", today),
  ]);

  return {
    totalUsers: usersRes.count ?? 0,
    pendingLeaves: pendingRes.count ?? 0,
    approvedYear: approvedRes.count ?? 0,
    onLeaveToday: onLeaveRes.count ?? 0,
  };
}

// ── ALL REQUESTS (admin view) ──────────────────────────────────────

export async function getAllRequests(limit = 50) {
  const { supabase, error } = await requireAdmin();
  if (error) return [];

  const { data, error: queryError } = await supabase
    .from("leave_requests")
    .select(`
      *,
      staff:profiles!staff_id(
        id,
        full_name,
        email,
        role,
        department_id,
        department:departments(id, name, code)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (queryError) return [];

  const mapped =
    (data as any[] | null)?.map((req: any) => ({
      ...req,
      staff: req.staff
        ? {
            ...req.staff,
            department:
              Array.isArray(req.staff.department)
                ? req.staff.department[0]?.name ?? null
                : req.staff.department?.name ?? null,
            department_code:
              Array.isArray(req.staff.department)
                ? req.staff.department[0]?.code ?? null
                : req.staff.department?.code ?? null,
          }
        : null,
    })) ?? [];

  return mapped;
}

// Create new user from Admin Panel
export async function createUserByAdmin(input: {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  department_id: string | null;
}) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };

  const adminSupabase = createAdminClient();

  const full_name = input.full_name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const role = input.role;
  const department_id = input.department_id;

  if (!full_name || !email || !password) {
    return { error: "Full name, email, and password are required." };
  }

  const validRoles: UserRole[] = ["staff", "dept_head", "hr", "admin"];
  if (!validRoles.includes(role)) {
    return { error: "Invalid role." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (role === "hr") {
    const { data: existingHr, error: hrError } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "hr")
      .maybeSingle();

    if (hrError) return { error: hrError.message };
    if (existingHr) return { error: "Only one HR approver is allowed." };
  }

  const { data, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name,
    },
  });

  if (createError || !data.user) {
    return { error: createError?.message || "Failed to create user." };
  }

  const userId = data.user.id;

  // The trigger already creates the profile row.
  // So here we UPDATE that row with admin-only fields.
  const { error: profileUpdateError } = await adminSupabase
    .from("profiles")
    .update({
      email,
      full_name,
      role,
      department_id,
    })
    .eq("id", userId);

  if (profileUpdateError) {
    return { error: profileUpdateError.message };
  }

  revalidatePath("/admin");
  return { success: true };
}