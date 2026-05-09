import type { EmployeePerformanceRow, TaskReportRow } from "@/lib/reports";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/tasks/StatusBadge";

function formatHours(value: number | null) {
  return value == null ? "-" : `${value}h`;
}

export function ReportsTables({
  tasks,
  performance
}: {
  tasks: TaskReportRow[];
  performance: EmployeePerformanceRow[];
}) {
  return (
    <div className="space-y-6">
      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Task completion and delays</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Doer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Completion time</th>
                <th className="px-4 py-3">Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.length ? (
                tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-4 py-3 font-medium">{task.title}</td>
                    <td className="px-4 py-3">{task.clients?.client_name ?? "-"}</td>
                    <td className="px-4 py-3">{task.doer?.name ?? "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3">{formatDate(task.deadline)}</td>
                    <td className="px-4 py-3">{formatHours(task.completionHours)}</td>
                    <td className="px-4 py-3">{task.delayedDays ? `${task.delayedDays}d` : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                    No tasks match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Employee performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Delayed</th>
                <th className="px-4 py-3">Avg completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {performance.map((row) => (
                <tr key={row.userId}>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.assigned}</td>
                  <td className="px-4 py-3">{row.verified}</td>
                  <td className="px-4 py-3">{row.delayed}</td>
                  <td className="px-4 py-3">{formatHours(row.averageCompletionHours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
