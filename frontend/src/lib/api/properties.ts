import { MOCK_PROPERTIES } from "@/lib/mock/properties";
import type { ApiError, PropertyDetails } from "@/types/property";

/**
 * Data access for property data used by the Buyer module.
 * Pages call these functions only; they never call fetch() directly.
 * Switch to the real backend with NEXT_PUBLIC_USE_MOCK_API=false.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082/api/v1";
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
const MOCK_LATENCY_MS = 300; // lets us see loading states while using mock data

/** Any failed API call. `status` is the HTTP status code. */
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

/** The property does not exist or is not published (HTTP 404). */
export class PropertyNotFoundError extends ApiRequestError {
  constructor(propertyId: string) {
    super(404, `Property "${propertyId}" was not found.`);
    this.name = "PropertyNotFoundError";
  }
}

/**
 * Returns one published property.
 * @throws PropertyNotFoundError when it does not exist or is not public.
 * @throws ApiRequestError for any other failed request.
 */
export async function getPropertyById(id: string): Promise<PropertyDetails> {
  const propertyId = id.trim();
  if (!propertyId) {
    throw new PropertyNotFoundError(id);
  }
  return USE_MOCK_API ? getMockProperty(propertyId) : fetchProperty(propertyId);
}

async function getMockProperty(propertyId: string): Promise<PropertyDetails> {
  await delay(MOCK_LATENCY_MS);
  const property = MOCK_PROPERTIES.find((item) => item.id === propertyId && item.status === "PUBLISHED");
  if (!property) {
    throw new PropertyNotFoundError(propertyId);
  }
  // Return a copy so callers can never modify the shared mock list.
  return structuredClone(property);
}

async function fetchProperty(propertyId: string): Promise<PropertyDetails> {
  const response = await fetch(`${API_BASE_URL}/properties/${encodeURIComponent(propertyId)}`, {
    headers: { Accept: "application/json" },
  });

  if (response.status === 404) {
    throw new PropertyNotFoundError(propertyId);
  }
  if (!response.ok) {
    throw new ApiRequestError(response.status, await readErrorMessage(response));
  }
  return (await response.json()) as PropertyDetails;
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}.`;
  try {
    const body = (await response.json()) as Partial<ApiError>;
    return body.message ?? fallback;
  } catch {
    return fallback; // body was empty or not JSON
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}