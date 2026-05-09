"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/lib/data";
import { sanitizeText } from "@/lib/security";
import { toUserError } from "@/lib/task-workflow";

const clientSchema = z.object({
  client_name: z.string().transform((value) => sanitizeText(value, 160)).pipe(z.string().min(2))
});

export async function createClientRecord(_: unknown, formData: FormData) {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid client name." };

  const { supabase, profile } = await getSessionContext();
  if (!["admin", "partner"].includes(profile.role)) {
    return { error: "Only admins and partners can create clients." };
  }

  const { error } = await supabase.from("clients").insert({
    firm_id: profile.firm_id,
    client_name: parsed.data.client_name
  });

  if (error) return { error: toUserError(error) };
  revalidatePath("/tasks");
  return { ok: true };
}
