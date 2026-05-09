import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { getDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const { profile, tasks, attendance, notifications } = await getDashboardData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profile.role === "admin"
            ? "Firm-wide overview across tasks and attendance."
            : profile.role === "partner"
              ? "Tasks created by you, delayed work, and team activity."
              : "Your doer queue and verification queue."}
        </p>
      </div>
      <RoleDashboard profile={profile} tasks={tasks} attendance={attendance} notifications={notifications} />
    </div>
  );
}
