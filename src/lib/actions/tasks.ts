"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/lib/data";
import { sanitizeText } from "@/lib/security";
import { toUserError, validateStatusTransition } from "@/lib/task-workflow";
import type { TaskStatus } from "@/lib/types";

const taskSchema = z.object({
  client_id: z.string().uuid(),
  title: z.string().transform((value) => sanitizeText(value, 160)).pipe(z.string().min(3)),
  description: z.string().optional().transform((value) => value ? sanitizeText(value, 2000) : undefined),
  doer_id: z.string().uuid(),
  verifier_id: z.string().uuid(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export async function createTask(_: unknown, formData: FormData) {
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Check the task fields and try again." };

  if (parsed.data.doer_id === parsed.data.verifier_id) {
    return { error: "Choose different people for doer and verifier." };
  }

  const { supabase, profile } = await getSessionContext();
  if (!["admin", "partner"].includes(profile.role)) {
    return { error: "Only admins and partners can create tasks." };
  }

  const { error } = await supabase.from("tasks").insert({
    firm_id: profile.firm_id,
    client_id: parsed.data.client_id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    created_by: profile.id,
    doer_id: parsed.data.doer_id,
    verifier_id: parsed.data.verifier_id,
    priority: parsed.data.priority,
    deadline: parsed.data.deadline || null,
    status: "created"
  });

  if (error) return { error: toUserError(error) };
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { ok: true };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const allowedStatuses: TaskStatus[] = ["in_progress", "completed", "verified"];
  if (!allowedStatuses.includes(status)) return { error: "Invalid status." };

  const { supabase, profile } = await getSessionContext();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, status, doer_id, verifier_id")
    .eq("id", taskId)
    .single();

  if (taskError || !task) return { error: "Task not found or not accessible." };

  const permissionError = validateStatusTransition({
    currentStatus: task.status as TaskStatus,
    nextStatus: status,
    task,
    profile
  });

  if (permissionError) return { error: permissionError };

  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);

  if (error) return { error: toUserError(error) };
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  return { ok: true };
}
