"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { signIn, signUp, signUpTeamMember } from "@/lib/actions/auth";
import { SubmitButton } from "./SubmitButton";

const initialState = { error: "" };

export function LoginForms({ nextPath = "" }: { nextPath?: string }) {
  const [mode, setMode] = useState<"signin" | "signup" | "team">("signin");
  const [loginState, loginAction] = useFormState(signIn, initialState);
  const [signupState, signupAction] = useFormState(signUp, initialState);
  const [teamState, teamAction] = useFormState(signUpTeamMember, initialState);
  const state = mode === "signin" ? loginState : mode === "signup" ? signupState : teamState;
  const action = mode === "signin" ? loginAction : mode === "signup" ? signupAction : teamAction;

  return (
    <div className="panel w-full max-w-md p-6">
      <div>
        <h1 className="text-2xl font-semibold">CA Firm OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your firm workspace.</p>
      </div>
      <div className="mt-6 grid grid-cols-3 rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`rounded px-3 py-2 text-sm font-medium ${mode === "signin" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`rounded px-3 py-2 text-sm font-medium ${mode === "signup" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
        >
          New firm
        </button>
        <button
          type="button"
          onClick={() => setMode("team")}
          className={`rounded px-3 py-2 text-sm font-medium ${mode === "team" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
        >
          Team
        </button>
      </div>
      <form action={action} className="mt-6 space-y-4">
        {mode === "signin" && nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        {mode === "signup" || mode === "team" ? (
          <>
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
          </>
        ) : null}
        {mode === "signup" ? (
          <>
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
          </>
        ) : null}
        {mode === "team" ? (
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
        ) : null}
        <label className="block text-sm font-medium">
          Email
          <input name="email" type="email" className="field mt-1" placeholder="owner@firm.com" required />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input name="password" type="password" className="field mt-1" minLength={8} required />
        </label>
        {state?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p> : null}
        <SubmitButton>{mode === "signin" ? "Sign in" : mode === "signup" ? "Create firm" : "Register team member"}</SubmitButton>
      </form>
    </div>
  );
}
