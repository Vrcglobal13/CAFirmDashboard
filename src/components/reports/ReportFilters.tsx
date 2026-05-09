import type { Client } from "@/lib/types";

export function ReportFilters({
  clients,
  defaultValues
}: {
  clients: Client[];
  defaultValues: { clientId?: string; status?: string; dateFrom?: string; dateTo?: string };
}) {
  return (
    <form className="panel grid gap-4 p-5 md:grid-cols-5">
      <label className="block text-sm font-medium">
        Client
        <select name="clientId" className="field mt-1" defaultValue={defaultValues.clientId ?? ""}>
          <option value="">All clients</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.client_name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Status
        <select name="status" className="field mt-1" defaultValue={defaultValues.status ?? ""}>
          <option value="">All statuses</option>
          <option value="created">Created</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="verified">Verified</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        From
        <input name="dateFrom" type="date" className="field mt-1" defaultValue={defaultValues.dateFrom ?? ""} />
      </label>
      <label className="block text-sm font-medium">
        To
        <input name="dateTo" type="date" className="field mt-1" defaultValue={defaultValues.dateTo ?? ""} />
      </label>
      <div className="flex items-end">
        <button className="btn-primary w-full">Apply</button>
      </div>
    </form>
  );
}
