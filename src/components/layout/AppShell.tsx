import Link from "next/link";
import { BriefcaseBusiness, Building2, CalendarCheck, LayoutDashboard, LogOut, PieChart, ShieldCheck, UserRoundCog, Users } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import type { Firm, Profile } from "@/lib/types";
import { RealtimeProvider } from "./RealtimeProvider";

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: BriefcaseBusiness },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/reports", label: "Reports", icon: PieChart }
];

const adminNavItems = [
  { href: "/team", label: "Team", icon: Users },
  { href: "/partners", label: "Partners", icon: UserRoundCog }
];

export function AppShell({
  children,
  profile,
  firm
}: {
  children: React.ReactNode;
  profile: Profile;
  firm: Firm | null;
}) {
  const navItems = profile.role === "admin" ? [...baseNavItems.slice(0, 3), ...adminNavItems, ...baseNavItems.slice(3)] : baseNavItems;

  return (
    <RealtimeProvider firmId={profile.firm_id} userId={profile.id} role={profile.role}>
      <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface p-5 lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck size={20} />
          </span>
          <span>
            <span className="block text-sm font-semibold">{firm?.name ?? "CA Firm OS"}</span>
            <span className="block text-xs text-muted-foreground">Secure firm workspace</span>
          </span>
        </Link>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{profile.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{profile.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <nav className="flex gap-1 lg:hidden">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="btn-secondary h-10 w-10 p-0" title={item.label}>
                    <item.icon size={17} />
                  </Link>
                ))}
              </nav>
              <form action={signOut}>
                <button className="btn-secondary" title="Sign out">
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
      </div>
    </RealtimeProvider>
  );
}
