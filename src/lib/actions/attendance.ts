"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/lib/data";
import { toUserError } from "@/lib/task-workflow";

const locationSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export async function checkIn(_: unknown, formData: FormData) {
  const parsed = locationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Location permission is required to check in." };

  const { supabase, profile } = await getSessionContext();
  const today = getTodayInIndia();
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("user_id", profile.id)
    .eq("attendance_date", today)
    .maybeSingle();

  if (existing) return { error: "You have already checked in today." };

  const { error } = await supabase.from("attendance").insert({
    user_id: profile.id,
    firm_id: profile.firm_id,
    attendance_date: today,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude
  });

  if (error) return { error: toUserError(error) };
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function checkInWithLocation(latitude: number, longitude: number) {
  const formData = new FormData();
  formData.set("latitude", String(latitude));
  formData.set("longitude", String(longitude));
  return checkIn(null, formData);
}

export async function checkOut(attendanceId: string) {
  const { supabase, profile } = await getSessionContext();
  const { error } = await supabase
    .from("attendance")
    .update({ check_out: new Date().toISOString() })
    .eq("id", attendanceId)
    .eq("user_id", profile.id)
    .is("check_out", null);

  if (error) return { error: toUserError(error) };
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: true };
}
