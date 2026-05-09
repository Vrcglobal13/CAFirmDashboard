"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { signIn, sendRegistrationOtp, verifyAndRegister } from "@/lib/actions/auth";
import { SubmitButton } from "./SubmitButton";

type OtpState = { error?: string; success?: boolean; email?: string; formData?: FormData };
const initialOtpState: OtpState = { error: "", success: false, email: "" };
const loginInitialState = { error: "" };

export function LoginForms({ nextPath = "" }: { nextPath?: string }) {
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [registerRole, setRegisterRole] = useState<"new_firm" | "team_member" | "partner">("new_firm");
  const [otpSent, setOtpSent] = useState(false);

  const [loginState, loginAction] = useFormState(signIn, loginInitialState);

  // Custom action for OTP send
  const handleSendOtp = async (state: OtpState, formData: FormData): Promise<OtpState> => {
    formData.append("role", registerRole);
    const result = await sendRegistrationOtp(state, formData);
    if (result.success) {
      setOtpSent(true);
    }
    return result;
  };

  const [otpState, otpAction] = useFormState(handleSendOtp, initialOtpState);

  // Custom action for verify
  const handleVerify = async (state: OtpState, formData: FormData): Promise<OtpState> => {
    formData.append("role", registerRole);
    if (otpState.email) {
       formData.append("email", otpState.email);
    }
    return verifyAndRegister(state, formData);
  };

  const [verifyState, verifyAction] = useFormState(handleVerify, initialOtpState);

  const isSignin = mode === "signin";

  return (
    <div className="panel w-full max-w-md p-6">
      <div>
        <h1 className="text-2xl font-semibold">CA Firm OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSignin ? "Sign in to your firm workspace." : "Create your account."}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setOtpSent(false);
          }}
          className={`rounded px-3 py-2 text-sm font-medium ${mode === "signin" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded px-3 py-2 text-sm font-medium ${mode === "register" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
        >
          Register
        </button>
      </div>

      {isSignin ? (
        <form action={loginAction} className="mt-6 space-y-4">
          {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
          <label className="block text-sm font-medium">
            Email
            <input name="email" type="email" className="field mt-1" placeholder="owner@firm.com" required />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input name="password" type="password" className="field mt-1" minLength={8} required />
          </label>
          {loginState?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{loginState.error}</p> : null}
          <SubmitButton>Sign in</SubmitButton>
        </form>
      ) : (
        <form action={otpSent ? verifyAction : otpAction} className="mt-6 space-y-4">
          {!otpSent && (
            <>
              <label className="block text-sm font-medium">
                Register as
                <select
                  className="field mt-1"
                  value={registerRole}
                  onChange={(e) => setRegisterRole(e.target.value as any)}
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

              {registerRole === "new_firm" && (
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

              {registerRole === "team_member" && (
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

              {registerRole === "partner" && (
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
                Email
                <input name="email" type="email" className="field mt-1" placeholder="your@email.com" required />
              </label>

              <label className="block text-sm font-medium">
                Password
                <input name="password" type="password" className="field mt-1" minLength={8} required />
              </label>

              {otpState?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{otpState.error}</p> : null}
              <SubmitButton>Send OTP</SubmitButton>
            </>
          )}

          {otpSent && (
            <>
              {/* Carry over the form data */}
              <input type="hidden" name="registrationCode" value={otpState.formData?.get("registrationCode") as string} />
              <input type="hidden" name="email" value={otpState.formData?.get("email") as string} />
              <input type="hidden" name="password" value={otpState.formData?.get("password") as string} />
              <input type="hidden" name="name" value={otpState.formData?.get("name") as string || ""} />

              {registerRole === "new_firm" && (
                <>
                  <input type="hidden" name="firmName" value={otpState.formData?.get("firmName") as string} />
                  <input type="hidden" name="firmAddress" value={otpState.formData?.get("firmAddress") as string} />
                  <input type="hidden" name="firmPhone" value={otpState.formData?.get("firmPhone") as string} />
                  <input type="hidden" name="firmEmail" value={otpState.formData?.get("firmEmail") as string} />
                </>
              )}
              {registerRole === "team_member" && (
                <>
                  <input type="hidden" name="designation" value={otpState.formData?.get("designation") as string} />
                  <input type="hidden" name="mobile" value={otpState.formData?.get("mobile") as string} />
                </>
              )}
              {registerRole === "partner" && (
                <input type="hidden" name="mobile" value={otpState.formData?.get("mobile") as string} />
              )}

              <p className="text-sm text-green-700 font-medium">An OTP has been sent to your email.</p>

              <label className="block text-sm font-medium">
                Enter OTP
                <input name="otp" type="text" className="field mt-1" placeholder="123456" required />
              </label>

              {verifyState?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{verifyState.error}</p> : null}
              <SubmitButton>Verify & Register</SubmitButton>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-sm text-center text-muted-foreground mt-2"
              >
                Back to details
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
