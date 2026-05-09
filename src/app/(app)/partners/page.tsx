import { redirect } from "next/navigation";
import { BriefcaseBusiness, CheckCircle2, UserRoundCog } from "lucide-react";
import { getTeamPageData } from "@/lib/data";

export default async function PartnersPage() {
  const { profile, members, tasks } = await getTeamPageData();
  if (profile.role !== "admin") redirect("/dashboard");

  const partners = members.filter((member) => member.role === "partner");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Partners</h1>
        <p className="mt-1 text-sm text-muted-foreground">Partner-level workload and verification activity.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <UserRoundCog className="text-primary" size={20} />
          <p className="mt-4 text-3xl font-semibold">{partners.length}</p>
          <p className="text-sm text-muted-foreground">Partners</p>
        </div>
        <div className="panel p-5">
          <BriefcaseBusiness className="text-primary" size={20} />
          <p className="mt-4 text-3xl font-semibold">{tasks.filter((task) => partners.some((partner) => partner.id === task.created_by)).length}</p>
          <p className="text-sm text-muted-foreground">Tasks created</p>
        </div>
        <div className="panel p-5">
          <CheckCircle2 className="text-primary" size={20} />
          <p className="mt-4 text-3xl font-semibold">{tasks.filter((task) => task.status === "verified").length}</p>
          <p className="text-sm text-muted-foreground">Verified tasks</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {partners.map((partner) => (
          <div key={partner.id} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{partner.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{partner.designation ?? "Partner"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Partner since {new Date(partner.created_at).toLocaleDateString()}</p>
              </div>
              <span className="badge capitalize">{partner.role}</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xl font-semibold">{tasks.filter((task) => task.created_by === partner.id).length}</p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{tasks.filter((task) => task.doer_id === partner.id).length}</p>
                <p className="text-xs text-muted-foreground">Doing</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{tasks.filter((task) => task.verifier_id === partner.id).length}</p>
                <p className="text-xs text-muted-foreground">Verify</p>
              </div>
            </div>
          </div>
        ))}
        {!partners.length ? <p className="panel p-5 text-sm text-muted-foreground">No partners added yet.</p> : null}
      </div>
    </div>
  );
}
