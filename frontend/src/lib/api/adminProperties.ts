/**
 * Admin listing review API client (`/api/v1/admin/properties`, ADMIN role only).
 * Uses the signed-in session cookies and the CSRF token for write requests.
 */
import { csrfHeader, SERVER_URL } from "@/lib/auth/session";
import { SellerApiError, type ListingStatus, type SellerProperty } from "@/lib/api/sellerProperties";

const BASE = `${SERVER_URL}/api/v1/admin/properties`;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  let res: Response;
  try {
    const csrf = method === "GET" ? {} : await csrfHeader();
    res = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...csrf, ...init.headers },
    });
  } catch {
    throw new SellerApiError("Could not reach the server. Is the backend running on port 8082?", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) throw new SellerApiError("Your session has ended. Please sign in again.", 401);
    if (res.status === 403) throw new SellerApiError("You don’t have permission to review listings.", 403);
    const fieldErrors: Record<string, string> = body?.errors ?? {};
    const first = Object.values(fieldErrors)[0];
    throw new SellerApiError(first ?? body?.detail ?? `Request failed (${res.status})`, res.status, fieldErrors);
  }
  return body as T;
}

/** Listings in a status, oldest first (default: waiting for review). */
export function getListingsForReview(status: ListingStatus = "PENDING_REVIEW"): Promise<SellerProperty[]> {
  return request(`?status=${status}`);
}

export function approveListing(id: string): Promise<SellerProperty> {
  return request(`/${id}/approve`, { method: "POST" });
}

export function rejectListing(id: string, reason: string): Promise<SellerProperty> {
  return request(`/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });
}
