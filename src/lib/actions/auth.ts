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

export async function signUp(_: unknown, formData: FormData) {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter firm, owner, email, and an 8+ character password." };

  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: siteUrl
      ? {
          emailRedirectTo: new URL("/auth/callback?next=/onboarding", siteUrl).toString()
        }
      : undefined
  });

  if (error) return { error: toUserError(error) };
  if (!data.user) return { error: "Supabase did not return a user. Check email confirmation settings." };
  if (!data.session) return { error: "Check your email to confirm the account, then finish firm setup." };

  const { error: rpcError } = await supabase.rpc("create_firm_and_admin", {
    registration_code: parsed.data.registrationCode,
    firm_name: parsed.data.firmName,
    firm_address: parsed.data.firmAddress,
    firm_phone: parsed.data.firmPhone,
    firm_email: parsed.data.firmEmail,
    full_name: parsed.data.name
  });

  if (rpcError) return { error: toUserError(rpcError) };

  redirect("/dashboard");
}

export async function signUpTeamMember(_: unknown, formData: FormData) {
  const parsed = teamSignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter code, name, designation, mobile, email, and an 8+ character password." };

  const supabase = createClient();
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
  if (!data.session) return { error: "Check your email to confirm the account, then sign in." };

  const { error: rpcError } = await supabase.rpc("create_team_member_profile", {
    p_registration_code: parsed.data.registrationCode,
    p_full_name: parsed.data.name,
    p_member_designation: parsed.data.designation,
    p_member_mobile: parsed.data.mobile
  });

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
