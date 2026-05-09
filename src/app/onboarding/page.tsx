import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/OnboardingForm";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
  if (profile) redirect("/dashboard");

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <OnboardingForm />
    </main>
  );
}
