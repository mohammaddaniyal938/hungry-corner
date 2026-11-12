import { createServerFn } from "@tanstack/react-start";
import { backendFetch } from "@/lib/api-helpers.server";

/**
 * Admin: set or change role for a user
 */
export const setUserRole = createServerFn({ method: "POST" })
  .validator(
    (input: { userId: string; role: "admin" | "restaurant_admin" | "customer"; token: string }) => {
      return input;
    },
  )
  .handler(async ({ data }) => {
    const res = await backendFetch(`/admin/users/${data.userId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.token}`,
      },
      body: JSON.stringify({ role: data.role }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to update role");
    }

    return { ok: true, action: "granted" as const };
  });
