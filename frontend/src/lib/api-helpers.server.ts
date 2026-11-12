/**
 * Server-side API helpers proxying to the Express REST API backend.
 */

const BACKEND_URL =
  process.env["VITE_API_URL"] || process.env["API_URL"] || "http://localhost:5000/api";

export async function backendFetch(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BACKEND_URL.replace(/\/+$/, "")}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  return fetch(url, options);
}

/** Validates the request bearer token with the backend */
export async function authenticateRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return { user: null } as const;

  try {
    const res = await backendFetch("/users/me", {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) return { user: null } as const;
    const json = await res.json();
    return { user: json?.data?.user || null } as const;
  } catch {
    return { user: null } as const;
  }
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...CORS_HEADERS },
  });
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
