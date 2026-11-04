/**
 * Signed-in user for the seller pages, using the Authentication module's
 * cookie-based session (`/api/auth/*`).
 *
 * Requests send the HttpOnly session cookies (`credentials: "include"`), and every
 * write request carries the CSRF token from `/api/auth/csrf`, as `lib/api.ts` does.
 */

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
}

export const SERVER_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082").replace(/\/$/, "");
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

const MOCK_SELLER: SessionUser = {
  id: "mock-seller",
  fullName: "Demo Seller",
  email: "seller@plotora.local",
  roles: ["SELLER"],
};

export class ServerUnreachableError extends Error {
  constructor() {
    super("Could not reach the server. Is the backend running on port 8082?");
    this.name = "ServerUnreachableError";
  }
}

async function send(url: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, { ...init, credentials: "include" });
  } catch {
    throw new ServerUnreachableError();
  }
}

/** CSRF header required by the backend for POST, PUT, PATCH and DELETE requests. */
export async function csrfHeader(): Promise<Record<string, string>> {
  const res = await send(`${SERVER_URL}/api/auth/csrf`);
  if (!res.ok) throw new Error("Could not start a secure session. Please refresh the page.");
  const body = (await res.json()) as { token: string };
  return { "X-XSRF-TOKEN": body.token };
}

/**
 * The signed-in user, or `null` when nobody is signed in.
 * An expired access cookie (15 minutes) is renewed once with the refresh cookie.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (USE_MOCK) return MOCK_SELLER;
  const me = await send(`${SERVER_URL}/api/auth/me`);
  if (me.ok) return (await me.json()) as SessionUser;
  if (me.status !== 401) throw new Error(`Could not check your sign-in (${me.status}).`);

  const refreshed = await send(`${SERVER_URL}/api/auth/refresh`, { method: "POST", headers: await csrfHeader() });
  return refreshed.ok ? ((await refreshed.json()) as SessionUser) : null;
}

export async function signOut(): Promise<void> {
  if (USE_MOCK) return;
  await send(`${SERVER_URL}/api/auth/logout`, { method: "POST", headers: await csrfHeader() });
}

/** "Ruwan Silva" → "RS" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** "Ruwan Silva" → "Ruwan" */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** Time-of-day greeting in Sri Lanka time. */
export function greeting(date: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Colombo" }).format(date),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
