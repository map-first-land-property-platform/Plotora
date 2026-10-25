import type { ListingType, PropertyCategory, RentalDetails } from "@/types/property";

/**
 * Display formatting for property data.
 * Locale and time zone are fixed so server and browser render identical text
 * (avoids React hydration mismatches).
 */

const LOCALE = "en-LK";
const TIME_ZONE = "Asia/Colombo";
const PERCHES_PER_ACRE = 160;
const EMPTY_VALUE = "—";

const wholeNumber = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const decimalNumber = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });
const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const isValidNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

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

export const FURNISHING_LABELS: Record<NonNullable<RentalDetails["furnishing"]>, string> = {
  FURNISHED: "Furnished",
  SEMI_FURNISHED: "Semi-furnished",
  UNFURNISHED: "Unfurnished",
};

/** 27000000 -> "Rs 27,000,000" */
export function formatPrice(amount: number | null | undefined): string {
  return isValidNumber(amount) ? `Rs ${wholeNumber.format(amount)}` : EMPTY_VALUE;
}

/** 380000 -> "Rs 380,000 / month" */
export function formatMonthlyRent(amount: number | null | undefined): string {
  return isValidNumber(amount) ? `${formatPrice(amount)} / month` : EMPTY_VALUE;
}

/** 1350000 -> "Rs 1,350,000 per perch" */
export function formatPricePerPerch(amount: number | null | undefined): string {
  return isValidNumber(amount) ? `${formatPrice(amount)} per perch` : EMPTY_VALUE;
}

/** 20 -> "20 perches", 1 -> "1 perch", 320 -> "2 acres (320 perches)" */
export function formatExtent(perches: number | null | undefined): string {
  if (!isValidNumber(perches) || perches <= 0) return EMPTY_VALUE;
  const perchText = `${wholeNumber.format(perches)} ${perches === 1 ? "perch" : "perches"}`;
  if (perches < PERCHES_PER_ACRE) return perchText;
  const acres = perches / PERCHES_PER_ACRE;
  return `${decimalNumber.format(acres)} ${acres === 1 ? "acre" : "acres"} (${perchText})`;
}

/** 1250 -> "1,250 sq ft" */
export function formatFloorArea(squareFeet: number | null | undefined): string {
  return isValidNumber(squareFeet) && squareFeet > 0 ? `${wholeNumber.format(squareFeet)} sq ft` : EMPTY_VALUE;
}

/** "2026-08-21T09:00:00Z" -> "21 Aug 2026" */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return EMPTY_VALUE;
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : shortDate.format(date);
}