import { AppShell } from "@/components/layout/AppShell";
import { getSessionContext } from "@/lib/data";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile, firm } = await getSessionContext();
  return (
    <AppShell profile={profile} firm={firm}>
      {children}
    </AppShell>
  );
}
