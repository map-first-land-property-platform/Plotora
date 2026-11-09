"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

const DEFAULT_CENTER: [number, number] = [80.77, 7.87];

type Props = {
  latitude: string;
  longitude: string;
  onCoordinatesChange: (latitude: string, longitude: string) => void;
};

export default function PropertyLocationPicker({ latitude, longitude, onCoordinatesChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const callback = useRef(onCoordinatesChange);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    callback.current = onCoordinatesChange;
  }, [onCoordinatesChange]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!container.current || !token) return;

    mapboxgl.accessToken = token;
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const hasCoordinates = Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude);
    const center: [number, number] = hasCoordinates ? [parsedLongitude, parsedLatitude] : DEFAULT_CENTER;

    const instance = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center,
      zoom: hasCoordinates ? 14 : 7,
      attributionControl: true,
    });

    map.current = instance;
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const resizeMap = () => {
      const canvasContainer = container.current?.querySelector<HTMLElement>(".mapboxgl-canvas-container");
      if (canvasContainer) {
        canvasContainer.style.width = "100%";
        canvasContainer.style.height = "100%";
      }
      instance.resize();
      const canvas = container.current?.querySelector("canvas");
      if (canvas) {
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }
    };

    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container.current);
    instance.once("load", resizeMap);
    requestAnimationFrame(resizeMap);
    instance.on("error", () => setMapError(true));

    const placeMarker = (lat: number, lng: number) => {
      marker.current?.remove();
      marker.current = new mapboxgl.Marker({ color: "#117668" }).setLngLat([lng, lat]).addTo(instance);
    };

    if (hasCoordinates) placeMarker(parsedLatitude, parsedLongitude);

    instance.on("click", (event) => {
      const lat = event.lngLat.lat.toFixed(6);
      const lng = event.lngLat.lng.toFixed(6);
      placeMarker(Number(lat), Number(lng));
      callback.current(lat, lng);
    });

    return () => {
      resizeObserver.disconnect();
      marker.current?.remove();
      marker.current = null;
      instance.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!instance || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

    marker.current?.remove();
    marker.current = new mapboxgl.Marker({ color: "#117668" }).setLngLat([lng, lat]).addTo(instance);
    instance.flyTo({ center: [lng, lat], zoom: 14, essential: true });
  }, [latitude, longitude]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-[#cfd8e3] bg-white px-4 text-center text-sm text-[#6c7a8f]">Add a Mapbox public token to preview the property location.</div>;
  }

  return (
    <div className="relative h-[420px] overflow-hidden rounded-xl border border-[#cfd8e3] bg-[#dcece7] shadow-sm sm:h-[480px]">
      <div ref={container} className="absolute inset-0" style={{ height: "100%", width: "100%" }} aria-label="Select the property location on the map" />
      {mapError && <div className="absolute inset-0 grid place-items-center bg-[#dcece7] p-6 text-center text-sm text-[#41525c]">Mapbox could not load the map. Check the Mapbox token or network connection.</div>}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-[#182b35] shadow-sm">Click the map to place the property marker</div>
    </div>
  );
}
