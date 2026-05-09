import { AlertTriangle, BriefcaseBusiness, CalendarCheck, CheckCircle2, Clock3, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { CompactTaskTable } from "@/components/dashboard/CompactTaskTable";
import type { Attendance, Notification, Profile, TaskWithRelations } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { isDelayed } from "@/lib/reports";

export function RoleDashboard({
  profile,
  tasks,
  attendance,
  notifications
}: {
  profile: Profile;
  tasks: TaskWithRelations[];
  attendance: Attendance[];
  notifications: Notification[];
}) {
  const doerTasks = tasks.filter((task) => task.doer_id === profile.id && task.status !== "verified");
  const verifierTasks = tasks.filter((task) => task.verifier_id === profile.id && task.status === "completed");
  const createdTasks = tasks.filter((task) => task.created_by === profile.id);
  const delayedTasks = tasks.filter((task) => isDelayed(task));
  const verified = tasks.filter((task) => task.status === "verified").length;
  const openAttendance = attendance.filter((entry) => !entry.check_out).length;

  const statCards =
    profile.role === "admin"
      ? [
          { label: "Firm tasks", value: tasks.length, icon: BriefcaseBusiness },
          { label: "Verified", value: verified, icon: CheckCircle2 },
          { label: "Delayed", value: delayedTasks.length, icon: AlertTriangle, tone: "accent" as const },
          { label: "Open check-ins", value: openAttendance, icon: CalendarCheck }
        ]
      : profile.role === "partner"
        ? [
            { label: "Tasks created", value: createdTasks.length, icon: BriefcaseBusiness },
            { label: "Delayed tasks", value: delayedTasks.length, icon: AlertTriangle, tone: "accent" as const },
            { label: "Ready to verify", value: verifierTasks.length, icon: CheckCircle2 },
            { label: "Team check-ins", value: openAttendance, icon: Users }
          ]
        : [
            { label: "Doer queue", value: doerTasks.length, icon: Clock3, tone: "accent" as const },
            { label: "To verify", value: verifierTasks.length, icon: CheckCircle2 },
            { label: "Completed", value: verified, icon: BriefcaseBusiness },
            { label: "Attendance entries", value: attendance.length, icon: CalendarCheck }
          ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {profile.role === "employee" ? (
            <>
              <CompactTaskTable title="Tasks assigned as doer" tasks={doerTasks} emptyText="No doer tasks pending." />
              <CompactTaskTable title="Tasks to verify" tasks={verifierTasks} emptyText="No tasks waiting for verification." />
            </>
          ) : profile.role === "partner" ? (
            <>
              <CompactTaskTable title="Tasks created" tasks={createdTasks} emptyText="No tasks created yet." />
              <CompactTaskTable title="Delayed tasks" tasks={delayedTasks} emptyText="No delayed tasks." />
            </>
          ) : (
            <>
              <CompactTaskTable title="Firm-wide overview" tasks={tasks.slice(0, 20)} emptyText="No firm tasks yet." />
              <CompactTaskTable title="Delayed firm tasks" tasks={delayedTasks} emptyText="No delayed tasks." />
            </>
          )}
        </div>
        <div className="space-y-6">
          <NotificationPanel notifications={notifications} />
          <div className="panel p-5">
            <h2 className="font-semibold">Attendance overview</h2>
            <div className="mt-4 space-y-3">
              {attendance.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{entry.users?.name ?? "You"}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(entry.check_in)}</span>
                </div>
              ))}
              {!attendance.length ? <p className="text-sm text-muted-foreground">No attendance records.</p> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
