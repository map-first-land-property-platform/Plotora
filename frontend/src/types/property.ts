/**
 * Property data shapes used by the Buyer module.
 * Mirrors the agreed API contract for GET /api/v1/properties/{id}.
 */

export type PropertyCategory = "LAND" | "HOUSE" | "APARTMENT" | "COMMERCIAL";

export type ListingType = "SALE" | "RENT";

export type ListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "SOLD";

export interface PropertyLocation {
  address: string;
  district: string;
  latitude: number;
  longitude: number;
}

/** Only for LAND (and the land part of houses). Null when not relevant. */
export interface LandDetails {
  extentPerches: number;
  pricePerPerch: number | null;
  deedType: string | null;
  roadAccessFt: number | null;
  facing: string | null;
}

/** Only for HOUSE / APARTMENT / COMMERCIAL. Null for LAND. */
export interface BuildingDetails {
  bedrooms: number | null;
  bathrooms: number | null;
  floorAreaSqft: number | null;
  floors: number | null;
}

/** Only when listingType is RENT (client requirement BR-09). */
export interface RentalDetails {
  monthlyRent: number;
  depositAmount: number | null;
  availableFrom: string | null; // ISO date, e.g. "2026-11-01"
  furnishing: "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED" | null;
}

export interface PropertyImage {
  url: string;
  alt: string;
  order: number;
}

/** Public seller info only: never email or phone here (privacy rule). */
export interface PropertyOwner {
  name: string;
  verified: boolean;
}

/** Full data for the Property Details page. */
export interface PropertyDetails {
  id: string;
  referenceCode: string;
  title: string;
  description: string;
  category: PropertyCategory;
  listingType: ListingType;
  status: ListingStatus;
  price: number;
  currency: "LKR";
  location: PropertyLocation;
  landDetails: LandDetails | null;
  buildingDetails: BuildingDetails | null;
  rentalDetails: RentalDetails | null;
  features: string[];
  images: PropertyImage[];
  owner: PropertyOwner;
  createdAt: string; // ISO date-time
}

/** Short version for cards and lists (dashboard, search results). */
export type PropertySummary = Pick<
  PropertyDetails,
  "id" | "title" | "category" | "listingType" | "price" | "currency"
> & {
  address: string;
  coverImage: PropertyImage | null;
  extentPerches: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
};

/** Error body returned by the backend (e.g. 404). */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  path?: string;
  timestamp?: string;
}