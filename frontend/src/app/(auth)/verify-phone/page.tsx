import type { Metadata } from "next";
import VerifyPhoneView from "@/features/auth/components/VerifyPhoneView";

export const metadata: Metadata = {
  title: "Verify your phone | Plotora",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function VerifyPhonePage() {
  return <VerifyPhoneView />;
}
