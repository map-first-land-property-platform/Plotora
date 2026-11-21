"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MailCheck } from "lucide-react";
import type { z } from "zod";
import TextField from "./TextField";
import { RecoveryHeading } from "./RecoveryShell";
import { recoveryEmailSchema } from "../recovery-validation";
import { api, ApiError } from "@/lib/api";

type Values = z.infer<typeof recoveryEmailSchema>;

export default function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(recoveryEmailSchema), defaultValues: { email: "" },
  });

  async function onSubmit({ email }: Values) {
    setServerError(null);
    try {
      await api("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      reset();
      setSentTo(email);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "We couldn't connect. Please try again in a moment.");
    }
  }

  if (sentTo) return (
    <section aria-labelledby="recovery-email-title">
      <span className="recovery-state-icon"><MailCheck size={28} aria-hidden="true" /></span>
      <h1 id="recovery-email-title" tabIndex={-1} ref={(node) => node?.focus()}>Check your email</h1>
      <p className="recovery-subtitle">If an eligible account exists for <strong>{sentTo}</strong>, a password-reset link will arrive shortly. The link expires 30 minutes after it is created.</p>
      <p className="recovery-help">Check your spam folder too. If you requested several links, use the most recent one. You can request another after a minute; delivery may take a little longer.</p>
      <button className="recovery-text-button" type="button" onClick={() => { reset(); setSentTo(null); }}>Use a different email</button>
    </section>
  );

  return (
    <>
      <RecoveryHeading title="Forgot your password?">Enter the email linked to your account and we&apos;ll send a reset link.</RecoveryHeading>
      <form className="recovery-form" noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(onSubmit)}>
        {serverError && <p className="recovery-error" role="alert">{serverError}</p>}
        <TextField label="Email address" required type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" icon={<Mail className="ic" size={18} aria-hidden="true" />} error={errors.email?.message} {...register("email")} />
        <button className="recovery-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send reset link"}</button>
      </form>
    </>
  );
}
