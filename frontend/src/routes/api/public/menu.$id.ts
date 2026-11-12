import { createFileRoute } from "@tanstack/react-router";
import { backendFetch, json, preflight } from "@/lib/api-helpers.server";

/** GET /api/public/menu/:id — single dish. */
export const Route = createFileRoute("/api/public/menu/$id")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ params }) => {
        try {
          const res = await backendFetch(`/menu/${params.id}`);
          if (!res.ok) {
            return json({ error: "Dish not found" }, res.status);
          }
          const data = (await res.json()) as { data?: unknown };
          return json({ item: data?.data ?? null, reviews: [] });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Internal error";
          return json({ error: "Could not load this dish", message }, 500);
        }
      },
    },
  },
});
