import { createFileRoute } from "@tanstack/react-router";
import { backendFetch, json, preflight } from "@/lib/api-helpers.server";

/** GET /api/public/orders/:orderId — order tracking */
export const Route = createFileRoute("/api/public/orders/$orderId")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request, params }) => {
        try {
          const auth = request.headers.get("authorization");
          const res = await backendFetch(`/orders/${params.orderId}`, {
            headers: auth ? { Authorization: auth } : {},
          });
          const data = (await res.json()) as unknown;
          return json(data, res.status);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Internal error";
          return json({ error: "Could not load order", message }, 500);
        }
      },
      PATCH: async ({ request, params }) => {
        try {
          const body: unknown = await request.json();
          const auth = request.headers.get("authorization");
          const res = await backendFetch(`/orders/${params.orderId}/status`, {
            method: "PATCH",
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
          return json({ error: "Could not update order status", message }, 500);
        }
      },
    },
  },
});
