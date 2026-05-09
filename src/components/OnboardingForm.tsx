"use client";

import { useFormState } from "react-dom";
import { createFirmAdmin } from "@/lib/actions/auth";
import { SubmitButton } from "./SubmitButton";

const initialState = { error: "" };

export function OnboardingForm() {
  const [state, action] = useFormState(createFirmAdmin, initialState);

  return (
    <form action={action} className="panel w-full max-w-md space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Set up your firm</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the owner-issued code and firm details.</p>
      </div>
      <label className="block text-sm font-medium">
        10-digit registration code
        <input
          name="registrationCode"
          className="field mt-1"
          inputMode="numeric"
          maxLength={10}
          pattern="\d{10}"
          placeholder="1234567890"
          required
        />
      </label>
      <label className="block text-sm font-medium">
        Firm name
        <input name="firmName" className="field mt-1" placeholder="Rao & Mehta Associates" required />
      </label>
      <label className="block text-sm font-medium">
        Firm address
        <textarea name="firmAddress" className="field mt-1 min-h-20" placeholder="Office address" required />
      </label>
      <label className="block text-sm font-medium">
        Firm contact number
        <input name="firmPhone" className="field mt-1" placeholder="+91 98765 43210" required />
      </label>
      <label className="block text-sm font-medium">
        Firm Gmail
        <input name="firmEmail" type="email" className="field mt-1" placeholder="firm@gmail.com" required />
      </label>
      <label className="block text-sm font-medium">
        Owner name
        <input name="name" className="field mt-1" placeholder="Ananya Rao" required />
      </label>
      {state?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <SubmitButton>Create workspace</SubmitButton>
    </form>
  );
}
