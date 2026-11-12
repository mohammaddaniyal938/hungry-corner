import { createFileRoute } from "@tanstack/react-router";
import { backendFetch, json, preflight } from "@/lib/api-helpers.server";

interface RestaurantItem {
  _id?: string;
  name?: string;
}

/** GET /api/public/categories — active food categories. */
export const Route = createFileRoute("/api/public/categories")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        try {
          const res = await backendFetch("/restaurants");
          if (!res.ok) throw new Error("Failed to load restaurants");
          const data = (await res.json()) as { data?: RestaurantItem[] };
          const restaurants = data?.data || [];
          const kb =
            restaurants.find((r) => r.name?.toLowerCase().includes("karachi bites")) ||
            restaurants[0];

          if (kb?._id) {
            const catRes = await backendFetch(`/restaurants/${kb._id}/categories`);
            const catData = (await catRes.json()) as { data?: unknown[] };
            return json({ items: catData?.data ?? [] });
          }
          return json({ items: [] });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Internal error";
          return json({ error: "Could not load categories", message }, 500);
        }
      },
    },
  },
});
