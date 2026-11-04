/**
 * Seller listing API client.
 *
 * Talks to the Spring Boot seller API (`/api/v1/seller/properties`).
 * Set NEXT_PUBLIC_USE_MOCK_API=true in `.env.local` to use in-memory mock data
 * instead (useful when the backend is not running).
 *
 * The seller is the signed-in user: requests send the session cookies, and write
 * requests carry the CSRF token (see `lib/auth/session.ts`).
 */
import { csrfHeader, SERVER_URL, ServerUnreachableError } from "@/lib/auth/session";

export type PropertyCategory = "LAND" | "HOUSE" | "APARTMENT" | "COMMERCIAL";
export type ListingType = "SALE" | "RENT";
export type ListingStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "SOLD";
export type Furnishing = "FURNISHED" | "SEMI_FURNISHED" | "UNFURNISHED";

/** Matches `PropertyRequest` in the backend. */
export interface SellerPropertyRequest {
  title: string;
  description?: string | null;
  category: PropertyCategory;
  listingType: ListingType;
  price: number;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  extentPerches?: number | null;
  deedType?: string | null;
  roadAccessFt?: number | null;
  facing?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floorAreaSqft?: number | null;
  floors?: number | null;
  depositAmount?: number | null;
  availableFrom?: string | null;
  furnishing?: Furnishing | null;
  features?: string[];
  imageUrls?: string[];
}

/** Matches `PropertyResponse` in the backend. */
export interface SellerProperty extends SellerPropertyRequest {
  id: string;
  referenceCode: string;
  status: ListingStatus;
  currency: string;
  pricePerPerch: number | null;
  monthlyRent: number | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  /** Set when an admin rejected the listing; cleared when it is resubmitted. */
  rejectionReason?: string | null;
  reviewedAt?: string | null;
}

/** Error returned by the API (RFC 7807 problem detail). */
export class SellerApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "SellerApiError";
  }
}

const API_BASE = `${SERVER_URL}/api/v1`;
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
const MOCK_OWNER_ID = "mock-seller";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  let res: Response;
  try {
    const csrf = method === "GET" ? {} : await csrfHeader();
    res = await fetch(`${API_BASE}/seller/properties${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrf, ...init.headers },
    });
  } catch (e) {
    if (e instanceof ServerUnreachableError || e instanceof TypeError) {
      throw new SellerApiError("Could not reach the server. Is the backend running on port 8082?", 0);
    }
    throw new SellerApiError(e instanceof Error ? e.message : "Request failed", 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) throw new SellerApiError("Your session has ended. Please sign in again.", 401);
    if (res.status === 403) throw new SellerApiError("You don’t have permission to do this. Make sure you’re signed in with a seller account, then refresh the page.", 403);
    const fieldErrors: Record<string, string> = body?.errors ?? {};
    const first = Object.entries(fieldErrors)[0];
    const message = first ? `${first[0]}: ${first[1]}` : body?.detail ?? body?.message ?? `Request failed (${res.status})`;
    throw new SellerApiError(message, res.status, fieldErrors);
  }
  return body as T;
}

// ---------------- public API ----------------

export function getMyListings(status?: ListingStatus): Promise<SellerProperty[]> {
  if (USE_MOCK) return mock.list(status);
  return request(status ? `?status=${status}` : "");
}

export function createListing(data: SellerPropertyRequest): Promise<SellerProperty> {
  if (USE_MOCK) return mock.create(data);
  return request("", { method: "POST", body: JSON.stringify(data) });
}

export function updateListing(id: string, data: SellerPropertyRequest): Promise<SellerProperty> {
  if (USE_MOCK) return mock.update(id, data);
  return request(`/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function submitForReview(id: string): Promise<SellerProperty> {
  if (USE_MOCK) return mock.submit(id);
  return request(`/${id}/submit`, { method: "POST" });
}

export function deleteListing(id: string): Promise<void> {
  if (USE_MOCK) return mock.remove(id);
  return request(`/${id}`, { method: "DELETE" });
}

/** Listings in these statuses can be edited and submitted (mirrors the backend rules). */
export const EDITABLE_STATUSES: ListingStatus[] = ["DRAFT", "REJECTED"];
/** Listings in these statuses can be deleted (mirrors the backend rules). */
export const DELETABLE_STATUSES: ListingStatus[] = ["DRAFT", "REJECTED", "PENDING_REVIEW"];

// ---------------- in-memory mock (NEXT_PUBLIC_USE_MOCK_API=true) ----------------

const mock = (() => {
  let seq = 0;
  const now = () => new Date().toISOString();
  const make = (d: SellerPropertyRequest, status: ListingStatus): SellerProperty => {
    seq += 1;
    return {
      ...d,
      id: `mock-${seq}`,
      referenceCode: `PLT-MOCK-${String(seq).padStart(4, "0")}`,
      status,
      currency: "LKR",
      pricePerPerch: d.listingType === "SALE" && d.extentPerches ? Math.round(d.price / d.extentPerches) : null,
      monthlyRent: d.listingType === "RENT" ? d.price : null,
      ownerId: MOCK_OWNER_ID,
      createdAt: now(),
      updatedAt: now(),
    };
  };
  let items: SellerProperty[] = [
    make({ title: "Beachfront land — 20 perches, Habaraduwa", category: "LAND", listingType: "SALE", price: 27000000,
      address: "Galle Road, Habaraduwa", district: "Galle", latitude: 5.99, longitude: 80.31, extentPerches: 20,
      description: "A 20-perch beachfront block with 24 ft road access and a freehold deed." }, "PUBLISHED"),
    make({ title: "3-bedroom family house in Kundasale", category: "HOUSE", listingType: "RENT", price: 185000,
      address: "Temple Road, Kundasale", district: "Kandy", latitude: 7.28, longitude: 80.68,
      bedrooms: 3, bathrooms: 2, floorAreaSqft: 1800 }, "PENDING_REVIEW"),
    make({ title: "16 perch residential block in Negombo", category: "LAND", listingType: "SALE", price: 31500000,
      address: "Beach Road, Negombo", district: "Gampaha", latitude: 7.21, longitude: 79.84, extentPerches: 16 }, "DRAFT"),
  ];
  const find = (id: string) => {
    const p = items.find((i) => i.id === id);
    if (!p) throw new SellerApiError(`Property not found: ${id}`, 404);
    return p;
  };
  const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 250));
  return {
    list: (status?: ListingStatus) => delay(items.filter((i) => !status || i.status === status)),
    create: (d: SellerPropertyRequest) => {
      const p = make(d, "DRAFT");
      items = [p, ...items];
      return delay(p);
    },
    update: (id: string, d: SellerPropertyRequest) => {
      const p = find(id);
      if (!EDITABLE_STATUSES.includes(p.status)) throw new SellerApiError("Only DRAFT or REJECTED listings can be edited", 409);
      const u = { ...make(d, "DRAFT"), id, referenceCode: p.referenceCode, createdAt: p.createdAt };
      seq -= 1;
      items = items.map((i) => (i.id === id ? u : i));
      return delay(u);
    },
    submit: (id: string) => {
      const p = find(id);
      if (!EDITABLE_STATUSES.includes(p.status)) throw new SellerApiError("Only DRAFT or REJECTED listings can be submitted", 409);
      const u = { ...p, status: "PENDING_REVIEW" as const, updatedAt: now() };
      items = items.map((i) => (i.id === id ? u : i));
      return delay(u);
    },
    remove: (id: string) => {
      const p = find(id);
      if (!DELETABLE_STATUSES.includes(p.status)) throw new SellerApiError("Published or sold listings cannot be deleted", 409);
      items = items.filter((i) => i.id !== id);
      return delay(undefined);
    },
  };
})();
