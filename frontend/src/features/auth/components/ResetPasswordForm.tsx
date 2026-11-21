"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, Circle, Link as LinkIcon } from "lucide-react";
import type { z } from "zod";
import PasswordInput from "./PasswordInput";
import PasswordStrength from "./PasswordStrength";
import { RecoveryHeading, RecoveryPreviewNotice } from "./RecoveryShell";
import { recoveryPasswordRules, recoveryPasswordSchema } from "../recovery-validation";

type Values = z.infer<typeof recoveryPasswordSchema>;

export default function ResetPasswordForm() {
  const params = useSearchParams();
  // Presence only: link authenticity and expiry must be checked by the future backend integration.
  const hasLink = Boolean(params.get("token")?.trim()) || params.get("preview") === "1";
  const [done, setDone] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(recoveryPasswordSchema), defaultValues: { password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  if (!hasLink) return (
    <>
      <span className="recovery-state-icon"><LinkIcon size={26} aria-hidden="true" /></span>
      <RecoveryHeading title="Reset link not valid">This link is missing its recovery token. Request a new link to continue.</RecoveryHeading>
      <Link className="recovery-primary" href="/forgot-password">Request a new link</Link>
      <RecoveryPreviewNotice />
    </>
  );

  if (done) return (
    <section aria-labelledby="recovery-done-title">
      <span className="recovery-state-icon"><CheckCircle2 size={28} aria-hidden="true" /></span>
      <h1 id="recovery-done-title" tabIndex={-1} ref={(node) => node?.focus()}>Reset preview complete</h1>
      <p className="recovery-subtitle">Your new password meets the form requirements. No password was changed or saved.</p>
      <RecoveryPreviewNotice />
      <Link className="recovery-primary" href="/login">Go to sign in</Link>
    </section>
  );

  return (
    <>
      <RecoveryHeading title="Set a new password">Choose a strong password you don&apos;t use elsewhere.</RecoveryHeading>
      <RecoveryPreviewNotice />
      <form className="recovery-form" noValidate onSubmit={handleSubmit(() => { reset(); setDone(true); })}>
        <div>
          <PasswordInput label="New password" required autoComplete="new-password" maxLength={100} error={errors.password?.message} aria-describedby="recovery-password-rules" {...register("password")} />
          <PasswordStrength password={password} />
        </div>
        <PasswordInput label="Confirm new password" required autoComplete="new-password" maxLength={100} error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <ul className="recovery-rules" id="recovery-password-rules" aria-label="Password requirements">
          {recoveryPasswordRules.map((rule) => {
            const met = password.length > 0 && rule.test(password);
            const Icon = met ? Check : Circle;
            return <li key={rule.label} data-met={met}><Icon size={14} aria-hidden="true" /><span className="sr-only">{met ? "Met: " : "Required: "}</span>{rule.label}</li>;
          })}
        </ul>
        <button className="recovery-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Checking…" : "Update password"}</button>
      </form>
    </>
  );
}
