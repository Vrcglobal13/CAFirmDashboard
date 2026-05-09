"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sanitizeText } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { toUserError } from "@/lib/task-workflow";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy_key_for_build");

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional()
});

const signupSchema = loginSchema.extend({
  name: z.string().transform((value) => sanitizeText(value, 120)).pipe(z.string().min(2)),
  firmName: z.string().transform((value) => sanitizeText(value, 160)).pipe(z.string().min(2)),
  firmAddress: z.string().transform((value) => sanitizeText(value, 240)).pipe(z.string().min(5)),
  firmPhone: z.string().transform((value) => sanitizeText(value, 40)).pipe(z.string().min(7)),
  firmEmail: z.string().email(),
  registrationCode: z.string().regex(/^\d{10}$/)
});

const teamSignupSchema = loginSchema.extend({
  name: z.string().transform((value) => sanitizeText(value, 120)).pipe(z.string().min(2)),
  designation: z.string().transform((value) => sanitizeText(value, 120)).pipe(z.string().min(2)),
  mobile: z.string().transform((value) => sanitizeText(value, 40)).pipe(z.string().min(7)),
  registrationCode: z.string().regex(/^\d{10}$/)
});

const partnerSignupSchema = loginSchema.extend({
  name: z.string().transform((value) => sanitizeText(value, 120)).pipe(z.string().min(2)),
  mobile: z.string().transform((value) => sanitizeText(value, 40)).pipe(z.string().min(7)),
  registrationCode: z.string().regex(/^\d{10}$/)
});

const onboardingSchema = z.object({
  name: z.string().transform((value) => sanitizeText(value, 120)).pipe(z.string().min(2)),
  firmName: z.string().transform((value) => sanitizeText(value, 160)).pipe(z.string().min(2)),
  firmAddress: z.string().transform((value) => sanitizeText(value, 240)).pipe(z.string().min(5)),
  firmPhone: z.string().transform((value) => sanitizeText(value, 40)).pipe(z.string().min(7)),
  firmEmail: z.string().email(),
  registrationCode: z.string().regex(/^\d{10}$/)
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

export async function sendRegistrationOtp(_: unknown, formData: FormData) {
  const role = formData.get("role") as string;
  const entries = Object.fromEntries(formData);

  let parsed;
  if (role === "new_firm") {
    parsed = signupSchema.safeParse(entries);
  } else if (role === "team_member") {
    parsed = teamSignupSchema.safeParse(entries);
  } else if (role === "partner") {
    parsed = partnerSignupSchema.safeParse(entries);
  } else {
    return { error: "Invalid role." };
  }

  if (!parsed.success) {
     return { error: "Please fill all required fields correctly." };
  }

  const email = parsed.data.email;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const supabase = createClient();
  const { error: dbError } = await supabase
    .from("register_otps")
    .upsert({ email, otp, expires_at: new Date(Date.now() + 10 * 60000).toISOString() });

  if (dbError) {
    return { error: "Failed to generate OTP." };
  }

  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "dummy_key_for_build") {
    const { error: emailError } = await resend.emails.send({
      from: "CA Firm OS <onboarding@resend.dev>",
      to: email,
      subject: "Your Registration OTP",
      text: `Your OTP for registration is: ${otp}. It is valid for 10 minutes.`,
    });

    if (emailError) {
      return { error: "Failed to send OTP email." };
    }
  }

  return { success: true, email, formData: formData };
}

export async function verifyAndRegister(_: unknown, formData: FormData) {
  const role = formData.get("role") as string;
  const otp = formData.get("otp") as string;
  const email = formData.get("email") as string;
  const entries = Object.fromEntries(formData);

  if (!otp || !email) {
     return { error: "OTP and email are required." };
  }

  const supabase = createClient();

  const { data: otpData, error: otpError } = await supabase
    .from("register_otps")
    .select("*")
    .eq("email", email)
    .single();

  if (otpError || !otpData) {
    return { error: "Invalid or expired OTP." };
  }

  if (otpData.otp !== otp) {
    return { error: "Incorrect OTP." };
  }

  if (new Date(otpData.expires_at) < new Date()) {
    return { error: "OTP has expired." };
  }

  await supabase.from("register_otps").delete().eq("email", email);

  let parsed;
  if (role === "new_firm") {
    parsed = signupSchema.safeParse(entries);
  } else if (role === "team_member") {
    parsed = teamSignupSchema.safeParse(entries);
  } else if (role === "partner") {
    parsed = partnerSignupSchema.safeParse(entries);
  } else {
    return { error: "Invalid role." };
  }

  if (!parsed.success) {
    return { error: "Please fill all required fields correctly." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: siteUrl
      ? {
          emailRedirectTo: new URL("/auth/callback?next=/dashboard", siteUrl).toString()
        }
      : undefined
  });

  if (error) return { error: toUserError(error) };
  if (!data.user) return { error: "Supabase did not return a user. Check email confirmation settings." };

  let rpcError = null;

  if (role === "new_firm") {
     const res = await supabase.rpc("create_firm_and_admin", {
      registration_code: parsed.data.registrationCode,
      firm_name: (parsed.data as any).firmName,
      firm_address: (parsed.data as any).firmAddress,
      firm_phone: (parsed.data as any).firmPhone,
      firm_email: (parsed.data as any).firmEmail,
      full_name: parsed.data.name
    });
    rpcError = res.error;
  } else if (role === "team_member") {
    const res = await supabase.rpc("create_team_member_profile", {
      p_registration_code: parsed.data.registrationCode,
      p_full_name: parsed.data.name,
      p_member_designation: (parsed.data as any).designation,
      p_member_mobile: (parsed.data as any).mobile
    });
    rpcError = res.error;
  } else if (role === "partner") {
     const res = await supabase.rpc("create_partner_profile", {
      p_registration_code: parsed.data.registrationCode,
      p_full_name: parsed.data.name,
      p_member_mobile: (parsed.data as any).mobile
    });
    rpcError = res.error;
  }

  if (rpcError) return { error: toUserError(rpcError) };

  redirect("/dashboard");
}

export async function createFirmAdmin(_: unknown, formData: FormData) {
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter firm details, owner name, and the 10-digit registration code." };

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sign in before creating a firm." };

  const { error } = await supabase.rpc("create_firm_and_admin", {
    registration_code: parsed.data.registrationCode,
    firm_name: parsed.data.firmName,
    firm_address: parsed.data.firmAddress,
    firm_phone: parsed.data.firmPhone,
    firm_email: parsed.data.firmEmail,
    full_name: parsed.data.name
  });

  if (error) return { error: toUserError(error) };
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
