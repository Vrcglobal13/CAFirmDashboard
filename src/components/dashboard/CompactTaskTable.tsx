import type { TaskWithRelations } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/tasks/StatusBadge";

export function CompactTaskTable({
  title,
  tasks,
  emptyText
}: {
  title: string;
  tasks: TaskWithRelations[];
  emptyText: string;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.length ? (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-3 font-medium">{task.title}</td>
                  <td className="px-4 py-3">{task.clients?.client_name ?? "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{task.doer?.name ?? "-"}</td>
                  <td className="px-4 py-3">{formatDate(task.deadline)}</td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
