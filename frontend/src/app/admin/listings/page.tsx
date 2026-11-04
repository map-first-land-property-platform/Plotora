"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { approveListing, getListingsForReview, rejectListing } from "@/lib/api/adminProperties";
import { SellerApiError, type SellerProperty } from "@/lib/api/sellerProperties";
import { firstName, getSessionUser, initials, signOut, type SessionUser } from "@/lib/auth/session";
import "../../seller/seller.css";

/* Admin listing review: approve (publish) or reject listings that sellers submitted. */

type Tab = "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";
const TABS: { value: Tab; label: string }[] = [
  { value: "PENDING_REVIEW", label: "Waiting for review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
];
const TYPE_LABEL: Record<SellerProperty["category"], string> = {
  LAND: "Land", HOUSE: "House", APARTMENT: "Apartment", COMMERCIAL: "Commercial",
};
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Colombo" });

function fmtPrice(n: number): string {
  return n >= 1_000_000 ? `Rs ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} M` : `Rs ${n.toLocaleString("en-LK")}`;
}

function sizeText(p: SellerProperty): string {
  const parts: string[] = [];
  if (p.extentPerches) parts.push(`${p.extentPerches} perches`);
  if (p.floorAreaSqft) parts.push(`${p.floorAreaSqft} sq ft`);
  if (p.bedrooms !== null && p.bedrooms !== undefined) parts.push(`${p.bedrooms} bed · ${p.bathrooms ?? 0} bath`);
  return parts.join(" · ") || "—";
}

/* Theme: uses the site-wide setting from theme.ts (localStorage "plotora-theme" + <html data-theme>). */
function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
function readTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

const ICONS: Record<string, string> = {
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  chev: "m9 6 6 6-6 6",
  check: "M5 12.5 10 17 19 7",
};
function Ic({ n, s = 18 }: { n: string; s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={ICONS[n]} />
    </svg>
  );
}

export default function AdminListingsPage() {
  const router = useRouter();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [access, setAccess] = useState<"checking" | "ok" | "forbidden">("checking");
  const [tab, setTab] = useState<Tab>("PENDING_REVIEW");
  const [items, setItems] = useState<SellerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<SellerProperty | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  // Check who is signed in, then load the selected tab.
  useEffect(() => {
    let active = true;
    getSessionUser()
      .then((u) => {
        if (!active) return;
        if (!u) { router.replace("/login"); return; }
        if (!u.roles.includes("ADMIN")) { setAccess("forbidden"); return; }
        setUser(u);
        setAccess("ok");
        return getListingsForReview(tab).then((data) => { if (active) setItems(data); });
      })
      .catch((e: unknown) => {
        if (!active) return;
        if (e instanceof SellerApiError && e.status === 401) { router.replace("/login"); return; }
        setAccess("ok");
        setError(e instanceof Error ? e.message : "Could not load listings.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router, tab]);

  function changeTab(t: Tab) {
    if (t === tab) return;
    setItems([]); setLoading(true); setError(""); setNotice(""); setOpen(null);
    setTab(t);
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("plotora-theme", next); } catch { /* storage unavailable */ }
  }

  async function handleSignOut() {
    try { await signOut(); } finally { router.replace("/login"); }
  }

  function handleError(e: unknown, fallback: string) {
    if (e instanceof SellerApiError && e.status === 401) { router.replace("/login"); return; }
    setError(e instanceof Error ? e.message : fallback);
  }

  async function approve(p: SellerProperty) {
    setBusy(p.id); setError(""); setNotice("");
    try {
      await approveListing(p.id);
      setItems((c) => c.filter((x) => x.id !== p.id));
      setNotice(`“${p.title}” is approved and now live on Plotora.`);
    } catch (e) {
      handleError(e, "Could not approve the listing.");
    } finally {
      setBusy(null);
    }
  }

  function startReject(p: SellerProperty) {
    setRejecting(p); setReason(""); setReasonError("");
  }

  async function confirmReject() {
    if (!rejecting) return;
    if (reason.trim().length < 5) { setReasonError("Tell the seller what to change (at least 5 characters)."); return; }
    const p = rejecting;
    setBusy(p.id); setError(""); setNotice("");
    try {
      await rejectListing(p.id, reason.trim());
      setItems((c) => c.filter((x) => x.id !== p.id));
      setRejecting(null);
      setNotice(`“${p.title}” was rejected. The seller will see your reason.`);
    } catch (e) {
      if (e instanceof SellerApiError && e.status === 400) setReasonError(e.message);
      else { setRejecting(null); handleError(e, "Could not reject the listing."); }
    } finally {
      setBusy(null);
    }
  }

  if (access === "checking") {
    return (
      <div className="seller-app flex min-h-screen items-center justify-center bg-[#f3f6fa] text-sm text-[#6c7a8f]">
        Loading listing review…
      </div>
    );
  }
  if (access === "forbidden") {
    return (
      <div className="seller-app flex min-h-screen items-center justify-center bg-[#f3f6fa] px-4">
        <div className="max-w-sm rounded-2xl border border-[#e3e9f0] bg-white p-6 text-center">
          <h1 className="text-lg font-bold text-[#0f2038]">Admins only</h1>
          <p className="mt-2 text-sm text-[#6c7a8f]">Listing review is available to Plotora administrators.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/" className="rounded-lg bg-[#0b8579] px-4 py-2 text-sm font-semibold text-white">Go to home page</Link>
            <button type="button" onClick={() => void handleSignOut()} className="rounded-lg border border-[#dfe7f1] px-4 py-2 text-sm font-semibold">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  const pending = tab === "PENDING_REVIEW";

  return (
    <div className="seller-app min-h-screen bg-[#f3f6fa] text-[#0f2038] antialiased">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e3e9f0] bg-white px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Plotora home">
            <Image className="seller-logo" src="/assets/images/plotora-logo-transparent.png" alt="Plotora" width={0} height={0} sizes="130px" unoptimized priority style={{ width: 130, height: "auto" }} />
          </Link>
          <span className="hidden rounded-full bg-[#e7f5f3] px-2.5 py-1 text-[11px] font-semibold text-[#0b8579] sm:inline">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
            <Ic n={theme === "dark" ? "sun" : "moon"} />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b8579] text-[11px] font-bold text-white">{user ? initials(user.fullName) : ""}</span>
          <div className="hidden text-xs leading-tight sm:block"><p className="font-semibold text-[#0f2038]">{user ? firstName(user.fullName) : ""}</p><p className="text-[#6c7a8f]">Administrator</p></div>
          <button type="button" onClick={() => void handleSignOut()} className="ml-1 rounded-md border border-[#dfe7f1] px-2 py-1 text-[11px] font-semibold text-[#6c7a8f] hover:bg-slate-50">Sign out</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#0f2038]">Listing review</h1>
        <p className="mt-1 text-sm text-[#6c7a8f]">Approve listings to publish them on the map, or reject them with a reason for the seller.</p>

        {notice && (
          <div role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-[#e3e9f0] bg-[#e7f5f3] px-4 py-3 text-xs font-medium text-[#0b8579]">
            <Ic n="check" s={16} />{notice}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>
        )}

        <section className="mt-5 rounded-2xl border border-[#e3e9f0] bg-white">
          <div role="tablist" aria-label="Listing status" className="flex gap-1 overflow-x-auto border-b border-[#edf0f5] px-3 pt-2">
            {TABS.map((t) => (
              <button key={t.value} type="button" role="tab" aria-selected={tab === t.value} onClick={() => changeTab(t.value)}
                className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm ${tab === t.value ? "border-[#0b8579] font-semibold text-[#0f2038]" : "border-transparent text-[#6c7a8f] hover:text-slate-800"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="space-y-2 px-4 py-6" aria-label="Loading listings">
              {[0, 1, 2].map((k) => <div key={k} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          )}

          {!loading && items.length === 0 && !error && (
            <div className="px-5 py-14 text-center">
              <p className="text-sm font-semibold">{pending ? "Nothing waiting for review" : "No listings here yet"}</p>
              <p className="mt-1 text-xs text-[#6c7a8f]">{pending ? "New listings appear here when sellers submit them for approval." : "Reviewed listings will appear here."}</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <ul>
              {items.map((p) => {
                const expanded = open === p.id;
                return (
                  <li key={p.id} className="border-b border-[#edf0f5] last:border-0">
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <button type="button" onClick={() => setOpen(expanded ? null : p.id)} aria-expanded={expanded}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className={`text-[#6c7a8f] transition ${expanded ? "rotate-90" : ""}`}><Ic n="chev" s={16} /></span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#0f2038]">{p.title}</span>
                          <span className="block truncate text-[11px] text-[#6c7a8f]">
                            {TYPE_LABEL[p.category]} · {p.listingType === "RENT" ? "For rent" : "For sale"} · {p.district} · {p.referenceCode}
                          </span>
                        </span>
                      </button>
                      <div className="text-right text-xs">
                        <p className="font-bold">{fmtPrice(Number(p.price))}{p.listingType === "RENT" ? " / month" : ""}</p>
                        <p className="text-[#6c7a8f]">{pending ? "Submitted" : "Reviewed"} {dateFmt.format(new Date(pending ? p.updatedAt : p.reviewedAt ?? p.updatedAt))}</p>
                      </div>
                      {pending && (
                        <div className="flex gap-2">
                          <button type="button" disabled={busy === p.id} onClick={() => startReject(p)}
                            className="rounded-lg border border-[#dfe7f1] bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">Reject</button>
                          <button type="button" disabled={busy === p.id} onClick={() => void approve(p)}
                            className="rounded-lg bg-[#0b8579] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#096d63] disabled:opacity-60">
                            {busy === p.id ? "Saving…" : "Approve"}
                          </button>
                        </div>
                      )}
                    </div>
                    {expanded && (
                      <div className="grid gap-4 bg-[#f7f9fc] px-4 py-4 text-xs sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <p><span className="text-[#6c7a8f]">Address: </span>{p.address}, {p.district}</p>
                          <p><span className="text-[#6c7a8f]">Coordinates: </span>{p.latitude}, {p.longitude}</p>
                          <p><span className="text-[#6c7a8f]">Size: </span>{sizeText(p)}</p>
                          {p.pricePerPerch && <p><span className="text-[#6c7a8f]">Price per perch: </span>{fmtPrice(Number(p.pricePerPerch))}</p>}
                          {p.rejectionReason && <p className="text-red-600"><span className="font-semibold">Rejection reason: </span>{p.rejectionReason}</p>}
                        </div>
                        <div>
                          <p className="mb-1 text-[#6c7a8f]">Description</p>
                          <p className="whitespace-pre-line leading-relaxed">{p.description || "—"}</p>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {rejecting && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/30 px-4" role="dialog" aria-modal="true" aria-labelledby="reject-title">
          <div className="w-full max-w-md rounded-2xl border border-[#e3e9f0] bg-white p-5">
            <h2 id="reject-title" className="text-base font-bold text-[#0f2038]">Reject listing</h2>
            <p className="mt-1 text-xs text-[#6c7a8f]">“{rejecting.title}” goes back to the seller with your reason, so they can fix it and resubmit.</p>
            <label htmlFor="reject-reason" className="mt-4 block text-xs font-semibold">Reason for the seller</label>
            <textarea id="reject-reason" rows={4} maxLength={500} value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(""); }}
              placeholder="e.g. Please add the deed type and check the location coordinates."
              className="mt-1.5 w-full rounded-lg border border-[#dfe7f1] bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-[#0b8579]" />
            {reasonError && <p className="mt-1 text-xs text-red-600">{reasonError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setRejecting(null)} className="rounded-lg border border-[#dfe7f1] bg-white px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" disabled={busy === rejecting.id} onClick={() => void confirmReject()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {busy === rejecting.id ? "Rejecting…" : "Reject listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
