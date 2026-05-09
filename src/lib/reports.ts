import type { Profile, TaskWithRelations } from "@/lib/types";

export type ReportFilters = {
  clientId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type TaskReportRow = TaskWithRelations & {
  completedAt: string | null;
  completionHours: number | null;
  delayedDays: number;
};

export type EmployeePerformanceRow = {
  userId: string;
  name: string;
  assigned: number;
  verified: number;
  delayed: number;
  averageCompletionHours: number | null;
};

export function isDelayed(task: TaskWithRelations, now = new Date()) {
  if (!task.deadline || task.status === "verified") return false;
  const deadline = new Date(`${task.deadline}T23:59:59`);
  return deadline.getTime() < now.getTime();
}

export function delayedDays(task: TaskWithRelations, now = new Date()) {
  if (!task.deadline) return 0;
  const deadline = new Date(`${task.deadline}T23:59:59`);
  return Math.max(0, Math.ceil((now.getTime() - deadline.getTime()) / 86400000));
}

export function buildTaskReport(tasks: TaskWithRelations[]) {
  return tasks.map<TaskReportRow>((task) => {
    const completedAt = task.verified_at ?? task.completed_at;
    const completionHours = completedAt
      ? Math.round(((new Date(completedAt).getTime() - new Date(task.created_at).getTime()) / 3600000) * 10) / 10
      : null;

    return {
      ...task,
      completedAt,
      completionHours,
      delayedDays: delayedDays(task)
    };
  });
}

export function buildEmployeePerformance(tasks: TaskReportRow[], members: Profile[]) {
  return members.map<EmployeePerformanceRow>((member) => {
    const assignedTasks = tasks.filter((task) => task.doer_id === member.id);
    const verifiedTasks = assignedTasks.filter((task) => task.status === "verified");
    const completedDurations = assignedTasks
      .map((task) => task.completionHours)
      .filter((value): value is number => value != null);

    return {
      userId: member.id,
      name: member.name,
      assigned: assignedTasks.length,
      verified: verifiedTasks.length,
      delayed: assignedTasks.filter((task) => task.delayedDays > 0).length,
      averageCompletionHours: completedDurations.length
        ? Math.round((completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length) * 10) / 10
        : null
    };
  });
}

export function filterTasks(tasks: TaskWithRelations[], filters: ReportFilters) {
  return tasks.filter((task) => {
    if (filters.clientId && task.client_id !== filters.clientId) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.dateFrom && task.created_at < `${filters.dateFrom}T00:00:00`) return false;
    if (filters.dateTo && task.created_at > `${filters.dateTo}T23:59:59`) return false;
    return true;
  });
}
