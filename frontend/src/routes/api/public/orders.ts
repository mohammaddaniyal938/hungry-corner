import { createFileRoute } from "@tanstack/react-router";
import { backendFetch, json, preflight } from "@/lib/api-helpers.server";

/**
 * GET  /api/public/orders — order history
 * POST /api/public/orders — place an order
 */
export const Route = createFileRoute("/api/public/orders")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization");
          const res = await backendFetch("/orders/my-orders", {
            headers: auth ? { Authorization: auth } : {},
          });
          const data = (await res.json()) as { data?: unknown[] };
          return json({ items: data?.data ?? [] }, res.status);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Internal error";
          return json({ error: "Could not load orders", message }, 500);
        }
      },
      POST: async ({ request }) => {
        try {
          const body: unknown = await request.json();
          const auth = request.headers.get("authorization");
          const res = await backendFetch("/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(auth ? { Authorization: auth } : {}),
            },
            body: JSON.stringify(body),
          });
          const data = (await res.json()) as unknown;
          return json(data, res.status);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Internal error";
          return json({ error: "Could not place the order", message }, 500);
        }
      },
    },
  },
});
