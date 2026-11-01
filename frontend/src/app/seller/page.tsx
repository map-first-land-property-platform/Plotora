"use client";

import Image from "next/image";
import { Inter } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

/* ───────── Types & data ───────── */
type Status = "Approved" | "Pending" | "Draft" | "Rejected" | "Sold";
type PType = "Land" | "House" | "Apartment" | "Commercial" | "Villa";
type Mode = "Sell" | "Rent out";
type View = "dashboard" | "listings" | "form";

interface Listing {
  id: number;
  title: string;
  location: string;
  type: PType;
  mode: Mode;
  price: number;
  views: number;
  enquiries: number;
  listed: string;
  status: Status;
  description: string;
  address: string;
  size: string;
  bedrooms: string;
  bathrooms: string;
  files: string[];
}

const L = (
  id: number, title: string, location: string, type: PType, mode: Mode,
  price: number, views: number, enquiries: number, listed: string, status: Status,
  description = ""
): Listing => ({
  id, title, location, type, mode, price, views, enquiries, listed, status,
  description, address: "", size: "", bedrooms: "", bathrooms: "", files: [],
});

const seed: Listing[] = [
  L(1, "16 perch residential block in Negombo Beach", "Negombo Beach, Negombo", "Land", "Sell", 31500000, 2050, 0, "16 Aug 2026", "Draft"),
  L(2, "Beachfront land — 20 perches, Habaraduwa", "Habaraduwa, Galle", "Land", "Sell", 27000000, 2366, 9, "21 Aug 2026", "Approved",
    "A 20-perch beachfront block in Habaraduwa, Galle, with 24 ft road access and utilities close by. A short walk from the sea. The deed is freehold and a recent survey plan is available on request. Suitable for a family home, holiday property or long-term investment."),
  L(3, "3-bedroom family house in Kundasale", "Kundasale, Kandy", "House", "Rent out", 185000, 1226, 2, "31 Aug 2026", "Pending"),
  L(4, "Beachfront land — 80 perches, Tangalle", "Tangalle, Hambantota", "Land", "Sell", 24500000, 963, 1, "10 Sept 2026", "Rejected"),
  L(5, "3-bedroom apartment in Battaramulla", "Battaramulla, Colombo", "Apartment", "Sell", 68000000, 1809, 9, "15 Sept 2026", "Approved"),
  L(6, "Modern 4-bedroom home with garden — Unawatuna", "Unawatuna, Galle", "House", "Sell", 63500000, 2623, 9, "18 Sept 2026", "Approved"),
  L(7, "Modern 4-bedroom home with garden — Kurunegala Town", "Kurunegala Town, Kurunegala", "House", "Sell", 61500000, 2682, 4, "24 Sept 2026", "Sold"),
  L(8, "40 perch freehold block in Weligama", "Weligama, Matara", "Land", "Sell", 23500000, 2440, 9, "10d ago", "Approved"),
];

const TYPES: PType[] = ["Land", "House", "Apartment", "Commercial", "Villa"];
const TABS = ["All", "Approved", "Pending", "Draft", "Rejected", "Sold"] as const;
const STEPS = ["Basics", "Location & boundary", "Details", "Photos & documents", "Review"];
const views14 = [56, 52, 48, 44, 45, 47, 50, 46, 50, 54, 54, 56, 60, 58];

const fmt = (n: number) => {
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} M`;
  return `Rs ${n.toLocaleString("en-LK")}`;
};

const emptyForm = {
  mode: "Sell" as Mode, type: "Land" as PType, title: "", description: "",
  location: "", address: "", price: "", size: "", bedrooms: "", bathrooms: "", files: [] as string[],
};
type Form = typeof emptyForm;

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

function Spark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" className="h-8 w-24" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function Stat({ label, value, icon, delta, note, up = true, color }: {
  label: string; value: string; icon: string; delta: string; note?: string; up?: boolean; color: string;
}) {
  const data = up ? [3, 4, 3, 5, 6, 5, 8, 9] : [9, 8, 8, 6, 5, 6, 4, 3];
  return (
    <article className="rounded-2xl border border-[#e3e9f0] bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs text-[#6c7a8f]">{label}</p>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e7f5f3] text-[#0b8579]"><Ic n={icon} s={15} /></span>
      </div>
      <p className="mt-1 text-2xl font-bold text-[#0f2038]">{value}</p>
      <div className="mt-2 flex items-end justify-between">
        <div className="flex items-center gap-2 text-[11px]">
          <span className={`rounded px-1.5 py-0.5 font-semibold ${up ? "bg-[#e7f5f3] text-[#0b8579]" : "bg-red-50 text-red-600"}`}>
            {up ? "↗" : "↘"} {delta}
          </span>
          {note && <span className="text-[#6c7a8f]">{note}</span>}
        </div>
        <Spark data={data} color={color} />
      </div>
    </article>
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
export default function SellerPage() {
  const [items, setItems] = useState<Listing[]>(seed);
  const [view, setView] = useState<View>("dashboard");
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<number[]>([]);
  const [menu, setMenu] = useState<number | null>(null);
  const [nav, setNav] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
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

  const count = (s: string) => (s === "All" ? items.length : items.filter((i) => i.status === s).length);
  const live = count("Approved");
  const editing = editId !== null ? items.find((i) => i.id === editId) : undefined;

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items
      .filter((i) => tab === "All" || i.status === tab)
      .filter((i) => !t || [i.title, i.location, i.type, i.status].some((v) => v.toLowerCase().includes(t)));
  }, [items, tab, q]);

  const top = [...items].filter((i) => i.status === "Approved").sort((a, b) => b.views - a.views).slice(0, 4);

  function go(v: View) { setView(v); setNav(false); setEditId(null); }
  function newListing() { setEditId(null); setForm(emptyForm); setStep(0); setErr(""); setView("form"); setNav(false); }
  function edit(i: Listing) {
    setEditId(i.id);
    setForm({ mode: i.mode, type: i.type, title: i.title, description: i.description, location: i.location,
      address: i.address, price: String(i.price), size: i.size, bedrooms: i.bedrooms, bathrooms: i.bathrooms, files: i.files });
    setStep(0); setErr(""); setView("form");
  }
  function remove(i: Listing) {
    if (window.confirm(`Delete "${i.title}"? This can't be undone.`)) setItems((c) => c.filter((x) => x.id !== i.id));
  }
  function setStatus(id: number, status: Status) { setItems((c) => c.map((x) => (x.id === id ? { ...x, status } : x))); }

  function next() {
    if (step === 0 && (!form.title.trim() || !form.description.trim())) {
      setErr("Add a listing title and description to continue."); return;
    }
    if (step === 1 && !form.location.trim()) { setErr("Add the town or district to continue."); return; }
    if (step === 2 && !(Number(form.price) > 0)) { setErr("Enter a valid asking price to continue."); return; }
    setErr(""); setStep((s) => Math.min(4, s + 1));
  }
  function save(status: Status) {
    const data = { mode: form.mode, type: form.type, title: form.title.trim(), description: form.description.trim(),
      location: form.location.trim(), address: form.address.trim(), price: Number(form.price) || 0,
      size: form.size, bedrooms: form.bedrooms, bathrooms: form.bathrooms, files: form.files };
    if (editId !== null) {
      setItems((c) => c.map((x) => (x.id === editId ? { ...x, ...data, status: status === "Draft" ? x.status : status } : x)));
    } else {
      setItems((c) => [{ ...L(Date.now(), "", "", "Land", "Sell", 0, 0, 0, "Today", status), ...data }, ...c]);
    }
    setView("listings"); setEditId(null);
  }
  function draftWithAI() {
    const t = `${form.type === "Land" ? "Land" : form.type} for ${form.mode === "Sell" ? "sale" : "rent"}${form.location ? ` in ${form.location}` : ""}. Describe access roads, utilities, nearby facilities and deed or survey details.`;
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

  const NavBtn = ({ icon, label, on, onClick, badge: b }: { icon: string; label: string; on?: boolean; onClick: () => void; badge?: number }) => (
    <button type="button" onClick={onClick}
      className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${on ? "bg-[#e7f5f3] font-semibold text-[#0b8579]" : "text-slate-600 hover:bg-slate-50"}`}>
      <Ic n={icon} s={17} />{label}
      {b ? <span className="ml-auto rounded-full bg-[#ddeeec] px-1.5 text-[11px] font-semibold text-[#096d63]">{b}</span> : null}
    </button>
  );
  const Group = ({ t }: { t: string }) => <p className="mb-1.5 mt-5 px-3 text-[10px] font-bold tracking-[0.12em] text-slate-400">{t}</p>;

  return (
    <div className={`${inter.className} min-h-screen bg-[#f3f6fa] text-[#0f2038] antialiased [&_h1]:tracking-[-0.03em] [&_h2]:tracking-[-0.02em]`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-[#e3e9f0] bg-white transition-transform md:translate-x-0 ${nav ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center px-4">
          <a href="/" aria-label="Plotora home">
            <Image src="/plotora-logo.png" alt="Plotora" width={0} height={0} sizes="140px" unoptimized priority style={{ width: 140, height: "auto" }} />
          </a>
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
          <Group t="BUYERS" />
          <NavBtn icon="chat" label="Enquiries" badge={2} onClick={() => {}} />
          <NavBtn icon="cal" label="Site visits" onClick={() => {}} />
          <div className="mt-4 border-t border-[#edf0f5] pt-3">
            <NavBtn icon="grid" label="More workspace tools" onClick={() => {}} />
          </div>
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
            <span className="relative"><Ic n="chat" /><b className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1 text-[9px] text-white">3</b></span>
            <span className="relative"><Ic n="bell" /><b className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1 text-[9px] text-white">2</b></span>
            <Ic n="sun" />
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 text-[11px] font-bold text-white">RS</span>
              <div className="hidden text-xs leading-tight sm:block"><p className="font-semibold text-[#0f2038]">Ruwan</p><p className="text-[#6c7a8f]">Seller</p></div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
          {/* ───── Dashboard ───── */}
          {view === "dashboard" && (
            <>
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-[#0f2038]">Good morning, Ruwan</h1>
                  <p className="mt-1 text-sm text-[#6c7a8f]">Your listings, enquiries and performance at a glance.</p>
                </div>
                <button type="button" onClick={newListing} className="inline-flex items-center gap-2 rounded-lg bg-[#0b8579] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#096d63]">
                  <Ic n="plus" s={16} />Add property
                </button>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Active listings" value={String(live)} icon="home" delta="12%" note={`${count("Pending")} pending approval`} color="#d98a3d" />
                <Stat label="Views (30 days)" value="16,159" icon="eye" delta="18%" color="#3b6fb6" />
                <Stat label="Enquiries" value="7" icon="chat" delta="9%" note="2 new" color="#0b8579" />
                <Stat label="Saved by buyers" value="295" icon="heart" delta="3%" up={false} color="#d4577a" />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <section className="rounded-2xl border border-[#e3e9f0] bg-white p-4">
                    <div className="flex items-start justify-between">
                      <div><h2 className="text-sm font-bold">Listing views</h2><p className="text-xs text-[#6c7a8f]">Last 14 days</p></div>
                      <button type="button" className="text-xs font-semibold text-[#0b8579]">Full analytics →</button>
                    </div>
                    <svg viewBox="0 0 560 220" className="mt-3 w-full" role="img" aria-label="Listing views over the last 14 days">
                      {[0, 25, 50, 75, 100].map((v) => (
                        <g key={v}>
                          <line x1="32" x2="550" y1={190 - v * 1.7} y2={190 - v * 1.7} stroke="#edf0f5" />
                          <text x="24" y={194 - v * 1.7} fontSize="10" textAnchor="end" fill="#94a3b8">{v}</text>
                        </g>
                      ))}
                      {(() => {
                        const pts = views14.map((v, i) => [32 + (i / 13) * 518, 190 - v * 1.7]);
                        const line = pts.map((p) => p.join(",")).join(" ");
                        return (
                          <>
                            <polygon points={`32,190 ${line} 550,190`} fill="#cbd5e1" opacity="0.4" />
                            <polyline points={line} fill="none" stroke="#d98a3d" strokeWidth="2" />
                            {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="#fff" stroke="#d98a3d" />)}
                          </>
                        );
                      })()}
                      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
                        <text key={i} x={32 + (i / 13) * 518} y="208" fontSize="10" textAnchor="middle" fill="#94a3b8">{3 + i} Oct</text>
                      ))}
                    </svg>
                  </section>

                  <section className="rounded-2xl border border-[#e3e9f0] bg-white p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h2 className="text-sm font-bold">Top performing listings</h2>
                      <button type="button" onClick={() => go("listings")} className="text-xs font-semibold text-[#0b8579]">All listings →</button>
                    </div>
                    {top.map((i) => (
                      <div key={i.id} className="flex items-center gap-3 border-t border-[#edf0f5] py-2.5 first:border-0">
                        <span className="flex h-9 w-12 items-center justify-center rounded-md bg-[#e7f5f3] text-[#0b8579]"><Ic n="home" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{i.title}</p>
                          <p className="truncate text-xs text-[#6c7a8f]">{i.location} · {i.type}</p>
                        </div>
                        <div className="text-right text-xs"><p className="font-bold">{fmt(i.price)}</p><p className="text-[#6c7a8f]">{i.views.toLocaleString()} views · {i.enquiries} enq.</p></div>
                      </div>
                    ))}
                  </section>
                </div>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-[#e3e9f0] bg-white p-4">
                    <h2 className="mb-2 text-sm font-bold">To do</h2>
                    {[
                      ["check", "Verify your property deeds", "Verified listings get up to 3× more enquiries."],
                      ["chat", "Reply to 2 new enquiries", "Fast replies improve your ranking."],
                      ["clock", `${count("Pending")} listing awaiting approval`, "Typically reviewed within 1–2 working days."],
                    ].map(([ic, t, d]) => (
                      <div key={t} className="flex items-start gap-3 border-t border-[#edf0f5] py-3 first:border-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500"><Ic n={ic} s={16} /></span>
                        <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{t}</p><p className="text-[11px] text-[#6c7a8f]">{d}</p></div>
                        <Ic n="chev" s={14} c="mt-2 text-slate-400" />
                      </div>
                    ))}
                  </section>
                  <section className="rounded-2xl border border-[#e3e9f0] bg-white p-4">
                    <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold">Latest enquiries</h2><button type="button" className="text-xs font-semibold text-[#0b8579]">Inbox →</button></div>
                    {[
                      ["AP", "Amaya Perera", "Hi, is this still available? I’d like to arr…", "New", "bg-amber-50 text-amber-700", "bg-violet-500"],
                      ["AP", "Amaya Perera", "Could you share the survey p…", "Responded", "bg-[#e7f5f3] text-[#0b8579]", "bg-violet-500"],
                      ["SR", "Sanduni Rahman", "Hi, is this still available? I…", "Visit scheduled", "bg-slate-100 text-slate-600", "bg-teal-600"],
                    ].map(([a, n, m, s, sc, bg], i) => (
                      <div key={i} className="flex items-center gap-2.5 border-t border-[#edf0f5] py-2.5 first:border-0">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${bg}`}>{a}</span>
                        <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{n}</p><p className="truncate text-[11px] text-[#6c7a8f]">{m}</p></div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${sc}`}>{s}</span>
                      </div>
                    ))}
                  </section>
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
                    const csv = ["Title,Type,Price,Status,Views,Listed", ...rows.map((r) => `"${r.title}",${r.type},${r.price},${r.status},${r.views},${r.listed}`)].join("\n");
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
                        <th className="px-3 py-3">Status</th><th className="px-3 py-3">Views</th><th className="px-3 py-3">Listed</th><th className="w-10" />
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
                          <td className="px-3 py-3 text-slate-600">{r.views.toLocaleString()}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-slate-600">{r.listed}</td>
                          <td className="relative px-3 py-3">
                            <button type="button" aria-label={`Actions for ${r.title}`} onClick={(e) => { e.stopPropagation(); setMenu(menu === r.id ? null : r.id); }}
                              className="rounded p-1 text-[#6c7a8f] hover:bg-slate-100"><Ic n="dots" /></button>
                            {menu === r.id && (
                              <div onClick={(e) => e.stopPropagation()} className="absolute right-3 top-9 z-10 w-36 rounded-lg border border-[#e3e9f0] bg-white p-1 shadow-lg">
                                <button type="button" onClick={() => edit(r)} className="block w-full rounded px-3 py-1.5 text-left hover:bg-slate-50">Edit</button>
                                {r.status !== "Sold" && <button type="button" onClick={() => { setStatus(r.id, "Sold"); setMenu(null); }} className="block w-full rounded px-3 py-1.5 text-left hover:bg-slate-50">Mark as sold</button>}
                                <button type="button" onClick={() => { remove(r); setMenu(null); }} className="block w-full rounded px-3 py-1.5 text-left text-red-600 hover:bg-red-50">Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm font-semibold">No listings match</p>
                    <p className="mt-1 text-xs text-[#6c7a8f]">Try another tab or search term, or add a property.</p>
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
                    <Field label="Town / district" req><input className={inp} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Habaraduwa, Galle" /></Field>
                    <Field label="Address or landmark"><input className={inp} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, nearest junction or landmark" /></Field>
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-[#cfd8e3] bg-white text-xs text-[#6c7a8f]">
                      Map boundary drawing needs the map component — connect it here.
                    </div>
                  </>
                )}
                {step === 2 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label={form.mode === "Sell" ? "Asking price (Rs)" : "Monthly rent (Rs)"} req>
                      <input type="number" min="1" className={inp} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 27000000" />
                    </Field>
                    <Field label={form.type === "Land" ? "Land extent" : "Floor area"}>
                      <input className={inp} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder={form.type === "Land" ? "e.g. 20 perches" : "e.g. 2,100 sq ft"} />
                    </Field>
                    {form.type !== "Land" && (
                      <>
                        <Field label="Bedrooms"><input type="number" min="0" className={inp} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></Field>
                        <Field label="Bathrooms"><input type="number" min="0" className={inp} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></Field>
                      </>
                    )}
                  </div>
                )}
                {step === 3 && (
                  <Field label="Photos & documents" hint="Add photos, deeds and survey plans. Files stay on this device until a backend is connected.">
                    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#cfd8e3] bg-white px-4 py-8 text-xs text-[#6c7a8f] hover:bg-slate-50">
                      <Ic n="upload" s={22} />Choose files
                      <input type="file" multiple className="sr-only" onChange={(e) => setForm({ ...form, files: [...form.files, ...Array.from(e.target.files ?? []).map((f) => f.name)] })} />
                    </label>
                    {form.files.length > 0 && <ul className="mt-3 space-y-1 text-xs">{form.files.map((f, i) => <li key={i} className="rounded-md bg-white px-3 py-1.5 ring-1 ring-[#e3e9f0]">{f}</li>)}</ul>}
                  </Field>
                )}
                {step === 4 && (
                  <div className="rounded-xl border border-[#e3e9f0] bg-white p-4 text-sm">
                    {([["Goal", form.mode], ["Type", form.type], ["Title", form.title], ["Location", form.location], ["Price", form.price ? fmt(Number(form.price)) : "—"], ["Size", form.size || "—"], ["Files", String(form.files.length)]] as const).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-[#edf0f5] py-2 last:border-0"><span className="text-[#6c7a8f]">{k}</span><span className="text-right font-semibold">{v}</span></div>
                    ))}
                  </div>
                )}

                {err && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

                <div className="flex flex-wrap justify-end gap-3">
                  {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="rounded-lg border border-[#dfe7f1] bg-white px-5 py-2.5 text-sm font-semibold">Back</button>}
                  {step === 4 ? (
                    <>
                      <button type="button" onClick={() => save("Draft")} className="rounded-lg border border-[#dfe7f1] bg-white px-5 py-2.5 text-sm font-semibold">Save as draft</button>
                      <button type="button" onClick={() => save("Pending")} className="rounded-lg bg-[#0b8579] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#096d63]">Submit for approval</button>
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
