import { ShieldCheck, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { getOwnerDashboardData } from "@/lib/data";
import { OwnerDashboardClient } from "@/components/owner/OwnerDashboardClient";

export default async function OwnerDashboardPage() {
  const { firms, codes, user } = await getOwnerDashboardData();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck size={21} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">CA Firm OS</p>
              <h1 className="text-xl font-semibold">SaaS owner console</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-md border border-border bg-background px-3 py-2 text-right sm:block">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="max-w-64 truncate text-sm font-medium">{user.email}</p>
            </div>
            <form action={signOut}>
              <button className="btn-secondary" title="Sign out">
                <LogOut size={16} />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <OwnerDashboardClient firms={firms} codes={codes} />
    </main>
  );
}
