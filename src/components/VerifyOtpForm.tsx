"use client";

import { useState, useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { verifyOtpAction, sendOtpAction, setNewPasswordAction } from "@/lib/actions/auth";
import { SubmitButton } from "./SubmitButton";

const initialVerifyState: any = { error: "", success: false, type: "" };

export function VerifyOtpForm({ email, type }: { email: string; type: "email" | "recovery" }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [otpSentMessage, setOtpSentMessage] = useState("");
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verified, setVerified] = useState(false);

  const handleVerify = async (state: any, formData: FormData) => {
    formData.append("email", email);
    formData.append("type", type);
    formData.append("otp", otpInputs.join(""));
    const result = await verifyOtpAction(state, formData);

    if (result.success) {
      if (result.type === "recovery") {
        setVerified(true);
      } else {
        router.push("/onboarding");
      }
    }
    return result;
  };

  const [verifyState, verifyAction] = useFormState(handleVerify, initialVerifyState);

  const handleSetPassword = async (state: any, formData: FormData) => {
    return setNewPasswordAction(state, formData);
  };
  const [passwordState, passwordAction] = useFormState(handleSetPassword, { error: "" });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setOtpSentMessage("");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("type", type);

    const result = await sendOtpAction({}, formData);
    if (result.success) {
      setCountdown(60);
      setOtpSentMessage("OTP resent successfully.");
    } else {
      setOtpSentMessage(result.error || "Failed to resend OTP.");
    }
    setIsResending(false);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpInputs];
    newOtp[index] = value.slice(-1);
    setOtpInputs(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpInputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (verified && type === "recovery") {
    return (
      <div className="panel w-full max-w-md p-6">
        <div>
          <h1 className="text-2xl font-semibold">Set New Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Please enter your new password below.</p>
        </div>
        <form action={passwordAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            New Password
            <input name="password" type="password" className="field mt-1" minLength={8} required />
          </label>
          {passwordState?.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{passwordState.error}</p> : null}
          <SubmitButton>Update Password</SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <div className="panel w-full max-w-md p-6">
      <div>
        <h1 className="text-2xl font-semibold">Verify OTP</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the 6-digit code sent to <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <form action={verifyAction} className="mt-6 space-y-6">
        <div className="flex justify-between gap-2">
          {otpInputs.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              className="field h-12 w-12 text-center text-lg font-semibold"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              required
            />
          ))}
        </div>

        {verifyState?.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{verifyState.error}</p>
        ) : null}

        {otpSentMessage ? (
           <p className={`rounded-md px-3 py-2 text-sm ${otpSentMessage.includes("Failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
             {otpSentMessage}
           </p>
        ) : null}

        <SubmitButton>Verify Code</SubmitButton>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className={`font-medium ${countdown > 0 ? "text-muted-foreground" : "text-blue-600 hover:underline"}`}
          >
            {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
          </button>
        </div>
      </form>
    </div>
  );
}
