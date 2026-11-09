"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, FileText, House, MapPin, Ruler, Share2 } from "lucide-react";
import PublicHeader from "@/layout/PublicHeader";
import PublicFooter from "@/layout/PublicFooter";
import { BuyerProfileMenu } from "@/features/buyer/components/buyer-profile-menu";
import { PropertyGallery } from "./property-gallery";
import { PropertyLocationMap } from "./property-location-map";
import { CATEGORY_LABELS, FURNISHING_LABELS, LISTING_TYPE_LABELS, formatDate, formatExtent, formatFloorArea, formatMonthlyRent, formatPrice, formatPricePerPerch } from "@/lib/property-format";
import type { PropertyDetails } from "@/types/property";
import "./property-details.css";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  if (children == null || children === "") return null;
  return <div className="property-spec"><dt>{label}</dt><dd>{children}</dd></div>;
}

export function PropertyDetailsView({ property: p }: { property: PropertyDetails }) {
  const { landDetails: land, buildingDetails: building, rentalDetails: rental, location } = p;
  const [notice, setNotice] = useState("");
  const rent = p.listingType === "RENT";
  const price = rent ? formatMonthlyRent(rental?.monthlyRent ?? p.price) : formatPrice(p.price);
  const facts = [
    ...(land ? [{ icon: Ruler, value: formatExtent(land.extentPerches), label: "Land extent" }, { icon: House, value: `${(land.extentPerches * 272.25).toLocaleString("en-LK", { maximumFractionDigits: 0 })} sq ft`, label: "Approximate area" }] : []),
    ...(building?.floorAreaSqft != null ? [{ icon: House, value: formatFloorArea(building.floorAreaSqft), label: "Floor area" }] : []),
    ...(land?.roadAccessFt != null ? [{ icon: MapPin, value: `${land.roadAccessFt} ft road`, label: "Road access" }] : []),
    ...(land?.deedType ? [{ icon: FileText, value: land.deedType, label: "Deed type" }] : []),
  ];
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: p.title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); setNotice("Property link copied."); }
    } catch (e) { if (!(e instanceof DOMException && e.name === "AbortError")) setNotice("Copy the page address from your browser to share this listing."); }
  }
  return <div className="property-detail-page"><PublicHeader accountMenu={<BuyerProfileMenu />} /><main id="page" className="property-detail-wrap">
    <nav className="property-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={14} /><Link href="/buyer/dashboard">Buyer dashboard</Link><ChevronRight size={14} /><span>{location.district}</span><ChevronRight size={14} /><strong>{p.title}</strong></nav>
    <PropertyGallery images={p.images} title={p.title} mosaic />
    <header className="property-title-row"><div><div className="property-tags"><span>{LISTING_TYPE_LABELS[p.listingType]}</span><span>{CATEGORY_LABELS[p.category]}</span></div><h1>{p.title}</h1><p className="property-address"><MapPin size={16} />{location.address}, {location.district}</p></div><div className="property-price"><strong>{price}</strong>{!rent && land?.pricePerPerch != null && <p>{formatPricePerPerch(land.pricePerPerch)}</p>}<button className="property-outline" onClick={() => void share()}><Share2 size={15} />Share</button><p role="status">{notice}</p></div></header>
    <div className="property-columns"><div className="property-content">
      {facts.length > 0 && <div className="property-facts">{facts.map(({icon: Icon, value, label}) => <div key={label}><Icon size={21} /><strong>{value}</strong><span>{label}</span></div>)}</div>}
      <nav className="property-section-nav" aria-label="Property sections"><a href="#overview">Overview</a><a href="#features">Features</a><a href="#location">Location</a></nav>
      <section id="overview" className="property-section"><h2>Overview</h2><p className="property-description">{p.description.trim() || "No description has been provided."}</p><dl className="property-specs">
        <Fact label="Type">{CATEGORY_LABELS[p.category]}</Fact><Fact label="Listing">{LISTING_TYPE_LABELS[p.listingType]}</Fact><Fact label="Reference">{p.referenceCode}</Fact>
        {land && <><Fact label="Extent">{formatExtent(land.extentPerches)}</Fact><Fact label="Deed">{land.deedType}</Fact><Fact label="Facing">{land.facing}</Fact><Fact label="Road access">{land.roadAccessFt == null ? null : `${land.roadAccessFt} ft`}</Fact></>}
        {building && <><Fact label="Bedrooms">{building.bedrooms}</Fact><Fact label="Bathrooms">{building.bathrooms}</Fact><Fact label="Floor area">{building.floorAreaSqft == null ? null : formatFloorArea(building.floorAreaSqft)}</Fact><Fact label="Floors">{building.floors}</Fact></>}
        {rent && rental && <><Fact label="Deposit">{rental.depositAmount == null ? null : formatPrice(rental.depositAmount)}</Fact><Fact label="Available from">{rental.availableFrom ? formatDate(rental.availableFrom) : null}</Fact><Fact label="Furnishing">{rental.furnishing ? FURNISHING_LABELS[rental.furnishing] : null}</Fact></>}
        <Fact label="Listed">{formatDate(p.createdAt)}</Fact>
      </dl></section>
      <section id="features" className="property-section"><h2>Features & amenities</h2>{p.features.length ? <ul className="property-feature-list">{[...new Set(p.features)].map(f => <li key={f}><Check size={16} />{f}</li>)}</ul> : <p className="property-muted">No additional features have been listed.</p>}</section>
      <section id="location" className="property-section"><h2>Location</h2><p className="property-muted">{location.address}, {location.district}</p><PropertyLocationMap location={location} /><div className="property-map-footer"><span><MapPin size={14} />{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span><a href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer">Open directions<ArrowUpRight size={14} /></a></div></section>
    </div><aside className="property-summary"><div className="property-summary-card"><span className="property-eyebrow">LISTING INFORMATION</span><h2>Your next place starts here.</h2><p>Explore the photos, property details, and location before planning your next step.</p><dl><Fact label="Property reference">{p.referenceCode}</Fact><Fact label="District">{location.district}</Fact><Fact label="Listed on">{formatDate(p.createdAt)}</Fact></dl><Link className="property-outline" href="/buyer/dashboard"><ArrowLeft size={16} />Back to properties</Link></div></aside></div>
  </main><PublicFooter /></div>;
}
