import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusClass: Record<TaskStatus, string> = {
  created: "border-slate-200 bg-slate-50 text-slate-700",
  in_progress: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-amber-200 bg-amber-50 text-amber-700",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <span className={cn("badge capitalize", statusClass[status])}>{status.replace("_", " ")}</span>;
}
