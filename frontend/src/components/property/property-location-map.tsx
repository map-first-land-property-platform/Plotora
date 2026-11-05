"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { PropertyLocation } from "@/types/property";
export function PropertyLocationMap({ location }: { location: PropertyLocation }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  useEffect(() => {
    if (!container.current || !token) return;
    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({ container: container.current, accessToken: token, style: "mapbox://styles/mapbox/streets-v12", center: [location.longitude, location.latitude], zoom: 14 });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
      new mapboxgl.Marker({ color: "#117668" }).setLngLat([location.longitude, location.latitude]).addTo(map);
      map.on("error", () => setFailed(true));
    } catch { setFailed(true); return; }
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); };
  }, [token, location.latitude, location.longitude]);
  return <div className="property-map"><div ref={container} className="property-map-canvas" aria-label={`Map of ${location.address}`} />{(!token || failed) && <div className="property-map-notice">The map is unavailable. Use “Open directions” below to view this location.</div>}</div>;
}
