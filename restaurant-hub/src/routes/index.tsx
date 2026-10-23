import { createFileRoute } from "@tanstack/react-router";
import App from "@/App.jsx";
import { AuthProvider } from "@/lib/auth-context.jsx";

export const Route = createFileRoute("/")({
  // The storefront keeps cart, favorites and session state in the browser.
  ssr: false,
  head: () => ({
    meta: [
      { title: "KarachiBites — Burgers, Shawarma & Pizza Delivered in Karachi" },
      {
        name: "description",
        content:
          "Order 100% Halal gourmet burgers, Lebanese shawarma, handcrafted pizzas and loaded fries from KarachiBites. Live order tracking across Karachi, 12 PM – 4 AM.",
      },
      { property: "og:title", content: "KarachiBites — Karachi's Favorite Fast Food Delivery" },
      {
        property: "og:description",
        content:
          "Browse the KarachiBites menu, build your cart and track your delivery live across Clifton, DHA, Gulshan and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
