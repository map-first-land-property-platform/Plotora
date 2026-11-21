"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CheckCircle2, Circle, Link as LinkIcon } from "lucide-react";
import type { z } from "zod";
import PasswordInput from "./PasswordInput";
import PasswordStrength from "./PasswordStrength";
import { RecoveryHeading } from "./RecoveryShell";
import { recoveryPasswordRules, recoveryPasswordSchema } from "../recovery-validation";
import { api, ApiError } from "@/lib/api";

function subscribeToLink(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  return () => { window.removeEventListener("hashchange", onChange); window.removeEventListener("popstate", onChange); };
}
const readFragment = () => window.location.hash;
const serverFragment = () => null;

type Values = z.infer<typeof recoveryPasswordSchema>;

export default function ResetPasswordForm() {
  const params = useSearchParams();
  // New emails use fragments so tokens do not reach web-server access logs.
  // Query tokens remain supported for older recovery emails.
  const fragment = useSyncExternalStore(subscribeToLink, readFragment, serverFragment);
  const token = new URLSearchParams(fragment?.replace(/^#/, "") ?? "").get("token") ?? params.get("token") ?? "";
  const hasLink = /^[A-Za-z0-9_-]{43}$/.test(token);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(recoveryPasswordSchema), defaultValues: { password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password: values.password }) });
      reset();
      // Remove the used token from this history entry, keeping it only in memory until navigation.
      window.history.replaceState(window.history.state, "", window.location.pathname);
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && !Object.keys(error.fieldErrors).length
          && error.message.includes("reset link")) { setInvalidLink(true); reset(); }
      else setServerError(error instanceof ApiError ? error.message : "We couldn't connect. Please try again in a moment.");
    }
  }

  if (fragment === null) return <p role="status">Loading recovery form…</p>;

  if ((!hasLink || invalidLink) && !done) return (
    <>
      <span className="recovery-state-icon"><LinkIcon size={26} aria-hidden="true" /></span>
      <RecoveryHeading title="Reset link not valid">This link is invalid, has expired, or has already been used. Request a new link to continue.</RecoveryHeading>
      <Link className="recovery-primary" href="/forgot-password">Request a new link</Link>
    </>
  );

  if (done) return (
    <section aria-labelledby="recovery-done-title">
      <span className="recovery-state-icon"><CheckCircle2 size={28} aria-hidden="true" /></span>
      <h1 id="recovery-done-title" tabIndex={-1} ref={(node) => node?.focus()}>Password updated</h1>
      <p className="recovery-subtitle">Your password has been changed and previous sign-in sessions have been invalidated. Sign in with your new password.</p>
      <Link className="recovery-primary" href="/login">Go to sign in</Link>
    </section>
  );

  return (
    <>
      <RecoveryHeading title="Set a new password">Choose a strong password you don&apos;t use elsewhere.</RecoveryHeading>
      <form className="recovery-form" noValidate aria-busy={isSubmitting} onSubmit={handleSubmit(onSubmit)}>
        {serverError && <p className="recovery-error" role="alert">{serverError}</p>}
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
        <button className="recovery-primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating…" : "Update password"}</button>
      </form>
    </>
  );
}
