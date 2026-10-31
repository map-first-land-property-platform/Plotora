import { MOCK_PROPERTIES } from "@/lib/mock/properties";
import type { PropertyDetails } from "@/types/property";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8082/api/v1";

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
const MOCK_LATENCY_MS = 300;

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
    super("Unable to reach the property service. Please try again.", {
      cause,
    });
    this.name = "ApiNetworkError";
  }
}

export class ApiResponseError extends Error {
  constructor(cause?: unknown) {
    super(
      "The property service returned an unreadable or unexpected response.",
      { cause },
    );
    this.name = "ApiResponseError";
  }
}

export async function getPropertyById(
  id: string,
): Promise<PropertyDetails> {
  const propertyId = id.trim();

  if (!propertyId) {
    throw new PropertyNotFoundError(id);
  }

  return USE_MOCK_API
    ? getMockProperty(propertyId)
    : fetchProperty(propertyId);
}

async function getMockProperty(
  propertyId: string,
): Promise<PropertyDetails> {
  await delay(MOCK_LATENCY_MS);

  const property = MOCK_PROPERTIES.find(
    (item) => item.id === propertyId && item.status === "PUBLISHED",
  );

  if (!property) {
    throw new PropertyNotFoundError(propertyId);
  }

  // Prevent callers from changing the shared mock fixtures.
  return structuredClone(property);
}

async function fetchProperty(
  propertyId: string,
): Promise<PropertyDetails> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/properties/${encodeURIComponent(propertyId)}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
  } catch (cause) {
    throw new ApiNetworkError(cause);
  }

  if (response.status === 404) {
    throw new PropertyNotFoundError(propertyId);
  }

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      await readErrorMessage(response),
    );
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch (cause) {
    throw new ApiResponseError(cause);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    throw new ApiResponseError();
  }

  // Field-level validation will follow the agreed property API contract.
  return body as PropertyDetails;
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed with status ${response.status}.`;

  try {
    const body: unknown = await response.json();

    if (
      typeof body === "object" &&
      body !== null &&
      !Array.isArray(body) &&
      "message" in body &&
      typeof body.message === "string" &&
      body.message.trim().length > 0
    ) {
      return body.message.trim();
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}