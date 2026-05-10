"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFirmStatus(firmId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("toggle_firm_status", { target_firm_id: firmId });
  if (error) {
    console.error("Failed to toggle firm status", error);
    return { error: error.message };
  }

  revalidatePath("/owner");
  return { success: true };
}

export async function createRegistrationCode(_: unknown, formData: FormData) {
  const code = formData.get("registrationCode")?.toString();
  const notes = formData.get("notes")?.toString();
  const expiresAtStr = formData.get("expiresAt")?.toString();

  if (!code || !/^\d{10}$/.test(code)) {
    return { error: "Registration code must be exactly 10 digits." };
  }

  let p_expires_at = null;
  if (expiresAtStr) {
    p_expires_at = new Date(expiresAtStr).toISOString();
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("create_registration_code", {
    registration_code: code,
    notes: notes || null,
    p_expires_at
  });

  if (error) {
    console.error("Failed to create registration code", error);
    return { error: "Failed to create registration code. Ensure it is unique." };
  }

  revalidatePath("/owner");
  return { success: true };
}

export async function toggleRegistrationCodeStatus(code: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("toggle_registration_code_status", { p_code: code });
  if (error) {
    console.error("Failed to toggle registration code status", error);
    return { error: error.message };
  }

  revalidatePath("/owner");
  return { success: true };
}
