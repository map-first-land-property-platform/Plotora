import type { Metadata } from "next";
import RecoveryShell from "@/features/auth/components/RecoveryShell";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | Plotora",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function ForgotPasswordPage() {
  return <RecoveryShell><ForgotPasswordForm /></RecoveryShell>;
}
