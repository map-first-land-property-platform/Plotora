"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, LayoutDashboard, LogOut } from "lucide-react";
import { firstName, getSessionUser, initials, signOut, type SessionUser } from "@/lib/auth/session";
import "./buyer-profile-menu.css";

export function BuyerProfileMenu() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    getSessionUser().then(value => { if (active) setUser(value); })
      .catch(() => { /* A public listing remains accessible when signed out. */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("click", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("click", close); document.removeEventListener("keydown", escape); };
  }, []);

  async function logout() {
    setBusy(true); setError("");
    try { await signOut(); window.location.replace("/"); }
    catch { setError("Could not sign out. Please try again."); setBusy(false); }
  }

  if (loading) return <span className="buyer-profile-loading" role="status">Loading profile…</span>;
  if (!user) return <Link className="btn btn-ghost" href="/login">Sign in</Link>;
  const buyer = user.roles.includes("BUYER");
  const dashboard = buyer ? "/buyer/dashboard" : user.roles.includes("ADMIN") ? "/admin/listings" : "/seller";
  return <div className="buyer-profile" ref={root}>
    <button ref={trigger} type="button" className="buyer-profile-trigger" aria-expanded={open} aria-label="Open account menu" onClick={() => setOpen(value => !value)}>
      <span className="buyer-profile-avatar" aria-hidden="true">{initials(user.fullName)}</span>
      <span className="buyer-profile-identity"><strong>{firstName(user.fullName)}</strong><span>{buyer ? "Buyer / Renter" : user.roles.includes("ADMIN") ? "Admin" : "Seller"}</span></span><ChevronRight size={15} />
    </button>
    {open && <div className="buyer-profile-dropdown"><div className="buyer-profile-heading"><strong>{user.fullName}</strong><span>{user.email}</span></div><Link href={dashboard}><LayoutDashboard size={16} />My dashboard</Link><button type="button" disabled={busy} className="buyer-profile-signout" onClick={() => void logout()}><LogOut size={16} />{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert">{error}</p>}</div>}
  </div>;
}
