"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, Smartphone } from "lucide-react";
import AuthShell from "./AuthShell";
import OtpInput from "./OtpInput";
import { emptyOtp, isCompleteOtp, OTP_LENGTH } from "../otp";
import "./phone-verification.css";

const RESEND_SECONDS = 30;

export default function VerifyPhoneView() {
  const [digits, setDigits] = useState(emptyOtp);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [error, setError] = useState<string>();
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  function resend() {
    setDigits(emptyOtp()); setError(undefined); setSeconds(RESEND_SECONDS);
    setFeedback("Resend preview restarted. No text message was sent.");
  }

  return (
    <AuthShell
      variant="phone"
      promoHeading="Stay connected. Keep exploring."
      promoCopy="Your next property journey starts with the right details. Take a moment to confirm your mobile number."
    >
      <div className="phone-card">
        <Image className="phone-logo brand-logo-image" src="/assets/images/plotora-logo-transparent.png" alt="Plotora" width={240} height={65} priority />
        <span className="phone-guard"><Smartphone size={30} strokeWidth={1.5} aria-hidden="true" /></span>
        <h1>Verify your phone</h1>
        <p className="phone-subtitle">Enter the {OTP_LENGTH}-digit code for your mobile number.</p>
        <form className="phone-form" noValidate onSubmit={(event) => {
          event.preventDefault();
          if (!isCompleteOtp(digits)) { setError("Enter all six digits to continue."); return; }
          setError(undefined);
          setFeedback("Code entry complete. This preview does not verify a phone number.");
        }}>
          <OtpInput value={digits} error={error} onChange={(next) => { setDigits(next); setError(undefined); setFeedback(""); }} />
          <button type="submit" className="phone-primary" disabled={!isCompleteOtp(digits)}>Verify</button>
        </form>
        <p className="phone-resend">Didn&apos;t get a code? <button type="button" onClick={resend} disabled={seconds > 0}>{seconds > 0 ? `Resend (${seconds}s)` : "Resend"}</button></p>
        <div className="phone-feedback" role="status" aria-live="polite">{feedback}</div>
        <div className="phone-preview"><Info size={18} aria-hidden="true" /><div><strong>Frontend preview</strong><p>SMS delivery is not connected yet. Try entering six digits to preview this screen. Your phone number will not be marked as verified.</p></div></div>
        <Link className="phone-back" href="/login">Back to sign in</Link>
      </div>
    </AuthShell>
  );
}
