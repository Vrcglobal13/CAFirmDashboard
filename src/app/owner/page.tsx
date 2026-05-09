import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDashed,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Users
} from "lucide-react";
import { RegistrationCodeForm } from "@/components/owner/RegistrationCodeForm";
import { signOut } from "@/lib/actions/auth";
import { getOwnerDashboardData } from "@/lib/data";

export default async function OwnerDashboardPage() {
  const { firms, codes, user } = await getOwnerDashboardData();
  const issuedCodes = codes.length;
  const usedCodes = codes.filter((code) => code.used_at).length;
  const availableCodes = issuedCodes - usedCodes;
  const totalTasks = firms.reduce((sum, firm) => sum + Number(firm.tasks_count), 0);
  const totalClients = firms.reduce((sum, firm) => sum + Number(firm.clients_count), 0);
  const totalTeam = firms.reduce((sum, firm) => sum + Number(firm.team_count), 0);

  const metrics = [
    { label: "Registered firms", value: firms.length, icon: Building2 },
    { label: "Open codes", value: availableCodes, icon: KeyRound },
    { label: "Total tasks", value: totalTasks, icon: BriefcaseBusiness },
    { label: "Clients tracked", value: totalClients, icon: Users }
  ];

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

      <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-8">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="panel p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <span className="grid h-9 w-9 place-items-center rounded-md bg-muted text-primary">
                  <metric.icon size={18} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold">{metric.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <div className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Registered firms</h2>
                <p className="mt-1 text-sm text-muted-foreground">Tenant-level records and aggregate activity.</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="badge bg-white text-muted-foreground">{totalTeam} team members</span>
                <span className="badge bg-white text-muted-foreground">{usedCodes} codes used</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="border-b border-border bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Firm</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Registration</th>
                    <th className="px-5 py-3 text-right">Tasks</th>
                    <th className="px-5 py-3 text-right">Partners</th>
                    <th className="px-5 py-3 text-right">Clients</th>
                    <th className="px-5 py-3 text-right">Team</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {firms.map((firm) => (
                    <tr key={firm.firm_id} className="align-top transition hover:bg-muted/35">
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-white text-primary">
                            <Building2 size={17} />
                          </span>
                          <div>
                            <p className="font-semibold">{firm.firm_name}</p>
                            <p className="mt-1 flex max-w-[340px] items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                              <MapPin className="mt-0.5 shrink-0" size={13} />
                              <span>{firm.address ?? "Address not provided"}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-2">
                          <Phone size={14} className="text-muted-foreground" />
                          {firm.phone ?? "-"}
                        </p>
                        <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                          <Mail size={14} />
                          {firm.email ?? "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-mono text-sm font-semibold">{firm.registration_code ?? "-"}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-primary">
                          <BadgeCheck size={13} />
                          Active since {new Date(firm.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right text-base font-semibold">{firm.tasks_count}</td>
                      <td className="px-5 py-4 text-right text-base font-semibold">{firm.partners_count}</td>
                      <td className="px-5 py-4 text-right text-base font-semibold">{firm.clients_count}</td>
                      <td className="px-5 py-4 text-right text-base font-semibold">{firm.team_count}</td>
                    </tr>
                  ))}
                  {firms.length === 0 ? (
                    <tr>
                      <td className="px-5 py-12 text-center text-muted-foreground" colSpan={7}>
                        No firms have registered yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <RegistrationCodeForm />

            <div className="panel overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">Code inventory</h2>
                  <span className="badge bg-white text-muted-foreground">{issuedCodes} total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                <div className="p-5">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CircleDashed size={16} />
                    Available
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{availableCodes}</p>
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={16} />
                    Used
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{usedCodes}</p>
                </div>
              </div>
              <div className="max-h-[480px] divide-y divide-border overflow-y-auto">
                {codes.map((code) => (
                  <div key={code.code} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-sm font-semibold">{code.code}</span>
                      <span
                        className={`badge ${
                          code.used_at
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border bg-white text-muted-foreground"
                        }`}
                      >
                        {code.used_at ? "Used" : "Available"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{code.notes || "No note"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Created {new Date(code.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {codes.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No codes created.</p> : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
