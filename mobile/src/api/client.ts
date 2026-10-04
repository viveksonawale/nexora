import { API_URL, REQUEST_TIMEOUT_MS } from "@/config/env";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
  get isNetwork() { return this.code === "NETWORK"; }
}

let getToken: () => Promise<string | null> = async () => null;
let onUnauthorized: () => void = () => {};

/** Called once by AuthProvider so the client can attach tokens and react to expired sessions. */
export function configureClient(opts: { getToken: () => Promise<string | null>; onUnauthorized: () => void }) {
  getToken = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
}

interface Options { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown; query?: Record<string, string | undefined>; auth?: boolean }

export async function request<T>(path: string, { method = "GET", body, query, auth = true }: Options = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, "EXPO_PUBLIC_API_URL is not set. See .env.example.", "NO_CONFIG");
  const qs = query ? Object.entries(query).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join("&") : "";
  const url = `${API_URL}${path}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? await getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctrl.signal });
  } catch {
    throw new ApiError(0, "Can't reach Nexora. Check your connection and try again.", "NETWORK");
  } finally {
    clearTimeout(timer);
  }

  let data: unknown = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; code?: string };
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, d.error ?? `Request failed (${res.status})`, d.code);
  }
  return data as T;
}
