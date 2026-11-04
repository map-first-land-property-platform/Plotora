"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, BedDouble, House, LayoutDashboard, Map as MapIcon, MapPin, Ruler, Search, TriangleAlert, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { ApiError, api } from "@/lib/api";
import {
  ApiNetworkError,
  ApiRequestError,
  getPublishedProperties,
} from "@/lib/api/properties";
import { extent, lkrShort } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/property-format";
import type { PropertyDetails } from "@/types/property";

type PortalView = "dashboard" | "properties";

interface BuyerUser {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
}

interface BuyerPortalProps {
  view: PortalView;
}

function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function usableImageUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return value.startsWith("/") && !value.startsWith("//") ? value : null;
  }
}

function PropertyCard({ property }: { property: PropertyDetails }) {
  const source = usableImageUrl(property.images[0]?.url);
  const [imageFailed, setImageFailed] = useState(false);
  const place = [property.location.address, property.location.district]
    .filter(Boolean)
    .join(", ");
  const price = lkrShort(property.listingType === "RENT"
    ? property.rentalDetails?.monthlyRent ?? property.price
    : property.price);

  return (
    <article className="group overflow-hidden rounded-xl border border-[#e2e9ed] bg-white transition-shadow hover:shadow-md">
      <Link href={`/properties/${encodeURIComponent(property.id)}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#13816f]">
        <div className="relative aspect-[1.55] overflow-hidden bg-[#e8eff0]">
          {source && !imageFailed ? (
            <Image
              src={source}
              alt={property.images[0]?.alt || property.title}
              fill
              unoptimized
              sizes="(min-width: 1280px) 27vw, (min-width: 768px) 42vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[#71848e]">
              <House aria-hidden="true" size={25} strokeWidth={1.5} />
              <span>No property photo provided</span>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#176f62] shadow-sm">
            {property.listingType === "RENT" ? "For rent" : "For sale"}
          </span>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xl font-bold tracking-tight text-[#1b303a]">
              {price}{property.listingType === "RENT" ? <span className="ml-1 text-sm font-medium text-[#71848e]">/ month</span> : null}
            </p>
            <span className="rounded-full bg-[#eff7f5] px-2.5 py-1 text-xs font-medium text-[#40665f]">
              {CATEGORY_LABELS[property.category]}
            </span>
          </div>

          <h2 className="mt-2 line-clamp-2 min-h-12 text-[15px] font-semibold leading-6 text-[#203842]">
            {property.title}
          </h2>
          <p className="mt-2 flex items-start gap-1.5 text-sm text-[#71848e]">
            <MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            <span className="line-clamp-1">{place}</span>
          </p>

          <div className="mt-3 flex min-h-8 flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#edf1f3] pt-3 text-sm text-[#506671]">
            {property.landDetails && (
              <span className="inline-flex items-center gap-1.5">
                <Ruler aria-hidden="true" size={15} className="text-[#82959e]" />
                {extent(property.landDetails.extentPerches)}
              </span>
            )}
            {property.buildingDetails?.bedrooms != null && (
              <span className="inline-flex items-center gap-1.5">
                <BedDouble aria-hidden="true" size={15} className="text-[#82959e]" />
                {property.buildingDetails.bedrooms} bedrooms
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 font-semibold text-[#117c6b]">
              View details <ArrowRight aria-hidden="true" size={15} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function ListingCards({ properties }: { properties: PropertyDetails[] }) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-[#cddeda] bg-[#fbfdfd] px-6 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e5f3ef] text-[#12806e]">
          <House aria-hidden="true" size={22} />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-[#203842]">No published properties yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-[#71848e]">
          Properties will appear here after a seller listing has been approved and published.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
    </div>
  );
}

export function BuyerPortal({ view }: BuyerPortalProps) {
  const router = useRouter();
  const [user, setUser] = useState<BuyerUser | null>(null);
  const [properties, setProperties] = useState<PropertyDetails[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    void api<BuyerUser>("/api/auth/me")
      .then(async (signedInUser) => {
        if (!active) return;
        if (!signedInUser.roles.includes("BUYER")) {
          setAccessDenied(true);
          return;
        }

        setUser(signedInUser);
        const listings = await getPublishedProperties();
        if (active) setProperties(listings);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login?returnTo=%2Fbuyer%2Fdashboard");
          return;
        }

        setLoadError(
          error instanceof ApiNetworkError || error instanceof ApiRequestError
            ? "We couldn’t load published properties. Check that the backend and database are running, then try again."
            : "We couldn’t load your buyer dashboard. Please try again.",
        );
      });
    return () => { active = false; };
  }, [router, retryKey]);

  const isLoading = properties === null && !loadError && !accessDenied;
  const dashboard = view === "dashboard";
  const pageTitle = dashboard ? "Buyer Dashboard" : "Explore properties";
  const firstName = user?.fullName.trim().split(/\s+/)[0] ?? "";

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fa] px-5">
        <div role="status" className="w-full max-w-sm rounded-xl border border-[#e2e9ed] bg-white p-6 text-center">
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-[#c7ded8] border-t-[#13816f] motion-reduce:animate-none" />
          <p className="mt-4 text-sm font-medium text-[#526b76]">Loading your buyer dashboard…</p>
        </div>
      </main>
    );
  }

  if (accessDenied) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fa] px-5">
        <div className="max-w-md rounded-xl border border-[#e2e9ed] bg-white p-7 text-center">
          <h1 className="text-xl font-semibold text-[#1b303a]">Buyer access required</h1>
          <p className="mt-2 text-sm leading-6 text-[#71848e]">Sign in with a buyer or renter account to open this dashboard.</p>
          <Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#117c6b] px-5 font-semibold text-white hover:bg-[#0d695b]">Sign in</Link>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8fa] px-5">
        <div role="alert" className="max-w-md rounded-xl border border-[#e2e9ed] bg-white p-7 text-center">
          <TriangleAlert aria-hidden="true" size={25} className="mx-auto text-amber-600" />
          <h1 className="mt-3 text-xl font-semibold text-[#1b303a]">Dashboard unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-[#71848e]">{loadError}</p>
          <button type="button" onClick={() => { setLoadError(null); setProperties(null); setRetryKey((key) => key + 1); }} className="mt-5 min-h-11 rounded-lg bg-[#117c6b] px-5 font-semibold text-white hover:bg-[#0d695b]">Try again</button>
        </div>
      </main>
    );
  }

  const listingCount = properties?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-[#1b303a]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[246px] flex-col border-r border-[#e4eaee] bg-white md:flex">
        <div className="flex h-[82px] items-center border-b border-[#e7ecef] px-7">
          <Image src="/plotora-logo.png" alt="Plotora — Map first. Own smarter." width={160} height={60} priority className="h-auto w-[145px]" />
        </div>
        <div className="mx-3 mt-4 rounded-xl border border-[#e2e9ed] bg-[#f9fbfc] p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e5f3ef] text-[#12806e]"><House aria-hidden="true" size={18} /></span>
            <span className="min-w-0"><span className="block text-sm font-semibold">Buyer / Renter</span><span className="mt-0.5 block text-xs text-[#71848e]">Private portal</span></span>
          </div>
        </div>
        <nav aria-label="Buyer navigation" className="mt-7 px-3">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8798a1]">Overview</p>
          <PortalNavLink href="/buyer/dashboard" active={dashboard} label="Dashboard" icon={LayoutDashboard} />
          <PortalNavLink href="/properties" active={!dashboard} label="Explore properties" icon={Search} />
        </nav>
      </aside>

      <div className="md:pl-[246px]">
        <header className="flex min-h-[68px] items-center justify-between border-b border-[#e4eaee] bg-white px-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            <span className="text-[#71848e]">Buyer / Renter</span>
            <span aria-hidden="true" className="text-[#a2b0b6]">/</span>
            <span aria-current="page" className="font-semibold text-[#263c46]">{pageTitle}</span>
          </nav>
          {user && (
            <div className="flex items-center gap-2.5 rounded-full border border-[#e7ecef] py-1 pl-1 pr-3">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2aa580] text-sm font-bold text-white">{initials(user.fullName)}</span>
              <span className="hidden sm:block"><span className="block max-w-40 truncate text-sm font-semibold">{user.fullName}</span><span className="block text-xs text-[#71848e]">Buyer</span></span>
            </div>
          )}
        </header>

        <nav aria-label="Buyer navigation" className="flex gap-2 border-b border-[#e4eaee] bg-white px-4 py-2 md:hidden">
          <MobileNavLink href="/buyer/dashboard" active={dashboard}>Dashboard</MobileNavLink>
          <MobileNavLink href="/properties" active={!dashboard}>Explore properties</MobileNavLink>
        </nav>

        <main className="mx-auto max-w-[1480px] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-[26px] font-bold tracking-[-0.035em] text-[#1b303a] sm:text-[30px]">
                {dashboard ? `Welcome back${firstName ? `, ${firstName}` : ""}` : "Explore published properties"}
              </h1>
              <p className="mt-1.5 text-sm text-[#71848e] sm:text-[15px]">
                {dashboard
                  ? "Browse properties that sellers have published on Plotora."
                  : "View real listings published by sellers on Plotora."}
              </p>
            </div>
            {dashboard && (
              <Link href="/properties" className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#117c6b] px-4 text-sm font-semibold !text-white transition hover:bg-[#0d695b] hover:!text-white sm:self-auto">
                <MapIcon aria-hidden="true" size={16} className="text-white" />
                Explore the map
              </Link>
            )}
          </div>

          <section aria-labelledby="published-properties-title" className="rounded-2xl border border-[#e2e9ed] bg-white p-4 sm:p-5 lg:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#e9eef0] pb-4">
              <div>
                <h2 id="published-properties-title" className="text-lg font-semibold tracking-tight text-[#203842]">
                  {dashboard ? "Properties published by sellers" : "Available properties"}
                </h2>
                <p className="mt-1 text-sm text-[#71848e]">
                  {dashboard ? "Open a listing to see its full details." : "Select a listing to view its full details."}
                </p>
              </div>
              <span className="rounded-full bg-[#eff7f5] px-3 py-1 text-sm font-semibold text-[#176f62]">
                {listingCount} {listingCount === 1 ? "property" : "properties"}
              </span>
            </div>
            <ListingCards properties={properties ?? []} />
          </section>
        </main>
      </div>
    </div>
  );
}

function PortalNavLink({ href, active, label, icon: Icon }: { href: string; active: boolean; label: string; icon: LucideIcon }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`relative mt-2 flex min-h-[42px] items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${active ? "bg-[#e8f4f1] text-[#0c6256]" : "text-[#4c626d] hover:bg-[#f4f8f7]"}`}>
      {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-[#12806e]" />}
      <Icon aria-hidden="true" size={17} className={active ? "text-[#12806e]" : "text-[#72858e]"} />
      {label}
    </Link>
  );
}

function MobileNavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-md px-3 py-2 text-sm font-semibold ${active ? "bg-[#e8f4f1] text-[#0c6256]" : "text-[#536a75] hover:bg-[#f4f8f7]"}`}>
      {children}
    </Link>
  );
}
