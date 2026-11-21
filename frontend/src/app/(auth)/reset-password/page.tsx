import type { Metadata } from "next";
import { Suspense } from "react";
import RecoveryShell from "@/features/auth/components/RecoveryShell";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password | Plotora",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ResetPasswordPage() {
  return <RecoveryShell><Suspense fallback={<p role="status">Loading recovery form…</p>}><ResetPasswordForm /></Suspense></RecoveryShell>;
}
