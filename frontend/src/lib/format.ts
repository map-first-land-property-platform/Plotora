import type {
  ListingType,
  PropertyCategory,
  RentalDetails,
} from "@/types/property";

/**
 * Shared display formatting for property data.
 * Use consistent locale and time-zone settings to reduce differences
 * between server-rendered and browser-rendered content.
 */

const LOCALE = "en-LK";
const TIME_ZONE = "Asia/Colombo";
const PERCHES_PER_ACRE = 160;
const EMPTY_VALUE = "—";

const wholeNumber = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
});

const decimalNumber = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 2,
});

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

/**
 * Reject missing values, NaN and Infinity before formatting.
 * The type predicate also narrows valid values to number.
 */
const isValidNumber = (
  value: number | null | undefined,
): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** User-facing labels for property categories. */
export const CATEGORY_LABELS: Record<PropertyCategory, string> = {
  LAND: "Land",
  HOUSE: "House",
  APARTMENT: "Apartment",
  COMMERCIAL: "Commercial",
};

/** User-facing labels for listing types. */
export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  SALE: "For sale",
  RENT: "For rent",
};

/** User-facing labels for rental furnishing options. */
export const FURNISHING_LABELS: Record<
  NonNullable<RentalDetails["furnishing"]>,
  string
> = {
  FURNISHED: "Furnished",
  SEMI_FURNISHED: "Semi-furnished",
  UNFURNISHED: "Unfurnished",
};

/**
 * Formats a price in Sri Lankan rupees for display.
 * Example: 27000000 -> "Rs 27,000,000"
 */
export function formatPrice(
  amount: number | null | undefined,
): string {
  return isValidNumber(amount)
    ? `Rs ${wholeNumber.format(amount)}`
    : EMPTY_VALUE;
}

/**
 * Formats a monthly rental amount.
 * Example: 380000 -> "Rs 380,000 / month"
 */
export function formatMonthlyRent(
  amount: number | null | undefined,
): string {
  return isValidNumber(amount)
    ? `${formatPrice(amount)} / month`
    : EMPTY_VALUE;
}

/**
 * Formats the price per perch.
 * Example: 1350000 -> "Rs 1,350,000 per perch"
 */
export function formatPricePerPerch(
  amount: number | null | undefined,
): string {
  return isValidNumber(amount)
    ? `${formatPrice(amount)} per perch`
    : EMPTY_VALUE;
}

/**
 * Formats land extent in perches, adding acres for larger properties.
 * Fractional perch values are displayed with up to two decimal places.
 *
 * Examples:
 * 1 -> "1 perch"
 * 12.6 -> "12.6 perches"
 * 20.5 -> "20.5 perches"
 * 160 -> "1 acre (160 perches)"
 * 320 -> "2 acres (320 perches)"
 */
export function formatExtent(
  perches: number | null | undefined,
): string {
  if (!isValidNumber(perches) || perches <= 0) {
    return EMPTY_VALUE;
  }

  // Preserve fractional measurements instead of rounding to whole perches.
  const perchText = `${decimalNumber.format(perches)} ${
    perches === 1 ? "perch" : "perches"
  }`;

  if (perches < PERCHES_PER_ACRE) {
    return perchText;
  }

  const acres = perches / PERCHES_PER_ACRE;

  return `${decimalNumber.format(acres)} ${
    acres === 1 ? "acre" : "acres"
  } (${perchText})`;
}

/**
 * Formats building floor area in square feet.
 * Example: 1250 -> "1,250 sq ft"
 */
export function formatFloorArea(
  squareFeet: number | null | undefined,
): string {
  if (!isValidNumber(squareFeet) || squareFeet <= 0) {
    return EMPTY_VALUE;
  }

  return `${wholeNumber.format(squareFeet)} sq ft`;
}

/**
 * Formats an ISO date or timestamp using Sri Lanka's time zone.
 * Missing or unparseable values display a placeholder.
 *
 * Example: "2026-08-21T09:00:00Z" -> "21 Aug 2026"
 */
export function formatDate(
  isoDate: string | null | undefined,
): string {
  if (!isoDate) {
    return EMPTY_VALUE;
  }

  const date = new Date(isoDate);

  return Number.isNaN(date.getTime())
    ? EMPTY_VALUE
    : shortDate.format(date);
}