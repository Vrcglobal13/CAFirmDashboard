"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { signIn, sendOtpAction } from "@/lib/actions/auth";
import { SubmitButton } from "./SubmitButton";

type Mode = "signin" | "register" | "forgot_password";
const initialLoginState = { error: "" };
const initialOtpState: any = { error: "", success: false, email: "", type: "" };

export function LoginForms({ nextPath = "" }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");

  const [loginState, loginAction] = useFormState(signIn, initialLoginState);

  const handleSendOtp = async (state: any, formData: FormData) => {
    formData.append("type", mode === "forgot_password" ? "recovery" : "email");
    const result = await sendOtpAction(state, formData);
    if (result.success) {
      router.push(`/verify-otp?email=${encodeURIComponent(result.email)}&type=${result.type}`);
    }
    return result;
  };

  const [otpState, otpAction] = useFormState(handleSendOtp, initialOtpState);

  return (
    <div className="panel w-full max-w-md p-6">
      <div>
        <h1 className="text-2xl font-semibold">CA Firm OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" && "Sign in to your firm workspace."}
          {mode === "register" && "Create your account via email OTP."}
          {mode === "forgot_password" && "Reset your password via email OTP."}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 rounded-md bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
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

      {mode === "signin" ? (
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

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setMode("forgot_password")}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {loginState?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{loginState.error}</p> : null}
          <SubmitButton>Sign in</SubmitButton>
        </form>
      ) : (
        <form action={otpAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input name="email" type="email" className="field mt-1" placeholder="your@email.com" required />
          </label>

          {otpState?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{otpState.error}</p> : null}

          <SubmitButton>Send OTP</SubmitButton>

          {mode === "forgot_password" && (
             <button
                type="button"
                onClick={() => setMode("signin")}
                className="w-full text-sm text-center text-muted-foreground mt-4 hover:underline"
             >
                Back to Login
             </button>
          )}
        </form>
      )}
    </div>
  );
}
