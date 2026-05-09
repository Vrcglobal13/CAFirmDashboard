import { Building2 } from "lucide-react";
import { ClientForm } from "@/components/tasks/ClientForm";
import { getClientsPageData } from "@/lib/data";

export default async function ClientsPage() {
  const { profile, clients } = await getClientsPageData();
  const canCreate = ["admin", "partner"].includes(profile.role);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">Maintain the client list used while creating firm tasks.</p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <ClientForm canCreate={canCreate} />
        <div className="panel overflow-hidden">
          <div className="border-b border-border p-5">
            <h2 className="font-semibold">Client directory</h2>
            <p className="mt-1 text-sm text-muted-foreground">{clients.length} clients in this firm.</p>
          </div>
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md border border-border bg-white text-primary">
                    <Building2 size={18} />
                  </span>
                  <div>
                    <p className="font-medium">{client.client_name}</p>
                    <p className="text-xs text-muted-foreground">Added {new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
            {!clients.length ? <p className="p-5 text-sm text-muted-foreground">No clients added yet.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
