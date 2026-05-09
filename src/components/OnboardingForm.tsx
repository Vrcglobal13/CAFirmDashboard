"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { completeOnboarding } from "@/lib/actions/auth";
import { SubmitButton } from "./SubmitButton";

const initialState = { error: "" };

export function OnboardingForm() {
  const [role, setRole] = useState<"new_firm" | "team_member" | "partner">("new_firm");
  const [state, action] = useFormState(completeOnboarding, initialState);

  return (
    <form action={action} className="panel w-full max-w-md space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Complete your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Set a password and enter your details to continue.</p>
      </div>

      <label className="block text-sm font-medium">
        Register as
        <select
          name="role"
          className="field mt-1"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="new_firm">New Firm</option>
          <option value="team_member">Team Member</option>
          <option value="partner">Partner</option>
        </select>
      </label>

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

      {role === "new_firm" && (
        <>
          <label className="block text-sm font-medium">
            Organisation Name
            <input name="firmName" className="field mt-1" placeholder="Rao & Mehta Associates" required />
          </label>
          <label className="block text-sm font-medium">
            Address
            <textarea name="firmAddress" className="field mt-1 min-h-20" placeholder="Office address" required />
          </label>
          <label className="block text-sm font-medium">
            Mobile
            <input name="firmPhone" className="field mt-1" placeholder="+91 98765 43210" required />
          </label>
          <label className="block text-sm font-medium">
            Mail
            <input name="firmEmail" type="email" className="field mt-1" placeholder="firm@gmail.com" required />
          </label>
          <label className="block text-sm font-medium">
            Owner Name
            <input name="name" className="field mt-1" placeholder="Ananya Rao" required />
          </label>
        </>
      )}

      {role === "team_member" && (
        <>
          <label className="block text-sm font-medium">
            Name
            <input name="name" className="field mt-1" placeholder="Rahul Sharma" required />
          </label>
          <label className="block text-sm font-medium">
            Designation
            <input name="designation" className="field mt-1" placeholder="Article Assistant" required />
          </label>
          <label className="block text-sm font-medium">
            Mobile number
            <input name="mobile" className="field mt-1" placeholder="+91 98765 43210" required />
          </label>
        </>
      )}

      {role === "partner" && (
        <>
          <label className="block text-sm font-medium">
            Name
            <input name="name" className="field mt-1" placeholder="Priya Patel" required />
          </label>
          <label className="block text-sm font-medium">
            Mobile
            <input name="mobile" className="field mt-1" placeholder="+91 98765 43210" required />
          </label>
        </>
      )}

      <label className="block text-sm font-medium">
        Set a Password
        <input name="password" type="password" className="field mt-1" minLength={8} placeholder="8+ characters" required />
      </label>

      {state?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
      <SubmitButton>Complete Setup</SubmitButton>
    </form>
  );
}
