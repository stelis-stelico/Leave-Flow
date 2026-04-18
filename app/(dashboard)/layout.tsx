import { requireProfile, getUnreadCount, getPendingCount } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, unreadCount, pendingCount] = await Promise.all([
    requireProfile(),
    getUnreadCount(),
    getPendingCount(),
  ]);

  return (
    <DashboardShell
      profile={profile}
      unreadCount={unreadCount}
      pendingCount={pendingCount}
    >
      {children}
    </DashboardShell>
  );
}
