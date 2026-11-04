import type { Furnishing, ListingType, PropertyCategory } from "@/types/property";

export const CATEGORY_LABELS: Record<PropertyCategory, string> = {
  LAND: "Land",
  HOUSE: "House",
  APARTMENT: "Apartment",
  COMMERCIAL: "Commercial",
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  SALE: "For sale",
  RENT: "For rent",
};

export const FURNISHING_LABELS: Record<Furnishing, string> = {
  FURNISHED: "Furnished",
  SEMI_FURNISHED: "Semi-furnished",
  UNFURNISHED: "Unfurnished",
};

const money = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 });

export function formatPrice(value: number | null): string {
  return value == null ? "—" : `Rs ${money.format(value)}`;
}

export function formatMonthlyRent(value: number | null): string {
  return value == null ? "—" : `${formatPrice(value)} / month`;
}

export function formatPricePerPerch(value: number | null): string {
  return value == null ? "—" : `${formatPrice(value)} per perch`;
}

export function formatExtent(value: number | null): string {
  if (value == null) return "—";
  const formatted = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  return `${formatted} ${value === 1 ? "perch" : "perches"}`;
}

export function formatFloorArea(value: number | null): string {
  return value == null ? "—" : `${money.format(value)} sq ft`;
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Colombo",
  }).format(parsed);
}
