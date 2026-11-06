"use client";
import Image from "next/image";
import type { PropertyLocation } from "@/types/property";

export function PropertyLocationMap({ location }: { location: PropertyLocation }) {
  return (
    <div className="property-map">
      <Image
        src="/assets/images/property-location-placeholder.png"
        alt={`Location preview for ${location.address}, ${location.district}`}
        width={768}
        height={382}
        className="property-map-image"
      />
    </div>
  );
}
