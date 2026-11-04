"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inter } from "next/font/google";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  createListing,
  deleteListing,
  DELETABLE_STATUSES,
  EDITABLE_STATUSES,
  getMyListings,
  SellerApiError,
  submitForReview,
  updateListing,
  type ListingStatus,
  type PropertyCategory,
  type SellerProperty,
  type SellerPropertyRequest,
} from "@/lib/api/sellerProperties";
import { firstName, getSessionUser, greeting, initials, signOut, type SessionUser } from "@/lib/auth/session";
import "./seller.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

/* ───────── Types & data ───────── */
type Status = "Approved" | "Pending" | "Draft" | "Rejected" | "Sold";
type PType = "Land" | "House" | "Apartment" | "Commercial";
type Mode = "Sell" | "Rent out";
type View = "dashboard" | "listings" | "form";

/** UI view of a listing, mapped from the API's SellerProperty. */
interface Listing {
  id: string;
  title: string;
  location: string;
  type: PType;
  mode: Mode;
  price: number;
  listed: string;
  status: Status;
  apiStatus: ListingStatus;
  description: string;
  source: SellerProperty;
}

const STATUS_LABEL: Record<ListingStatus, Status> = {
  PUBLISHED: "Approved", PENDING_REVIEW: "Pending", DRAFT: "Draft", REJECTED: "Rejected", SOLD: "Sold",
};
const TYPE_LABEL: Record<PropertyCategory, PType> = {
  LAND: "Land", HOUSE: "House", APARTMENT: "Apartment", COMMERCIAL: "Commercial",
};
const TYPE_CODE: Record<PType, PropertyCategory> = {
  Land: "LAND", House: "HOUSE", Apartment: "APARTMENT", Commercial: "COMMERCIAL",
};

const listedFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Colombo" });

function toListing(p: SellerProperty): Listing {
  return {
    id: p.id,
    title: p.title,
    location: [p.address, p.district].filter(Boolean).join(", "),
    type: TYPE_LABEL[p.category],
    mode: p.listingType === "RENT" ? "Rent out" : "Sell",
    price: Number(p.price),
    listed: listedFmt.format(new Date(p.createdAt)),
    status: STATUS_LABEL[p.status],
    apiStatus: p.status,
    description: p.description ?? "",
    source: p,
  };
}

const TYPES: PType[] = ["Land", "House", "Apartment", "Commercial"];
const TABS = ["All", "Approved", "Pending", "Draft", "Rejected", "Sold"] as const;
const STEPS = ["Basics", "Location", "Details", "Photos & documents", "Review"];

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha", "Hambantota",
  "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar", "Matale",
  "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
  "Trincomalee", "Vavuniya",
];

const fmt = (n: number) => {
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} M`;
  return `Rs ${n.toLocaleString("en-LK")}`;
};

const emptyForm = {
  mode: "Sell" as Mode, type: "Land" as PType, title: "", description: "",
  district: "", address: "", latitude: "", longitude: "",
  price: "", extentPerches: "", floorAreaSqft: "", bedrooms: "", bathrooms: "", files: [] as string[],
};
type Form = typeof emptyForm;

const hasRooms = (t: PType) => t === "House" || t === "Apartment";
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

/** Builds the API request from the form, sending only fields relevant to the category. */
function toRequest(f: Form): SellerPropertyRequest {
  const rooms = hasRooms(f.type);
  return {
    title: f.title.trim(),
    description: f.description.trim() || null,
    category: TYPE_CODE[f.type],
    listingType: f.mode === "Sell" ? "SALE" : "RENT",
    price: Number(f.price),
    address: f.address.trim(),
    district: f.district,
    latitude: Number(f.latitude),
    longitude: Number(f.longitude),
    extentPerches: f.type === "Apartment" ? null : numOrNull(f.extentPerches),
    floorAreaSqft: f.type === "Land" ? null : numOrNull(f.floorAreaSqft),
    bedrooms: rooms ? numOrNull(f.bedrooms) : null,
    bathrooms: rooms ? numOrNull(f.bathrooms) : null,
  };
}

function toForm(p: SellerProperty): Form {
  const s = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
  return {
    mode: p.listingType === "RENT" ? "Rent out" : "Sell",
    type: TYPE_LABEL[p.category],
    title: p.title,
    description: p.description ?? "",
    district: p.district,
    address: p.address,
    latitude: s(p.latitude),
    longitude: s(p.longitude),
    price: s(p.price),
    extentPerches: s(p.extentPerches),
    floorAreaSqft: s(p.floorAreaSqft),
    bedrooms: s(p.bedrooms),
    bathrooms: s(p.bathrooms),
    files: [],
  };
}

/** Client-side checks per wizard step; the backend validates again. */
function stepError(step: number, f: Form): string {
  if (step === 0) {
    if (f.title.trim().length < 10) return "Add a listing title of at least 10 characters.";
    if (!f.description.trim()) return "Add a description to continue.";
  }
  if (step === 1) {
    if (!f.district) return "Choose the district.";
    if (!f.address.trim()) return "Add the address or nearest landmark.";
    const lat = Number(f.latitude), lng = Number(f.longitude);
    if (!f.latitude || !f.longitude || Number.isNaN(lat) || Number.isNaN(lng)) return "Add the latitude and longitude of the property.";
    if (lat < 5.8 || lat > 10 || lng < 79.5 || lng > 82) return "The location must be inside Sri Lanka (latitude 5.8–10, longitude 79.5–82).";
  }
  if (step === 2) {
    if (!(Number(f.price) > 0)) return "Enter a valid price to continue.";
    if (f.type === "Land" && !(Number(f.extentPerches) > 0)) return "Enter the land extent in perches.";
    if (hasRooms(f.type)) {
      if (f.bedrooms === "" || f.bathrooms === "") return "Enter the number of bedrooms and bathrooms.";
      if (!(Number(f.floorAreaSqft) > 0)) return "Enter the floor area in square feet.";
    }
    if (f.type === "Commercial" && !(Number(f.floorAreaSqft) > 0) && !(Number(f.extentPerches) > 0))
      return "Enter a floor area or a land extent.";
  }
  return "";
}

/* ───────── Icons ───────── */
const P: Record<string, string> = {
  dash: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  list: "M4 3h16v18H4zM9 21v-4h6v4M8 7h2m4 0h2M8 11h2m4 0h2",
  plus: "M12 5v14M5 12h14",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM16 16l4.5 4.5",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  heart: "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11Z",
  tag: "M3 12V3h9l9 9-9 9zM7.5 7.5h.01",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2",
  check: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8 12l2.5 2.5L16 9",
  back: "M19 12H5M11 6l-6 6 6 6",
  right: "M5 12h14M13 6l6 6-6 6",
  dots: "M12 5h.01M12 12h.01M12 19h.01",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M18 6 6 18M6 6l12 12",
  chev: "m9 6 6 6-6 6",
  spark: "M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z",
  home: "M3 10l9-7 9 7M5 9v12h14V9M9 21v-7h6v7",
  key: "M14 10a4 4 0 1 0-3.5 4L20 14v3h-3v3h-3v-3",
  upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
};
const Ic = ({ n, s = 18, c = "" }: { n: string; s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden className={c}>
    <path d={P[n]} />
  </svg>
);

/* ───────── Small pieces ───────── */
const badge: Record<Status, string> = {
  Approved: "bg-[#e7f5f3] text-[#0b8579]",
  Pending: "bg-amber-50 text-amber-700",
  Draft: "bg-orange-50 text-orange-600",
  Rejected: "bg-red-50 text-red-600",
  Sold: "bg-slate-100 text-slate-600",
};
const dot: Record<Status, string> = {
  Approved: "bg-[#0b8579]", Pending: "bg-amber-500", Draft: "bg-orange-400",
  Rejected: "bg-red-500", Sold: "bg-slate-400",
};
const StatusChip = ({ s }: { s: Status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge[s]}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${dot[s]}`} />{s}
  </span>
);

function Stat({ label, value, icon, note }: { label: string; value: number; icon: string; note: string }) {
  return (
    <article className="rounded-2xl border border-[#e3e9f0] bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#6c7a8f]">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f5f3] text-[#0b8579]"><Ic n={icon} s={16} /></span>
      </div>
      <p className="mt-2 text-3xl font-bold text-[#0f2038]">{value}</p>
      <p className="mt-1 text-xs text-[#6c7a8f]">{note}</p>
    </article>
  );
}

function ComingSoon({ title, icon, text }: { title: string; icon: string; text: string }) {
  return (
    <section className="rounded-2xl border border-[#e3e9f0] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">Coming soon</span>
      </div>
      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f5f3] text-[#0b8579]"><Ic n={icon} s={18} /></span>
        <p className="text-xs leading-relaxed text-[#6c7a8f]">{text}</p>
      </div>
    </section>
  );
}

const Field = ({ label, req, hint, children }: { label: string; req?: boolean; hint?: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold text-[#0f2038]">{label}{req && <span className="text-red-500"> *</span>}</label>
    {children}
    {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
  </div>
);
const inp = "w-full rounded-lg border border-[#dfe7f1] bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-[#0b8579] focus:ring-2 focus:ring-[#0b8579]/10";

/* ───────── Page ───────── */
function NavBtn({ icon, label, on, onClick, soon }: { icon: string; label: string; on?: boolean; onClick?: () => void; soon?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={soon} title={soon ? "Coming in a later sprint" : undefined}
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${on ? "bg-[#e7f5f3] font-semibold text-[#0b8579]" : soon ? "cursor-not-allowed text-slate-400" : "text-slate-600 hover:bg-slate-50"}`}>
      <Ic n={icon} s={17} />{label}
      {soon ? <span className="ml-auto rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">Soon</span> : null}
    </button>
  );
}

function Group({ t }: { t: string }) {
  return <p className="mb-1.5 mt-5 px-3 text-[10px] font-bold tracking-[0.12em] text-slate-400">{t}</p>;
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

export default function SellerPage() {
  const router = useRouter();
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => "light");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [access, setAccess] = useState<"checking" | "ok" | "forbidden">("checking");
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [menu, setMenu] = useState<string | null>(null);
  const [nav, setNav] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm);
  const [err, setErr] = useState("");
  const [jump, setJump] = useState("");
  const jumpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); jumpRef.current?.focus(); }
    };
    const c = () => setMenu(null);
    window.addEventListener("keydown", k);
    window.addEventListener("click", c);
    return () => { window.removeEventListener("keydown", k); window.removeEventListener("click", c); };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setItems((await getMyListings()).map(toListing));
    } catch (e) {
      if (e instanceof SellerApiError && e.status === 401) { router.replace("/login"); return; }
      setLoadError(e instanceof SellerApiError ? e.message : "Could not load your listings.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Check who is signed in, then load that seller's listings.
  useEffect(() => {
    let active = true;
    getSessionUser()
      .then((u) => {
        if (!active) return;
        if (!u) { router.replace("/login"); return; }
        if (!u.roles.includes("SELLER")) { setAccess("forbidden"); return; }
        setUser(u);
        setAccess("ok");
        return getMyListings().then((data) => { if (active) setItems(data.map(toListing)); });
      })
      .catch((e: unknown) => {
        if (!active) return;
        if (e instanceof SellerApiError && e.status === 401) { router.replace("/login"); return; }
        setAccess("ok");
        setLoadError(e instanceof Error ? e.message : "Could not load your listings.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { window.localStorage.setItem("plotora-theme", next); } catch { /* storage unavailable */ }
  }

  async function handleSignOut() {
    try { await signOut(); } finally { router.replace("/login"); }
  }

  const count = (s: string) => (s === "All" ? items.length : items.filter((i) => i.status === s).length);
  const live = count("Approved");
  const editing = editId !== null ? items.find((i) => i.id === editId) : undefined;

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items
      .filter((i) => tab === "All" || i.status === tab)
      .filter((i) => !t || [i.title, i.location, i.type, i.status].some((v) => v.toLowerCase().includes(t)));
  }, [items, tab, q]);

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const todo: [string, string, string][] = [
    ...(count("Draft") ? [["tag", `Finish ${plural(count("Draft"), "draft")}`, "Complete the details and submit for approval."] as [string, string, string]] : []),
    ...(count("Rejected") ? [["check", `${plural(count("Rejected"), "listing")} rejected`, "Edit the listing and submit it again."] as [string, string, string]] : []),
    ...(count("Pending") ? [["clock", `${plural(count("Pending"), "listing")} awaiting approval`, "Usually reviewed within 1–2 working days."] as [string, string, string]] : []),
  ];
  const top = [...items].sort((a, b) => b.source.createdAt.localeCompare(a.source.createdAt)).slice(0, 4);

  function go(v: View) { setView(v); setNav(false); setEditId(null); }
  function newListing() { setEditId(null); setForm(emptyForm); setStep(0); setErr(""); setView("form"); setNav(false); }
  function edit(i: Listing) {
    setEditId(i.id);
    setForm(toForm(i.source));
    setStep(0); setErr(""); setView("form");
  }
  async function remove(i: Listing) {
    if (!window.confirm(`Delete "${i.title}"? This can't be undone.`)) return;
    try {
      await deleteListing(i.id);
      setItems((c) => c.filter((x) => x.id !== i.id));
    } catch (e) {
      window.alert(e instanceof SellerApiError ? e.message : "Could not delete the listing.");
    }
  }

  function next() {
    const e = stepError(step, form);
    if (e) { setErr(e); return; }
    setErr(""); setStep((s) => Math.min(4, s + 1));
  }
  async function save(submit: boolean) {
    for (let i = 0; i < 3; i++) {
      const e = stepError(i, form);
      if (e) { setErr(e); setStep(i); return; }
    }
    setSaving(true); setErr("");
    try {
      const data = toRequest(form);
      let saved = editId !== null ? await updateListing(editId, data) : await createListing(data);
      if (submit) saved = await submitForReview(saved.id);
      const row = toListing(saved);
      setItems((c) => (editId !== null ? c.map((x) => (x.id === editId ? row : x)) : [row, ...c]));
      setView("listings"); setEditId(null);
    } catch (e) {
      if (e instanceof SellerApiError && e.status === 401) { router.replace("/login"); return; }
      setErr(e instanceof SellerApiError ? e.message : "Could not save the listing. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  function draftWithAI() {
    const t = `${form.type} for ${form.mode === "Sell" ? "sale" : "rent"}${form.district ? ` in ${form.district}` : ""}. Describe access roads, utilities, nearby facilities and deed or survey details.`;
    setForm({ ...form, description: form.description || t });
  }
  function doJump(e: React.FormEvent) {
    e.preventDefault();
    const t = jump.toLowerCase();
    if (t.includes("add") || t.includes("new")) newListing();
    else if (t.includes("list")) go("listings");
    else if (t.includes("dash")) go("dashboard");
    setJump("");
  }

  const crumb = view === "form" ? (editing ? ["My Listings", "Edit"] : ["My Listings", "Add Property"])
    : [view === "dashboard" ? "Dashboard" : "My Listings"];


  if (access === "checking") {
    return (
      <div className={`seller-app ${inter.className} flex min-h-screen items-center justify-center bg-[#f3f6fa] text-sm text-[#6c7a8f]`}>
        Loading your seller workspace…
      </div>
    );
  }
  if (access === "forbidden") {
    return (
      <div className={`seller-app ${inter.className} flex min-h-screen items-center justify-center bg-[#f3f6fa] px-4`}>
        <div className="max-w-sm rounded-2xl border border-[#e3e9f0] bg-white p-6 text-center">
          <h1 className="text-lg font-bold text-[#0f2038]">Seller accounts only</h1>
          <p className="mt-2 text-sm text-[#6c7a8f]">You&rsquo;re signed in with an account that isn&rsquo;t a seller account.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Link href="/buyer/dashboard" className="rounded-lg bg-[#0b8579] px-4 py-2 text-sm font-semibold text-white">Go to buyer dashboard</Link>
            <button type="button" onClick={() => void handleSignOut()} className="rounded-lg border border-[#dfe7f1] px-4 py-2 text-sm font-semibold">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`seller-app ${inter.className} min-h-screen bg-[#f3f6fa] text-[#0f2038] antialiased [&_h1]:tracking-[-0.03em] [&_h2]:tracking-[-0.02em]`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-[#e3e9f0] bg-white transition-transform md:translate-x-0 ${nav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center px-4">
          <Link href="/" aria-label="Plotora home">
            <Image className="seller-logo" src="/assets/images/plotora-logo-transparent.png" alt="Plotora" width={0} height={0} sizes="140px" unoptimized priority style={{ width: 140, height: "auto" }} />
          </Link>
          <button type="button" aria-label="Close navigation" onClick={() => setNav(false)} className="ml-auto p-1 md:hidden"><Ic n="close" /></button>
        </div>
        <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-xl border border-[#e3e9f0] p-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-400 text-white"><Ic n="tag" s={16} /></span>
          <div><p className="text-xs font-semibold">Seller / Owner</p><p className="text-[11px] text-[#6c7a8f]">Private portal</p></div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3">
          <Group t="OVERVIEW" />
          <NavBtn icon="dash" label="Dashboard" on={view === "dashboard"} onClick={() => go("dashboard")} />
          <Group t="LISTINGS" />
          <NavBtn icon="list" label="My listings" on={view === "listings" || (view === "form" && !!editing)} onClick={() => go("listings")} />
          <NavBtn icon="plus" label="Add property" on={view === "form" && !editing} onClick={newListing} />
          
        </nav>
      </aside>
      {nav && <button type="button" aria-label="Close navigation overlay" onClick={() => setNav(false)} className="fixed inset-0 z-30 bg-slate-950/30 md:hidden" />}

      <div className="md:ml-[220px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#e3e9f0] bg-white px-4 sm:px-6">
          <button type="button" aria-label="Open navigation" onClick={() => setNav(true)} className="p-1 md:hidden"><Ic n="menu" s={22} /></button>
          <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-xs text-[#6c7a8f] sm:flex">
            <span>Seller / Owner</span>
            {crumb.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5">
                <Ic n="chev" s={12} /><span className={i === crumb.length - 1 ? "font-semibold text-[#0f2038]" : ""}>{c}</span>
              </span>
            ))}
          </nav>
          <form onSubmit={doJump} className="relative ml-auto hidden w-60 md:block">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"><Ic n="search" s={15} /></span>
            <input ref={jumpRef} value={jump} onChange={(e) => setJump(e.target.value)} placeholder="Jump to page…" aria-label="Jump to page"
              className="w-full rounded-lg border border-[#dfe7f1] py-1.5 pl-8 pr-14 text-xs outline-none focus:border-[#0b8579]" />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-slate-200 px-1 text-[10px] text-slate-400">Ctrl K</kbd>
          </form>
          <div className="ml-auto flex items-center gap-3 text-slate-600 md:ml-0">
            <button type="button" aria-label="Search" className="md:hidden"><Ic n="search" /></button>
            <button type="button" disabled aria-label="Messages (coming soon)" title="Messages – coming soon" className="rounded-lg p-1.5 text-slate-400"><Ic n="chat" /></button>
            <button type="button" disabled aria-label="Notifications (coming soon)" title="Notifications – coming soon" className="rounded-lg p-1.5 text-slate-400"><Ic n="bell" /></button>
            <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"} className="rounded-lg p-1.5 hover:bg-slate-100">
              <Ic n={theme === "dark" ? "sun" : "moon"} />
            </button>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 text-[11px] font-bold text-white">{user ? initials(user.fullName) : ""}</span>
              <div className="hidden text-xs leading-tight sm:block"><p className="font-semibold text-[#0f2038]">{user ? firstName(user.fullName) : ""}</p><p className="text-[#6c7a8f]">Seller</p></div>
              <button type="button" onClick={() => void handleSignOut()} className="ml-1 rounded-md border border-[#dfe7f1] px-2 py-1 text-[11px] font-semibold text-[#6c7a8f] hover:bg-slate-50">Sign out</button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
          {/* ───── Dashboard ───── */}
          {view === "dashboard" && (
            <>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-[#0f2038]" suppressHydrationWarning>{greeting()}{user ? `, ${firstName(user.fullName)}` : ""}</h1>
                  <p className="mt-1 text-sm text-[#6c7a8f]">Your listings, enquiries and performance at a glance.</p>
                </div>
                <button type="button" onClick={newListing} className="inline-flex items-center gap-2 rounded-lg bg-[#0b8579] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#096d63]">
                  <Ic n="plus" s={16} />Add property
                </button>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Total listings" value={items.length} icon="list" note={`${count("Sold")} sold`} />
                <Stat label="Live on Plotora" value={live} icon="home" note="Approved and visible to buyers" />
                <Stat label="Pending approval" value={count("Pending")} icon="clock" note="Usually reviewed in 1–2 working days" />
                <Stat label="Drafts" value={count("Draft")} icon="tag" note={`${count("Rejected")} rejected – edit and resubmit`} />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <ComingSoon title="Listing performance" icon="eye"
                    text="Views, saves and enquiry trends for your listings will appear here once buyers start exploring them on the map." />

                  <section className="rounded-2xl border border-[#e3e9f0] bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-sm font-bold">Recent listings</h2>
                      <button type="button" onClick={() => go("listings")} className="text-xs font-semibold text-[#0b8579]">All listings →</button>
                    </div>
                    {top.length === 0 && (
                      <p className="py-6 text-center text-xs text-[#6c7a8f]">No listings yet. Add your first property to see it here.</p>
                    )}
                    {top.map((i) => (
                      <div key={i.id} className="flex items-center gap-3 border-t border-[#edf0f5] py-2.5 first:border-0">
                        <span className="flex h-9 w-12 items-center justify-center rounded-md bg-[#e7f5f3] text-[#0b8579]"><Ic n="home" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{i.title}</p>
                          <p className="truncate text-xs text-[#6c7a8f]">{i.location} · {i.type}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-xs"><p className="font-bold">{fmt(i.price)}</p><StatusChip s={i.status} /></div>
                      </div>
                    ))}
                  </section>
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-[#e3e9f0] bg-white p-4">
                    <h2 className="mb-2 text-sm font-bold">To do</h2>
                    {todo.length === 0 && (
                      <p className="py-3 text-xs text-[#6c7a8f]">You&rsquo;re all caught up.</p>
                    )}
                    {todo.map(([ic, t, d]) => (
                      <div key={t} className="flex items-start gap-3 border-t border-[#edf0f5] py-3 first:border-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500"><Ic n={ic} s={16} /></span>
                        <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{t}</p><p className="text-[11px] text-[#6c7a8f]">{d}</p></div>
                        <Ic n="chev" s={14} c="mt-2 text-slate-400" />
                      </div>
                    ))}
                  </section>
                  <ComingSoon title="Enquiries" icon="chat"
                    text="Messages from buyers about your listings will appear here when enquiries are added with the Buyer module." />
                </div>
              </div>
            </>
          )}

          {/* ───── My listings ───── */}
          {view === "listings" && (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[#0f2038]">My listings</h1>
                  <p className="mt-0.5 text-xs text-[#6c7a8f]">{items.length} properties · {live} live</p>
                </div>
                <button type="button" onClick={newListing} className="inline-flex items-center gap-2 rounded-lg bg-[#0b8579] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#096d63]">
                  <Ic n="plus" s={16} />Add property
                </button>
              </div>
              {loadError && (
                <div role="alert" className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  <span>{loadError}</span>
                  <button type="button" onClick={() => void load()} className="rounded-md border border-red-200 bg-white px-3 py-1.5 font-semibold">Retry</button>
                </div>
              )}
              <section className="rounded-2xl border border-[#e3e9f0] bg-white">
                <div role="tablist" className="flex gap-5 overflow-x-auto border-b border-[#e3e9f0] px-4">
                  {TABS.map((t) => (
                    <button key={t} role="tab" aria-selected={tab === t} type="button" onClick={() => setTab(t)}
                      className={`-mb-px whitespace-nowrap border-b-2 py-3 text-xs ${tab === t ? "border-[#0b8579] font-semibold text-[#0f2038]" : "border-transparent text-[#6c7a8f]"}`}>
                      {t} <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px]">{count(t)}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="relative w-full max-w-[260px]">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"><Ic n="search" s={15} /></span>
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings…" aria-label="Search listings"
                      className="w-full rounded-lg border border-[#dfe7f1] py-2 pl-8 pr-3 text-xs outline-none focus:border-[#0b8579]" />
                  </div>
                  <button type="button" onClick={() => {
                    const csv = ["Reference,Title,Type,Price,Status,Listed", ...rows.map((r) => `${r.source.referenceCode},"${r.title.replace(/"/g, '""')}",${r.type},${r.price},${r.status},"${r.listed}"`)].join("\n");
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                    a.download = "listings.csv"; a.click();
                  }} className="rounded-lg border border-[#dfe7f1] px-3 py-2 text-xs font-semibold hover:bg-slate-50">Export CSV</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead>
                      <tr className="bg-[#f7f9fc] text-[10px] font-bold uppercase tracking-wide text-[#6c7a8f]">
                        <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all"
                          checked={rows.length > 0 && sel.length === rows.length}
                          onChange={(e) => setSel(e.target.checked ? rows.map((r) => r.id) : [])} /></th>
                        <th className="px-3 py-3">Listing</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Price</th>
                        <th className="px-3 py-3">Status</th><th className="px-3 py-3">Reference</th><th className="px-3 py-3">Listed</th><th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-t border-[#edf0f5] hover:bg-[#fbfcfe]">
                          <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${r.title}`} checked={sel.includes(r.id)}
                            onChange={(e) => setSel((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))} /></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-[#e7f5f3] text-[#0b8579]"><Ic n="home" /></span>
                              <div><p className="font-semibold text-[#0f2038]">{r.title}</p><p className="text-[11px] text-[#6c7a8f]">{r.location}</p></div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600">{r.type}{r.mode === "Rent out" && <><br />· Rent</>}</td>
                          <td className="whitespace-nowrap px-3 py-3 font-semibold">{fmt(r.price)}</td>
                          <td className="px-3 py-3"><StatusChip s={r.status} /></td>
                          <td className="px-3 py-3 font-mono text-xs text-slate-600">{r.source.referenceCode}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600">{r.listed}</td>
                          <td className="relative px-3 py-3">
                            <button type="button" aria-label={`Actions for ${r.title}`} onClick={(e) => { e.stopPropagation(); setMenu(menu === r.id ? null : r.id); }}
                              className="rounded p-1 text-[#6c7a8f] hover:bg-slate-100"><Ic n="dots" /></button>
                            {menu === r.id && (
                              <div onClick={(e) => e.stopPropagation()} className="absolute right-3 top-9 z-10 w-36 rounded-lg border border-[#e3e9f0] bg-white p-1 shadow-lg">
                                <p className="px-3 pb-1 pt-0.5 text-[10px] text-[#6c7a8f]">{r.source.referenceCode}</p>
                                {EDITABLE_STATUSES.includes(r.apiStatus) && (
                                  <button type="button" onClick={() => edit(r)} className="block w-full rounded px-3 py-1.5 text-left hover:bg-slate-50">Edit</button>
                                )}
                                {DELETABLE_STATUSES.includes(r.apiStatus) && (
                                  <button type="button" onClick={() => { setMenu(null); void remove(r); }} className="block w-full rounded px-3 py-1.5 text-left text-red-600 hover:bg-red-50">Delete</button>
                                )}
                                {!EDITABLE_STATUSES.includes(r.apiStatus) && !DELETABLE_STATUSES.includes(r.apiStatus) && (
                                  <p className="px-3 py-1.5 text-[11px] text-[#6c7a8f]">No actions for {r.status.toLowerCase()} listings</p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {loading && (
                  <div className="space-y-2 px-4 py-6" aria-label="Loading listings">
                    {[0, 1, 2].map((k) => <div key={k} className="h-10 animate-pulse rounded-lg bg-slate-100" />)}
                  </div>
                )}
                {!loading && !loadError && rows.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    {items.length === 0 ? (
                      <>
                        <p className="text-sm font-semibold">No listings yet</p>
                        <p className="mt-1 text-xs text-[#6c7a8f]">Add your first property to get started.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold">No listings match</p>
                        <p className="mt-1 text-xs text-[#6c7a8f]">Try another tab or search term, or add a property.</p>
                      </>
                    )}
                  </div>
                )}
                <p className="border-t border-[#edf0f5] px-4 py-3 text-[11px] text-[#6c7a8f]">Showing {rows.length ? `1–${rows.length}` : 0} of {rows.length}</p>
              </section>
            </>
          )}

          {/* ───── Add / Edit property wizard ───── */}
          {view === "form" && (
            <div className="mx-auto max-w-[900px]">
              <button type="button" onClick={() => go("listings")} className="mb-3 inline-flex items-center gap-1.5 text-xs text-[#6c7a8f] hover:text-slate-800"><Ic n="back" s={14} />My listings</button>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[#0f2038]">{editing ? "Edit property" : "Add a property"}</h1>
                {editing && <StatusChip s={editing.status} />}
              </div>
              <p className="mb-4 mt-1 text-xs text-[#6c7a8f]">{editing ? editing.title : "List land or property in five quick steps."}</p>

              <ol className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {STEPS.map((s, i) => (
                  <li key={s}>
                    <button type="button" onClick={() => i <= step && setStep(i)}
                      className={`flex w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ${i === step ? "border-[#0b8579] bg-[#e7f5f3] font-semibold" : "border-[#e3e9f0] bg-white text-[#6c7a8f]"}`}>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${i === step ? "bg-[#0b8579] text-white" : i < step ? "bg-[#ddeeec] text-[#096d63]" : "bg-slate-100"}`}>{i < step ? "✓" : i + 1}</span>
                      <span className="truncate">{s}</span>
                    </button>
                  </li>
                ))}
              </ol>

              <section className="space-y-5">
                {step === 0 && (
                  <>
                    <Field label="What would you like to do?" req>
                      <div className="grid grid-cols-2 gap-3">
                        {([["Sell", "Sell this property", "tag"], ["Rent out", "Find a tenant", "key"]] as const).map(([m, d, ic]) => (
                          <button key={m} type="button" onClick={() => setForm({ ...form, mode: m })} aria-pressed={form.mode === m}
                            className={`flex items-center gap-3 rounded-xl border p-4 text-left ${form.mode === m ? "border-[#0b8579] bg-[#e7f5f3]" : "border-[#e3e9f0] bg-white"}`}>
                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${form.mode === m ? "bg-[#0b8579] text-white" : "bg-slate-100 text-[#6c7a8f]"}`}><Ic n={ic} s={16} /></span>
                            <span><span className="block text-sm font-semibold">{m}</span><span className="text-[11px] text-[#6c7a8f]">{d}</span></span>
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Property type" req>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {TYPES.map((t) => (
                          <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} aria-pressed={form.type === t}
                            className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${form.type === t ? "border-[#0b8579] bg-[#e7f5f3]" : "border-[#e3e9f0] bg-white"}`}>
                            <span className={`flex h-7 w-7 items-center justify-center rounded-md ${form.type === t ? "bg-[#0b8579] text-white" : "bg-slate-100 text-[#6c7a8f]"}`}><Ic n="home" s={14} /></span>{t}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Listing title" req hint="Mention the type, size and what makes it special.">
                      <input className={inp} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 20 perch residential land near the beach — Habaraduwa" />
                    </Field>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="desc" className="text-xs font-semibold">Description <span className="text-red-500">*</span></label>
                        <button type="button" onClick={draftWithAI} className="inline-flex items-center gap-1 rounded-md bg-[#e7f5f3] px-2 py-1 text-[11px] font-semibold text-[#0b8579]"><Ic n="spark" s={12} />Draft with AI</button>
                      </div>
                      <textarea id="desc" className={`${inp} min-h-[110px] resize-y`} maxLength={2000} value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the property, surroundings, access and any restrictions…" />
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="District" req>
                        <select className={inp} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                          <option value="">Select a district</option>
                          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </Field>
                      <Field label="Address or landmark" req>
                        <input className={inp} maxLength={300} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, town or nearest junction" />
                      </Field>
                      <Field label="Latitude" req hint="In Google Maps, right-click the spot and click the coordinates to copy them.">
                        <input type="number" step="any" inputMode="decimal" className={inp} value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="e.g. 6.0329" />
                      </Field>
                      <Field label="Longitude" req>
                        <input type="number" step="any" inputMode="decimal" className={inp} value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="e.g. 80.2168" />
                      </Field>
                    </div>
                    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#cfd8e3] bg-white px-4 text-center text-xs text-[#6c7a8f]">
                      Picking the location and drawing the boundary on the map will be added with the shared map component.
                    </div>
                  </>
                )}
                {step === 2 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label={form.mode === "Sell" ? "Asking price (Rs)" : "Monthly rent (Rs)"} req>
                      <input type="number" min="1" className={inp} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 27000000" />
                    </Field>
                    {form.type !== "Apartment" && (
                      <Field label="Land extent (perches)" req={form.type === "Land"}>
                        <input type="number" min="0" step="0.01" className={inp} value={form.extentPerches} onChange={(e) => setForm({ ...form, extentPerches: e.target.value })} placeholder="e.g. 20" />
                      </Field>
                    )}
                    {form.type !== "Land" && (
                      <Field label="Floor area (sq ft)" req={hasRooms(form.type)}>
                        <input type="number" min="0" className={inp} value={form.floorAreaSqft} onChange={(e) => setForm({ ...form, floorAreaSqft: e.target.value })} placeholder="e.g. 2100" />
                      </Field>
                    )}
                    {hasRooms(form.type) && (
                      <>
                        <Field label="Bedrooms" req><input type="number" min="0" className={inp} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></Field>
                        <Field label="Bathrooms" req><input type="number" min="0" className={inp} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></Field>
                      </>
                    )}
                  </div>
                )}
                {step === 3 && (
                  <Field label="Photos & documents" hint="Photo and document upload will be connected in a later sprint. Selected files are not uploaded yet.">
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#cfd8e3] bg-white px-4 py-8 text-xs text-[#6c7a8f] hover:bg-slate-50">
                      <Ic n="upload" s={22} />Choose files
                      <input type="file" multiple className="sr-only" onChange={(e) => setForm({ ...form, files: [...form.files, ...Array.from(e.target.files ?? []).map((f) => f.name)] })} />
                    </label>
                    {form.files.length > 0 && <ul className="mt-3 space-y-1 text-xs">{form.files.map((f, i) => <li key={i} className="rounded-md bg-white px-3 py-1.5 ring-1 ring-[#e3e9f0]">{f}</li>)}</ul>}
                  </Field>
                )}
                {step === 4 && (
                  <div className="rounded-xl border border-[#e3e9f0] bg-white p-4 text-sm">
                    {([["Goal", form.mode], ["Type", form.type], ["Title", form.title], ["District", form.district || "—"], ["Address", form.address || "—"],
                      ["Coordinates", form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : "—"],
                      ["Price", form.price ? fmt(Number(form.price)) : "—"],
                      ["Size", form.type === "Land" ? (form.extentPerches ? `${form.extentPerches} perches` : "—") : (form.floorAreaSqft ? `${form.floorAreaSqft} sq ft` : "—")],
                      ...(hasRooms(form.type) ? [["Rooms", `${form.bedrooms || 0} bed · ${form.bathrooms || 0} bath`] as const] : [])] as const).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-[#edf0f5] py-2 last:border-0"><span className="text-[#6c7a8f]">{k}</span><span className="text-right font-semibold">{v}</span></div>
                    ))}
                  </div>
                )}

                {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

                <div className="flex flex-wrap justify-end gap-3">
                  {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="rounded-lg border border-[#dfe7f1] bg-white px-5 py-2.5 text-sm font-semibold">Back</button>}
                  {step === 4 ? (
                    <>
                      <button type="button" disabled={saving} onClick={() => void save(false)} className="rounded-lg border border-[#dfe7f1] bg-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60">{saving ? "Saving…" : "Save as draft"}</button>
                      <button type="button" disabled={saving} onClick={() => void save(true)} className="rounded-lg bg-[#0b8579] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#096d63] disabled:opacity-60">{saving ? "Saving…" : "Submit for approval"}</button>
                    </>
                  ) : (
                    <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-lg bg-[#0b8579] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#096d63]">Continue<Ic n="right" s={15} /></button>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
