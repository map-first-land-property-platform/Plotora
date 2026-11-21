import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import AuthShell from "./AuthShell";
import "./recovery.css";

export default function RecoveryShell({ children }: { children: ReactNode }) {
  return (
    <AuthShell
      variant="recovery"
      promoHeading="A fresh start. Back to your journey."
      promoCopy="Forgot your password? Let's help you find your way back to Plotora and continue your property journey."
    >
      <div className="auth-card recovery-card">
        <Link className="recovery-back" href="/login"><ArrowLeft size={16} aria-hidden="true" />Back to sign in</Link>
        {children}
      </div>
    </AuthShell>
  );
}

export function RecoveryHeading({ title, children }: { title: string; children: ReactNode }) {
  return <><h1>{title}</h1><p className="recovery-subtitle">{children}</p></>;
}
