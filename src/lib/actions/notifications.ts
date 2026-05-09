"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/lib/data";
import { toUserError } from "@/lib/task-workflow";

export async function markNotificationRead(notificationId: string) {
  const parsed = z.string().uuid().safeParse(notificationId);
  if (!parsed.success) return { error: "Invalid notification id." };

  const { supabase, profile } = await getSessionContext();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", parsed.data)
    .eq("user_id", profile.id);

  if (error) return { error: toUserError(error) };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markAllNotificationsRead() {
  const { supabase, profile } = await getSessionContext();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", profile.id)
    .eq("is_read", false);

  if (error) return { error: toUserError(error) };
  revalidatePath("/dashboard");
  return { ok: true };
}
