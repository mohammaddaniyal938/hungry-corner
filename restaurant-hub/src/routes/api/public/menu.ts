import { createFileRoute } from "@tanstack/react-router";
import { backendFetch, json, preflight } from "@/lib/api-helpers.server";

interface RestaurantItem {
  _id?: string;
  name?: string;
}

/** GET /api/public/menu — public menu listing with optional filters. */
export const Route = createFileRoute("/api/public/menu")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "";

        try {
          const restRes = await backendFetch("/restaurants");
          const restData = (await restRes.json()) as { data?: RestaurantItem[] };
          const restaurants = restData?.data || [];
          const kb =
            restaurants.find((r) => r.name?.toLowerCase().includes("karachi bites")) ||
            restaurants[0];

          if (kb?._id) {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (category && category !== "All") params.set("category", category);
            params.set("limit", "100");

            const menuRes = await backendFetch(`/restaurants/${kb._id}/menu?${params.toString()}`);
            const menuData = (await menuRes.json()) as { data?: unknown[] };
            return json({ items: menuData?.data ?? [] });
          }
          return json({ items: [] });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Internal error";
          return json({ error: "Could not load the menu", message }, 500);
        }
      },
    },
  },
});
