const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  let csrfHeader: Record<string, string> = {};
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfResponse = await fetch(`${API_URL}/api/auth/csrf`, { credentials: "include" });
    if (!csrfResponse.ok) throw new ApiError(csrfResponse.status, "Could not start a secure session");
    const csrfBody = (await csrfResponse.json()) as { token: string };
    csrfHeader = { "X-XSRF-TOKEN": csrfBody.token };
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include", // sends and receives the HttpOnly cookies
    headers: { "Content-Type": "application/json", ...csrfHeader, ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    let body: { message?: string; fieldErrors?: Record<string, string> } | null = null;
    try {
      body = await res.json();
    } catch {
      /* no JSON body */
    }
    throw new ApiError(res.status, body?.message ?? "Something went wrong", body?.fieldErrors ?? {});
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
