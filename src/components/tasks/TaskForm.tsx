"use client";

import { useFormState } from "react-dom";
import { createTask } from "@/lib/actions/tasks";
import type { Client, Profile } from "@/lib/types";
import { SubmitButton } from "@/components/SubmitButton";

const initialState = { error: "" };

export function TaskForm({
  clients,
  members,
  canCreate
}: {
  clients: Client[];
  members: Profile[];
  canCreate: boolean;
}) {
  const [state, action] = useFormState(createTask, initialState);

  if (!canCreate) {
    return (
      <div className="panel p-5">
        <h2 className="font-semibold">Task creation</h2>
        <p className="mt-2 text-sm text-muted-foreground">Only firm admins and partners can create and assign tasks.</p>
      </div>
    );
  }

  return (
    <form action={action} className="panel space-y-4 p-5">
      <div>
        <h2 className="font-semibold">Create task</h2>
        <p className="mt-1 text-sm text-muted-foreground">Assign one doer and one verifier from your firm.</p>
      </div>
      <label className="block text-sm font-medium">
        Client
        <select name="client_id" className="field mt-1" required>
          <option value="">Select client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.client_name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        Title
        <input name="title" className="field mt-1" placeholder="GST reconciliation for April" required />
      </label>
      <label className="block text-sm font-medium">
        Description
        <textarea name="description" className="field mt-1 min-h-24" placeholder="Scope, documents, and review notes" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Doer
          <select name="doer_id" className="field mt-1" required>
            <option value="">Select doer</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Verifier
          <select name="verifier_id" className="field mt-1" required>
            <option value="">Select verifier</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Priority
          <select name="priority" className="field mt-1" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Deadline
          <input name="deadline" type="date" className="field mt-1" />
        </label>
      </div>
      {state?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <SubmitButton>Create task</SubmitButton>
    </form>
  );
}
