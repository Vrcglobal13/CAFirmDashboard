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

  if (!code || !/^\d{10}$/.test(code)) {
    return { error: "Registration code must be exactly 10 digits." };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("create_registration_code", {
    registration_code: code,
    notes: notes || null
  });

  if (error) {
    console.error("Failed to create registration code", error);
    return { error: "Failed to create registration code. Ensure it is unique." };
  }

  revalidatePath("/owner");
  return { success: true };
}
