"use client";

import { KeyRound, StickyNote } from "lucide-react";
import { useFormState } from "react-dom";
import { createRegistrationCode } from "@/lib/actions/owner";
import { SubmitButton } from "@/components/SubmitButton";

const initialState = { error: "" };

export function RegistrationCodeForm() {
  const [state, action] = useFormState(createRegistrationCode, initialState);

  return (
    <form action={action} className="panel overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">Issue registration code</h2>
        <p className="mt-1 text-sm text-muted-foreground">Only firms with an unused code can create a workspace.</p>
      </div>
      <div className="space-y-4 p-5">
        <label className="block text-sm font-medium">
          Registration code
          <span className="relative mt-1 block">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              name="registrationCode"
              className="field pl-9 font-mono"
              inputMode="numeric"
              maxLength={10}
              pattern="\d{10}"
              placeholder="1234567890"
              required
            />
          </span>
        </label>
        <label className="block text-sm font-medium">
          Internal note
          <span className="relative mt-1 block">
            <StickyNote className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input name="notes" className="field pl-9" placeholder="Issued to Rao & Mehta" />
          </span>
        </label>
        {state?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
        <SubmitButton>Create code</SubmitButton>
      </div>
    </form>
  );
}
