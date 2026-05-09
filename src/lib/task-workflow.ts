import type { Profile, TaskStatus } from "@/lib/types";

export const nextStatusByCurrent: Record<TaskStatus, TaskStatus | null> = {
  created: "in_progress",
  in_progress: "completed",
  completed: "verified",
  verified: null
};

export function validateStatusTransition({
  currentStatus,
  nextStatus,
  task,
  profile
}: {
  currentStatus: TaskStatus;
  nextStatus: TaskStatus;
  task: { doer_id: string; verifier_id: string };
  profile: Pick<Profile, "id" | "role">;
}) {
  if (nextStatusByCurrent[currentStatus] !== nextStatus) {
    return `Invalid workflow transition from ${currentStatus} to ${nextStatus}.`;
  }

  if (profile.role === "admin") {
    return null;
  }

  if ((nextStatus === "in_progress" || nextStatus === "completed") && task.doer_id !== profile.id) {
    return "Only the assigned doer can perform this action.";
  }

  if (nextStatus === "verified" && task.verifier_id !== profile.id) {
    return "Only the assigned verifier can verify this task.";
  }

  return null;
}

export function toUserError(error: { message?: string } | null | undefined) {
  if (!error?.message) return "Something went wrong. Please try again.";
  if (error.message.includes("duplicate key")) return "This record already exists.";
  if (error.message.includes("row-level security")) return "You do not have permission to perform this action.";
  return error.message;
}
