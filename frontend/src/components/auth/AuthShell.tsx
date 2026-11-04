"use client";

import Image from "next/image";
import Link from "next/link";
import { Map, Moon, ShieldCheck, Sun } from "lucide-react";
import { ReactNode, useState } from "react";

type Props = {
  image?: string;
  promoHeading?: string;
  promoCopy?: string;
  variant?: "login" | "register";
  children: ReactNode;
};

export default function AuthShell({
  image = "/auth/login-landscape.png",
  promoHeading = "Map First. Own Smarter.",
  promoCopy = "See the land. Know the location. Find the right place for your next chapter.",
  variant = "login",
  children,
}: Props) {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"
  );

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("plotora-theme", next);
    } catch {
      // Storage may be unavailable in private browsing.
    }
    setDark(!dark);
  }

  return (
    <main className={`auth auth-${variant}`}>
      <aside
        className="auth-art"
        aria-label="Discover property with Plotora"
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
              <li><Map size={18} /><span><strong>Map-first search</strong> — draw an area, compare price per perch.</span></li>
              <li><ShieldCheck size={18} /><span><strong>Verified listings</strong> — deed, ID and organisation checks.</span></li>
            </ul>
          </div>
        </div>
      </aside>
      <div className="auth-side">
        <div className="auth-top">
          <Link className="back-link" href="/">Back to site</Link>
          <button className="btn btn-ghost btn-icon" aria-label="Toggle colour theme" title="Toggle theme" onClick={toggleTheme}>
            {dark ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
        <main id="page" tabIndex={-1} className="auth-main">
          {children}
        </main>
      </div>
    </main>
  );
}
