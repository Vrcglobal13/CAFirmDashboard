"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sanitizeText } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { toUserError } from "@/lib/task-workflow";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional()
});

const sendOtpSchema = z.object({
  email: z.string().email(),
  type: z.enum(["email", "recovery"])
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  type: z.enum(["email", "recovery", "signup"]),
});

export async function signIn(_: unknown, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Invalid email or password." };

  if (parsed.data.next === "/owner") {
    const { data: isOwner } = await supabase.rpc("is_platform_owner");
    if (isOwner) redirect("/owner");
  }

  redirect("/dashboard");
}

export async function sendOtpAction(_: unknown, formData: FormData) {
  const parsed = sendOtpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter a valid email address." };

  const { email, type } = parsed.data;
  const supabase = createClient();

  if (type === "email") {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) return { error: toUserError(error) };
  } else if (type === "recovery") {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { error: toUserError(error) };
  }

  return { success: true, email, type };
}

export async function verifyOtpAction(_: unknown, formData: FormData) {
  const parsed = verifyOtpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid OTP format." };

  const { email, otp, type } = parsed.data;
  const supabase = createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: type as any,
  });

  if (error) return { error: "Invalid or expired OTP." };

  if (type === "recovery") {
    return { success: true, type: "recovery" };
  }

  return { success: true, type: "email" };
}

export async function setNewPasswordAction(_: unknown, formData: FormData) {
  const password = formData.get("password") as string;
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters long." };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: toUserError(error) };

  redirect("/dashboard");
}

const baseOnboardingSchema = z.object({
  role: z.enum(["new_firm", "team_member", "partner"]),
  password: z.string().min(8),
  registrationCode: z.string().regex(/^\d{10}$/),
});

const newFirmOnboardingSchema = baseOnboardingSchema.extend({
  role: z.literal("new_firm"),
  name: z.string().transform((value) => sanitizeText(value, 120)).pipe(z.string().min(2)),
  firmName: z.string().transform((value) => sanitizeText(value, 160)).pipe(z.string().min(2)),
  firmAddress: z.string().transform((value) => sanitizeText(value, 240)).pipe(z.string().min(5)),
  firmPhone: z.string().transform((value) => sanitizeText(value, 40)).pipe(z.string().min(7)),
  firmEmail: z.string().email(),
});

const teamOnboardingSchema = baseOnboardingSchema.extend({
  role: z.literal("team_member"),
  name: z.string().transform((value) => sanitizeText(value, 120)).pipe(z.string().min(2)),
  designation: z.string().transform((value) => sanitizeText(value, 120)).pipe(z.string().min(2)),
  mobile: z.string().transform((value) => sanitizeText(value, 40)).pipe(z.string().min(7)),
});

const partnerOnboardingSchema = baseOnboardingSchema.extend({
  role: z.literal("partner"),
  name: z.string().transform((value) => sanitizeText(value, 120)).pipe(z.string().min(2)),
  mobile: z.string().transform((value) => sanitizeText(value, 40)).pipe(z.string().min(7)),
});

export async function completeOnboarding(_: unknown, formData: FormData) {
  const role = formData.get("role") as string;
  const entries = Object.fromEntries(formData);

  let parsed;
  if (role === "new_firm") {
    parsed = newFirmOnboardingSchema.safeParse(entries);
  } else if (role === "team_member") {
    parsed = teamOnboardingSchema.safeParse(entries);
  } else if (role === "partner") {
    parsed = partnerOnboardingSchema.safeParse(entries);
  } else {
    return { error: "Invalid role." };
  }

  if (!parsed.success) {
    return { error: "Please fill all required fields correctly." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in to complete onboarding." };

  const { error: pwdError } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (pwdError) return { error: "Failed to set password." };

  let rpcError = null;

  if (parsed.data.role === "new_firm") {
    const res = await supabase.rpc("create_firm_and_admin", {
      registration_code: parsed.data.registrationCode,
      firm_name: parsed.data.firmName,
      firm_address: parsed.data.firmAddress,
      firm_phone: parsed.data.firmPhone,
      firm_email: parsed.data.firmEmail,
      full_name: parsed.data.name
    });
    rpcError = res.error;
  } else if (parsed.data.role === "team_member") {
    const res = await supabase.rpc("create_team_member_profile", {
      p_registration_code: parsed.data.registrationCode,
      p_full_name: parsed.data.name,
      p_member_designation: parsed.data.designation,
      p_member_mobile: parsed.data.mobile
    });
    rpcError = res.error;
  } else if (parsed.data.role === "partner") {
    const res = await supabase.rpc("create_partner_profile", {
      p_registration_code: parsed.data.registrationCode,
      p_full_name: parsed.data.name,
      p_member_mobile: parsed.data.mobile
    });
    rpcError = res.error;
  }

  if (rpcError) return { error: toUserError(rpcError) };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
