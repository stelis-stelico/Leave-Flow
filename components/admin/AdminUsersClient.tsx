"use client";

import { useMemo, useState, useTransition } from "react";
import { createUserByAdmin, updateUserRole, updateUserDepartment } from "@/app/actions/admin";
import { Card, CardHeader } from "@/components/ui/Card";
import type { UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { ChevronDown, UserPlus } from "lucide-react";

type DepartmentOption = {
  id: string;
  name: string;
  code?: string | null;
};

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  department?: string | null;
  department_code?: string | null;
  created_at?: string;
  shift?: string | null;
  avatar_url?: string | null;
};

interface Props {
  users: UserRow[];
  departments: DepartmentOption[];
}

const ROLES: UserRole[] = ["staff", "dept_head", "hr", "admin"];

export function AdminUsersClient({ users: initialUsers, departments }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [expandId, setExpandId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "staff" as UserRole,
    department_id: "",
  });

  const departmentMap = useMemo(() => new Map(departments.map((d) => [d.id, d])), [departments]);

  function handleExpand(userId: string) {
    setExpandId((prev) => (prev === userId ? null : userId));
  }

  function handleCreateUser() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await createUserByAdmin({
        full_name: newUser.full_name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        department_id: newUser.department_id || null,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      setSuccess("User created successfully.");
      setNewUser({ full_name: "", email: "", password: "", role: "staff", department_id: "" });
      window.location.reload();
    });
  }

  function handleRoleChange(userId: string, role: UserRole) {
    setError(null);

    startTransition(async () => {
      const result = await updateUserRole(userId, role);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    });
  }

  function handleDepartmentChange(userId: string, departmentId: string) {
    setError(null);
    const nextDepartmentId = departmentId || null;
    const dept = nextDepartmentId ? departmentMap.get(nextDepartmentId) : null;

    startTransition(async () => {
      const result = await updateUserDepartment(userId, nextDepartmentId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, department_id: nextDepartmentId, department: dept?.name ?? null, department_code: dept?.code ?? null }
            : u
        )
      );
    });
  }

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Card>
      <CardHeader
        title="User management"
        subtitle={`${users.length} registered users`}
        right={<span className="text-[11px] text-gray-400">Create users and assign roles and departments</span>}
      />

      {(error || success) && (
        <div className="mx-4 mt-3 space-y-2">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</div>}
          {success && <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">{success}</div>}
        </div>
      )}

      <div className="mx-4 mt-4 rounded-xl border border-green-100 bg-green-50/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <UserPlus size={16} className="text-green-700" />
          <p className="text-sm font-semibold text-gray-800">Create new user</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input type="text" placeholder="Full name" value={newUser.full_name} onChange={(e) => setNewUser((prev) => ({ ...prev, full_name: e.target.value }))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500" />
          <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500" />
          <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500" />
          <select value={newUser.role} onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as UserRole }))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500">
            {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
          </select>
          <select value={newUser.department_id} onChange={(e) => setNewUser((prev) => ({ ...prev, department_id: e.target.value }))} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-500">
            <option value="">No department</option>
            {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}{dept.code ? ` (${dept.code})` : ""}</option>)}
          </select>
        </div>

        <div className="mt-3">
          <button onClick={handleCreateUser} disabled={isPending} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50">{isPending ? "Creating..." : "Create user"}</button>
        </div>
      </div>

      <div className="mt-4">
        {users.map((user) => {
          const isExpanded = expandId === user.id;
          return (
            <div key={user.id} className="border-b border-gray-50 last:border-b-0">
              <div onClick={() => handleExpand(user.id)} className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-green-50/40 sm:flex-nowrap">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-green-200 bg-green-100 font-mono text-[10px] font-bold text-green-700">{getInitials(user.full_name)}</div>

                <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                  <p className="text-[13px] font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-[11px] text-gray-400 break-all sm:break-normal">{user.email}</p>
                </div>

                <div className="min-w-0 basis-full sm:basis-auto sm:w-40 md:block">
                  <p className="truncate text-[11px] text-gray-500">{user.department ?? "No department"}</p>
                  {user.department_code && <p className="text-[10px] text-gray-400">{user.department_code}</p>}
                </div>

                <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-auto">
                  <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)} disabled={isPending} className="w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 outline-none focus:border-green-400 sm:w-auto">
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>

                <button className="ml-auto flex-shrink-0 text-gray-400 transition-colors hover:text-green-600"><ChevronDown size={15} className={isExpanded ? "rotate-180 transition-transform" : "transition-transform"} /></button>
              </div>

              {isExpanded && (
                <div className="border-t border-green-100 bg-green-50/30 px-4 pb-4">
                  <div className="grid grid-cols-1 gap-4 pt-3 lg:grid-cols-2">
                    <div className="rounded-lg border border-green-100 bg-white p-3">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-600">User setup</p>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-400">Role</label>
                          <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)} disabled={isPending} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-green-400">
                            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] uppercase tracking-wide text-gray-400">Department</label>
                          <select value={user.department_id ?? ""} onChange={(e) => handleDepartmentChange(user.id, e.target.value)} disabled={isPending} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 outline-none focus:border-green-400">
                            <option value="">No department</option>
                            {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}{dept.code ? ` (${dept.code})` : ""}</option>)}
                          </select>
                        </div>
                        <div className="rounded-md bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
                          <p><span className="font-medium text-gray-700">Current role:</span> {ROLE_LABELS[user.role]}</p>
                          <p className="mt-1"><span className="font-medium text-gray-700">Current department:</span> {user.department ?? "None"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-green-100 bg-white p-3">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-600">Role notes</p>
                      <div className="space-y-3 text-[12px] text-gray-600">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <p className="font-semibold text-gray-800">Staff</p>
                          <p className="mt-1">Can submit leave requests and track their request history.</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <p className="font-semibold text-gray-800">Department Head</p>
                          <p className="mt-1">Reviews requests for staff within the same department.</p>
                        </div>
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                          <p className="font-semibold text-gray-800">HR / Admin</p>
                          <p className="mt-1">Handles final approval and broader system administration tasks.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
