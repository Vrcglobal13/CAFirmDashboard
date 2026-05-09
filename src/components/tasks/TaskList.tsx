"use client";

import { CheckCircle2, CircleDot, ShieldCheck } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { updateTaskStatus } from "@/lib/actions/tasks";
import type { Profile, TaskStatus, TaskWithRelations } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { useRealtimeHighlights } from "@/components/layout/RealtimeProvider";
import { StatusBadge } from "@/components/tasks/StatusBadge";

export function TaskList({ tasks, profile }: { tasks: TaskWithRelations[]; profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const { highlightedTaskIds, clearTaskHighlight } = useRealtimeHighlights();

  useEffect(() => {
    const timers = tasks
      .filter((task) => highlightedTaskIds.has(task.id))
      .map((task) => window.setTimeout(() => clearTaskHighlight(task.id), 9000));

    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [clearTaskHighlight, highlightedTaskIds, tasks]);

  function mutate(taskId: string, status: TaskStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, status);
      if (result?.error) setError(result.error);
    });
  }

  if (!tasks.length) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-medium">No tasks yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Tasks created or assigned to you will appear here.</p>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      {error ? <div className="border-b border-border bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">People</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const canStart = task.doer_id === profile.id && task.status === "created";
              const canComplete = task.doer_id === profile.id && task.status === "in_progress";
              const canVerify = task.verifier_id === profile.id && task.status === "completed";
              const isNew = highlightedTaskIds.has(task.id);

              return (
                <tr
                  key={task.id}
                  className={cn(
                    "bg-surface align-top transition-colors",
                    isNew && "bg-emerald-50 ring-1 ring-inset ring-emerald-200"
                  )}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{task.title}</p>
                      {isNew ? <span className="badge border-emerald-200 bg-emerald-100 text-emerald-700">New</span> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 max-w-md text-xs text-muted-foreground">{task.description}</p>
                    <span className="badge mt-2 capitalize">{task.priority}</span>
                  </td>
                  <td className="px-4 py-4">{task.clients?.client_name ?? "-"}</td>
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    <p>Doer: {task.doer?.name ?? "-"}</p>
                    <p>Verifier: {task.verifier?.name ?? "-"}</p>
                    <p>By: {task.creator?.name ?? "-"}</p>
                  </td>
                  <td className="px-4 py-4">{formatDate(task.deadline)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {canStart ? (
                        <button className="btn-secondary" disabled={pending} onClick={() => mutate(task.id, "in_progress")}>
                          <CircleDot size={15} />
                          Start
                        </button>
                      ) : null}
                      {canComplete ? (
                        <button className="btn-secondary" disabled={pending} onClick={() => mutate(task.id, "completed")}>
                          <CheckCircle2 size={15} />
                          Complete
                        </button>
                      ) : null}
                      {canVerify ? (
                        <button className="btn-primary" disabled={pending} onClick={() => mutate(task.id, "verified")}>
                          <ShieldCheck size={15} />
                          Verify
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
