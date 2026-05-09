import { redirect } from "next/navigation";
import { Mail, ShieldCheck, UserRoundCog, Users } from "lucide-react";
import { getTeamPageData } from "@/lib/data";

export default async function TeamPage() {
  const { profile, members, tasks } = await getTeamPageData();
  if (profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="mt-1 text-sm text-muted-foreground">Firm members, roles, and task involvement.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <Users className="text-primary" size={20} />
          <p className="mt-4 text-3xl font-semibold">{members.length}</p>
          <p className="text-sm text-muted-foreground">Total team</p>
        </div>
        <div className="panel p-5">
          <UserRoundCog className="text-primary" size={20} />
          <p className="mt-4 text-3xl font-semibold">{members.filter((member) => member.role === "partner").length}</p>
          <p className="text-sm text-muted-foreground">Partners</p>
        </div>
        <div className="panel p-5">
          <ShieldCheck className="text-primary" size={20} />
          <p className="mt-4 text-3xl font-semibold">{members.filter((member) => member.role === "admin").length}</p>
          <p className="text-sm text-muted-foreground">Admins</p>
        </div>
      </section>

      <div className="panel overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="font-semibold">Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3 text-right">Created</th>
                <th className="px-5 py-3 text-right">Assigned</th>
                <th className="px-5 py-3 text-right">Verifying</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium">{member.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{member.designation ?? "No designation"}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail size={13} />
                      {member.mobile ?? `Profile ID: ${member.id.slice(0, 8)}`}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="badge capitalize">{member.role}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-medium">{tasks.filter((task) => task.created_by === member.id).length}</td>
                  <td className="px-5 py-4 text-right font-medium">{tasks.filter((task) => task.doer_id === member.id).length}</td>
                  <td className="px-5 py-4 text-right font-medium">{tasks.filter((task) => task.verifier_id === member.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
