import { VerifyOtpForm } from "@/components/VerifyOtpForm";

export default function VerifyOtpPage({ searchParams }: { searchParams: { email?: string; type?: string } }) {
  const email = searchParams.email || "";
  const type = searchParams.type || "email";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <VerifyOtpForm email={email} type={type as "email" | "recovery"} />
    </main>
  );
}
