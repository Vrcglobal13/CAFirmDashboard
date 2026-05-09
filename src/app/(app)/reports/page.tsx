import { AlertTriangle, CheckCircle2, Clock3, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportsTables } from "@/components/reports/ReportsTables";
import { getReportsData } from "@/lib/data";
import type { ReportFilters as ReportFilterValues } from "@/lib/reports";

type ReportsPageProps = {
  searchParams?: {
    clientId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  };
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const filters: ReportFilterValues = {
    clientId: searchParams?.clientId || undefined,
    status: searchParams?.status || undefined,
    dateFrom: searchParams?.dateFrom || undefined,
    dateTo: searchParams?.dateTo || undefined
  };
  const { clients, taskReport, employeePerformance } = await getReportsData(filters);
  const completedTasks = taskReport.filter((task) => task.completionHours != null);
  const averageCompletionHours = completedTasks.length
    ? Math.round((completedTasks.reduce((sum, task) => sum + (task.completionHours ?? 0), 0) / completedTasks.length) * 10) / 10
    : 0;
  const delayedTasks = taskReport.filter((task) => task.delayedDays > 0).length;
  const verifiedTasks = taskReport.filter((task) => task.status === "verified").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completion time, delays, and employee performance.</p>
      </div>

      <ReportFilters clients={clients} defaultValues={filters} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tasks in report" value={taskReport.length} icon={Clock3} />
        <StatCard label="Verified tasks" value={verifiedTasks} icon={CheckCircle2} />
        <StatCard label="Delayed tasks" value={delayedTasks} icon={AlertTriangle} tone="accent" />
        <StatCard label="Avg completion" value={`${averageCompletionHours}h`} icon={Users} />
      </section>

      <ReportsTables tasks={taskReport} performance={employeePerformance} />
    </div>
  );
}
