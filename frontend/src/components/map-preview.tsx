"use client";

import Link from "next/link";
import { ArrowUpRight, Fullscreen, Layers, Map as MapIcon, MapPin, Minus, Plus } from "lucide-react";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Select from "@/components/Select";

const MAP_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",

} as const;
const INITIAL_CENTER: [number, number] = [80.77, 7.87];
const INITIAL_ZOOM = 6.2;

export default function MapPreview() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapModeRef = useRef<keyof typeof MAP_STYLES>("streets");
  const previousModeRef = useRef<keyof typeof MAP_STYLES>("streets");
  const [mapMode, setMapMode] = useState<keyof typeof MAP_STYLES>("streets");

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.streets,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    map.on("error", () => {
      if (mapModeRef.current !== "satellite") return;
      const fallbackMode = previousModeRef.current;
      mapModeRef.current = fallbackMode;
      setMapMode(fallbackMode);
      map.setStyle(MAP_STYLES[fallbackMode]);
    });

    const resizeMap = () => {
      const canvasContainer = mapContainer.current?.querySelector<HTMLElement>(".mapboxgl-canvas-container");
      if (canvasContainer) {
        canvasContainer.style.width = "100%";
        canvasContainer.style.height = "100%";
      }
      map.resize();
      const canvas = mapContainer.current?.querySelector("canvas");
      if (canvas) {
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }
    };
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(mapContainer.current);
    map.once("load", resizeMap);
    map.on("style.load", resizeMap);
    requestAnimationFrame(resizeMap);

    return () => {
      resizeObserver.disconnect();
      mapRef.current = null;
      map.remove();
    };
  }, []);

  const changeMapMode = (mode: keyof typeof MAP_STYLES) => {
    if (mode === mapModeRef.current) return;
    previousModeRef.current = mapModeRef.current;
    mapModeRef.current = mode;
    setMapMode(mode);
    mapRef.current?.setStyle(MAP_STYLES[mode]);
  };

  const resetMap = () => {
    mapRef.current?.flyTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, bearing: 0, pitch: 0, essential: true });
  };

  return (
    <div className="relative h-105 overflow-hidden rounded-[18px] border border-[#e8edf0] bg-[#dcece7] shadow-[0_8px_18px_rgba(24,43,53,0.05)] lg:h-146.25">
      <div ref={mapContainer} className="absolute inset-0" style={{ height: "100%", width: "100%" }} aria-label="Interactive Mapbox map of Sri Lanka" />
      {!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN && <div className="absolute inset-0 grid place-items-center bg-[#dcece7] p-6 text-center text-sm text-[#41525c]">Add a Mapbox public token to load the interactive map.</div>}
      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-[9px] border border-[#e8edf0] bg-white px-3 py-2 text-xs font-bold text-[#182b35] shadow-sm"><MapPin className="size-4 text-[#182b35]" />Explore Sri Lanka</div>
      <div className="map-mode-control absolute left-4 top-14.5 z-10 flex items-center gap-1 rounded-[9px] border border-[#e8edf0] bg-white p-1 shadow-sm"><Layers className="ml-1 size-4" /><Select name="map-mode" label="Map mode" defaultValue={mapMode} options={[{ value: "streets", label: "Street" }, { value: "outdoors", label: "Outdoor" }, { value: "satellite", label: "Satellite" }]} onChange={(value) => changeMapMode(value as keyof typeof MAP_STYLES)} /></div>
      <div className="absolute right-4 top-4 z-10 flex flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_2px_12px_rgba(24,43,53,0.16)]">
        <button type="button" aria-label="Zoom in" className="grid size-9 place-items-center text-[#182b35] transition-colors hover:bg-[#f0f4f6]" style={{ backgroundColor: "#fff", color: "#182b35", opacity: 1 }} onClick={() => mapRef.current?.zoomIn()}><Plus className="size-3.5" /></button>
        <button type="button" aria-label="Zoom out" className="grid size-9 place-items-center border-t border-[#e8edf0] text-[#182b35] transition-colors hover:bg-[#f0f4f6]" style={{ backgroundColor: "#fff", color: "#182b35", opacity: 1 }} onClick={() => mapRef.current?.zoomOut()}><Minus className="size-3.5" /></button>
      </div>
      <div className="absolute bottom-14 left-4 z-10 flex flex-col gap-2">
        <button type="button" aria-label="Reset map view" className="grid size-9 place-items-center rounded-[10px] bg-white text-[#182b35] shadow-[0_2px_12px_rgba(24,43,53,0.16)] transition-colors hover:bg-[#f0f4f6]" style={{ backgroundColor: "#fff", color: "#182b35", opacity: 1 }} onClick={resetMap}><MapIcon className="size-3.5" /></button>
        <button type="button" aria-label="Open map fullscreen" className="grid size-9 place-items-center rounded-[10px] bg-white text-[#182b35] shadow-[0_2px_12px_rgba(24,43,53,0.16)] transition-colors hover:bg-[#f0f4f6]" style={{ backgroundColor: "#fff", color: "#182b35", opacity: 1 }} onClick={() => { const panel = mapContainer.current?.parentElement; if (!panel) return; if (document.fullscreenElement) document.exitFullscreen(); else panel.requestFullscreen?.(); }}><Fullscreen className="size-3.5" /></button>
      </div>
      <Link href="/explore" className="absolute bottom-4 right-4 inline-flex items-center gap-1 whitespace-nowrap rounded-[9px] bg-[#182b35] px-3 py-2 text-xs font-bold shadow-lg" style={{ color: "#fff" }}>Open interactive map <ArrowUpRight className="size-3.5" /></Link>
    </div>
  );
}
