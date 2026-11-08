"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPropertyById, PropertyNotFoundError } from "@/lib/api/properties";
import type { PropertyDetails } from "@/types/property";
import { PropertyDetailsView } from "./property-details-view";

export function PropertyDetailsLoader({ id }: { id: string }) {
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getPropertyById(id).then(value => { if (active) setProperty(value); }).catch(e => {
      if (active) setError(e instanceof PropertyNotFoundError ? "This property is no longer available." : "We couldn’t load this property. Please try again.");
    });
    return () => { active = false; };
  }, [id, attempt]);
  if (property) return <PropertyDetailsView key={property.id} property={property} />;
  return <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", background: "var(--bg)", color: "var(--text)" }}><div role={error ? "alert" : "status"} style={{ textAlign: "center", padding: 32 }}><p>{error || "Loading property details…"}</p>{error && <><button type="button" className="btn btn-primary" onClick={() => { setError(""); setAttempt(a => a + 1); }}>Try again</button><p><Link href="/buyer/dashboard">Back to properties</Link></p></>}</div></main>;
}
