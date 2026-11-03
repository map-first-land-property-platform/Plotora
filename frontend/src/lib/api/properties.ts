import type {
  BuildingDetails,
  Furnishing,
  LandDetails,
  ListingType,
  PropertyCategory,
  PropertyDetails,
  PropertyImage,
  RentalDetails,
} from "@/types/property";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082/api/v1"
).replace(/\/$/, "");
const PROPERTY_API_URL = `${API_BASE_URL}/properties`;

/** An unsuccessful HTTP response from the backend. */
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export class PropertyNotFoundError extends ApiRequestError {
  constructor(propertyId: string) {
    super(404, `Property "${propertyId}" was not found.`);
    this.name = "PropertyNotFoundError";
  }
}

/** The request failed before an HTTP response was received. */
export class ApiNetworkError extends Error {
  constructor(cause: unknown) {
    super("Unable to reach the property service. Please try again.", { cause });
    this.name = "ApiNetworkError";
  }
}

export class ApiResponseError extends Error {
  constructor(cause?: unknown) {
    super("The property service returned an unreadable or unexpected response.", {
      cause,
    });
    this.name = "ApiResponseError";
  }
}

interface PublicPropertyDto {
  id: string;
  referenceCode: string;
  title: string;
  description: string | null;
  category: PropertyCategory;
  listingType: ListingType;
  status: "PUBLISHED";
  price: number;
  currency: "LKR";
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  extentPerches: number | null;
  pricePerPerch: number | null;
  deedType: string | null;
  roadAccessFt: number | null;
  facing: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floorAreaSqft: number | null;
  floors: number | null;
  monthlyRent: number | null;
  depositAmount: number | null;
  availableFrom: string | null;
  furnishing: Furnishing | null;
  features: string[];
  images: { url: string; alt: string | null; order: number }[];
  createdAt: string;
}

export async function getPublishedProperties(): Promise<PropertyDetails[]> {
  const body = await requestJson(PROPERTY_API_URL);

  if (!Array.isArray(body)) {
    throw new ApiResponseError();
  }

  return body.map(parsePublishedProperty);
}

export async function getPropertyById(id: string): Promise<PropertyDetails> {
  const propertyId = id.trim();

  if (!propertyId) {
    throw new PropertyNotFoundError(id);
  }

  return parsePublishedProperty(
    await requestJson(`${PROPERTY_API_URL}/${encodeURIComponent(propertyId)}`, propertyId),
  );
}

async function requestJson(url: string, propertyId?: string): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch (cause) {
    throw new ApiNetworkError(cause);
  }

  if (response.status === 404 && propertyId) {
    throw new PropertyNotFoundError(propertyId);
  }

  if (!response.ok) {
    throw new ApiRequestError(response.status, await readErrorMessage(response));
  }

  try {
    return await response.json();
  } catch (cause) {
    throw new ApiResponseError(cause);
  }
}

function parsePublishedProperty(value: unknown): PropertyDetails {
  if (!isRecord(value) || !isPublicPropertyDto(value)) {
    throw new ApiResponseError();
  }

  const dto = value;

  const landDetails: LandDetails | null =
    typeof dto.extentPerches === "number"
      ? {
          extentPerches: dto.extentPerches,
          pricePerPerch: nullableNumber(dto.pricePerPerch),
          deedType: nullableString(dto.deedType),
          roadAccessFt: nullableNumber(dto.roadAccessFt),
          facing: nullableString(dto.facing),
        }
      : null;

  const hasBuildingDetails =
    dto.bedrooms != null ||
    dto.bathrooms != null ||
    dto.floorAreaSqft != null ||
    dto.floors != null;
  const buildingDetails: BuildingDetails | null = hasBuildingDetails
    ? {
        bedrooms: nullableNumber(dto.bedrooms),
        bathrooms: nullableNumber(dto.bathrooms),
        floorAreaSqft: nullableNumber(dto.floorAreaSqft),
        floors: nullableNumber(dto.floors),
      }
    : null;

  const rentalDetails: RentalDetails | null =
    dto.listingType === "RENT"
      ? {
          monthlyRent: nullableNumber(dto.monthlyRent) ?? dto.price,
          depositAmount: nullableNumber(dto.depositAmount),
          availableFrom: nullableString(dto.availableFrom),
          furnishing: dto.furnishing ?? null,
        }
      : null;

  const images: PropertyImage[] = dto.images.map((image, index) => ({
    url: image.url,
    alt: image.alt?.trim() || dto.title,
    order: Number.isInteger(image.order) ? image.order : index,
  }));

  return {
    id: dto.id,
    referenceCode: dto.referenceCode,
    title: dto.title,
    description: dto.description ?? "",
    category: dto.category,
    listingType: dto.listingType,
    status: "PUBLISHED",
    price: dto.price,
    currency: "LKR",
    location: {
      address: dto.address,
      district: dto.district,
      latitude: dto.latitude,
      longitude: dto.longitude,
    },
    landDetails,
    buildingDetails,
    rentalDetails,
    features: dto.features,
    images,
    createdAt: dto.createdAt,
  };
}

function isPublicPropertyDto(value: Record<string, unknown>): value is Record<string, unknown> & PublicPropertyDto {
  return (
    typeof value.id === "string" &&
    typeof value.referenceCode === "string" &&
    typeof value.title === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    isOneOf(value.category, ["LAND", "HOUSE", "APARTMENT", "COMMERCIAL"] as const) &&
    isOneOf(value.listingType, ["SALE", "RENT"] as const) &&
    value.status === "PUBLISHED" &&
    isFiniteNumber(value.price) &&
    value.currency === "LKR" &&
    typeof value.address === "string" &&
    typeof value.district === "string" &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    isNullableNumber(value.extentPerches) &&
    isNullableNumber(value.pricePerPerch) &&
    isNullableString(value.deedType) &&
    isNullableNumber(value.roadAccessFt) &&
    isNullableString(value.facing) &&
    isNullableNumber(value.bedrooms) &&
    isNullableNumber(value.bathrooms) &&
    isNullableNumber(value.floorAreaSqft) &&
    isNullableNumber(value.floors) &&
    isNullableNumber(value.monthlyRent) &&
    isNullableNumber(value.depositAmount) &&
    isNullableString(value.availableFrom) &&
    (value.furnishing === null || isOneOf(value.furnishing, ["FURNISHED", "SEMI_FURNISHED", "UNFURNISHED"] as const)) &&
    Array.isArray(value.features) && value.features.every((feature) => typeof feature === "string") &&
    Array.isArray(value.images) && value.images.every(isPublicImage) &&
    typeof value.createdAt === "string"
  );
}

function isPublicImage(value: unknown): value is PublicPropertyDto["images"][number] {
  return (
    isRecord(value) &&
    typeof value.url === "string" &&
    (typeof value.alt === "string" || value.alt === null) &&
    Number.isInteger(value.order)
  );
}

function isOneOf<const T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === "string" && options.includes(value as T);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || isFiniteNumber(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}.`;

  try {
    const body: unknown = await response.json();
    if (isRecord(body) && typeof body.detail === "string" && body.detail.trim()) {
      return body.detail.trim();
    }
    if (isRecord(body) && typeof body.message === "string" && body.message.trim()) {
      return body.message.trim();
    }
  } catch {
    return fallback;
  }

  return fallback;
}
