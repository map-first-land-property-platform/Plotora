"use client";

import Image from "next/image";
import Link from "next/link";
import { KeyRound, Mail, Map, Moon, ShieldCheck, Smartphone, Sun } from "lucide-react";
import { ReactNode, useSyncExternalStore } from "react";
import "./auth-theme.css";

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

type Props = {
  image?: string;
  promoHeading?: string;
  promoCopy?: string;
  variant?: "login" | "register" | "recovery" | "phone";
  children: ReactNode;
};

export default function AuthShell({
  image = "/auth/login-landscape.png",
  promoHeading = "Map First. Own Smarter.",
  promoCopy = "See the land. Know the location. Find the right place for your next chapter.",
  variant = "login",
  children,
}: Props) {
  const dark = useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme === "dark", () => false);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("plotora-theme", next);
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }

  return (
    <main className={`auth auth-${variant}`}>
      <aside
        className="auth-art"
        aria-label={variant === "recovery" ? "Account recovery with Plotora" : variant === "phone" ? "Phone verification with Plotora" : "Discover property with Plotora"}
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(6, 33, 43, .2) 0%, rgba(3, 30, 29, .82) 100%), url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="auth-art-in">
          <Image
            className="brand-logo-image"
            src="/assets/images/plotora-logo-transparent.png"
            alt="Plotora — Map first. Own smarter."
            width={520}
            height={140}
            priority
            style={{ width: "132px", maxHeight: "52px" }}
          />
          <div className="auth-copy">
            <h2>{promoHeading}</h2>
            <p>{promoCopy}</p>
            <ul className="auth-points">
              {variant === "recovery" ? <>
                <li><Mail size={18} aria-hidden="true" /><span><strong>Start with your email</strong> — use the address linked to your account.</span></li>
                <li><KeyRound size={18} aria-hidden="true" /><span><strong>Keep your account private</strong> — never share your password or reset link.</span></li>
              </> : variant === "phone" ? <>
                <li><Smartphone size={18} aria-hidden="true" /><span><strong>Your number matters</strong> — use a mobile number you can access.</span></li>
                <li><KeyRound size={18} aria-hidden="true" /><span><strong>Keep your code private</strong> — never share a verification code with anyone.</span></li>
              </> : <>
              <li><Map size={18} /><span><strong>Map-first search</strong> — draw an area, compare price per perch.</span></li>
              <li><ShieldCheck size={18} /><span><strong>Verified listings</strong> — deed, ID and organisation checks.</span></li>
              </>}
            </ul>
          </div>
        </div>
      </aside>
      <div className="auth-side">
        <div className="auth-top">
          <Link className="back-link" href="/">Back to site</Link>
          <button type="button" className="btn btn-ghost btn-icon" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"} onClick={toggleTheme}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <main id="page" tabIndex={-1} className="auth-main">
          {children}
        </main>
      </div>
    </main>
  );
}
