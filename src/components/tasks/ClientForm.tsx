"use client";

import { useFormState } from "react-dom";
import { Building2 } from "lucide-react";
import { createClientRecord } from "@/lib/actions/clients";
import { SubmitButton } from "@/components/SubmitButton";

const initialState = { error: "" };

export function ClientForm({ canCreate }: { canCreate: boolean }) {
  const [state, action] = useFormState(createClientRecord, initialState);

  if (!canCreate) return null;

  return (
    <form action={action} className="panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Add client</h2>
          <p className="mt-1 text-sm text-muted-foreground">Clients are isolated to your firm.</p>
        </div>
        <Building2 className="text-primary" size={20} />
      </div>
      <label className="block text-sm font-medium">
        Client name
        <input name="client_name" className="field mt-1" placeholder="Acme Exports Pvt Ltd" required />
      </label>
      {state?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <SubmitButton>Add client</SubmitButton>
    </form>
  );
}
