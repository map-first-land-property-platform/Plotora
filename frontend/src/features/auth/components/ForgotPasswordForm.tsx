"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MailCheck } from "lucide-react";
import type { z } from "zod";
import TextField from "./TextField";
import { RecoveryHeading, RecoveryPreviewNotice } from "./RecoveryShell";
import { recoveryEmailSchema } from "../recovery-validation";

type Values = z.infer<typeof recoveryEmailSchema>;

export default function ForgotPasswordForm() {
  const [previewEmail, setPreviewEmail] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(recoveryEmailSchema), defaultValues: { email: "" },
  });

  if (previewEmail) return (
    <section aria-labelledby="recovery-email-title">
      <span className="recovery-state-icon"><MailCheck size={28} aria-hidden="true" /></span>
      <h1 id="recovery-email-title" tabIndex={-1} ref={(node) => node?.focus()}>Check your email</h1>
      <p className="recovery-subtitle">Once recovery is connected, an eligible account for <strong>{previewEmail}</strong> will receive a password-reset link.</p>
      <RecoveryPreviewNotice />
      <p className="recovery-help">No email was sent in this preview. The finished flow will show the same confirmation whether or not an account exists.</p>
      <Link className="recovery-primary" href="/reset-password?preview=1">Preview the reset page</Link>
      <button className="recovery-text-button" type="button" onClick={() => { reset(); setPreviewEmail(null); }}>Use a different email</button>
    </section>
  );

  return (
    <>
      <RecoveryHeading title="Forgot your password?">Enter the email linked to your account and we&apos;ll help you reset your password.</RecoveryHeading>
      <RecoveryPreviewNotice />
      <form className="recovery-form" noValidate onSubmit={handleSubmit(({ email }) => setPreviewEmail(email))}>
        <TextField label="Email address" required type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" icon={<Mail className="ic" size={18} aria-hidden="true" />} error={errors.email?.message} {...register("email")} />
        <button className="recovery-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Continuing…" : "Send reset link"}</button>
      </form>
    </>
  );
}
