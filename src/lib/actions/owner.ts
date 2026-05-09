"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sanitizeText } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { toUserError } from "@/lib/task-workflow";

const codeSchema = z.object({
  registrationCode: z.string().regex(/^\d{10}$/),
  notes: z.string().transform((value) => sanitizeText(value, 160)).optional()
});

export async function createRegistrationCode(_: unknown, formData: FormData) {
  const parsed = codeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a unique 10-digit code." };

  const supabase = createClient();
  const { error } = await supabase.rpc("create_registration_code", {
    registration_code: parsed.data.registrationCode,
    notes: parsed.data.notes || null
  });

  if (error) return { error: toUserError(error) };

  revalidatePath("/owner");
  return { error: "" };
}
