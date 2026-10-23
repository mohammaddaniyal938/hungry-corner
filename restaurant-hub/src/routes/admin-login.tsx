import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context.jsx";
import ThemeToggle from "@/components/ThemeToggle";

export const Route = createFileRoute("/admin-login")({
  ssr: false,
  component: () => (
    <AuthProvider>
      <AdminLoginPage />
    </AuthProvider>
  ),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (!auth.loading && auth.user) {
      if (auth.isAdmin) {
        navigate({ to: "/admin", replace: true });
      } else {
        setMessage({
          kind: "error",
          text: "This account is not authorized for the admin dashboard.",
        });
      }
    }
  }, [auth.loading, auth.user, auth.isAdmin, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      setBusy(false);
      setMessage({
        kind: "error",
        text: "Enter a valid admin email and password.",
      });
      return;
    }

    const result = await auth.signInWithPassword(trimmedEmail, password);
    const error = result?.error;
    const data = result?.data;

    if (error) {
      setBusy(false);
      setMessage({
        kind: "error",
        text: error?.message || "Invalid admin email or password.",
      });
      return;
    }

    const user = data?.user || auth.user;
    const role = user?.role;
    if (role !== "admin" && role !== "restaurant_admin") {
      await auth.signOut();
      setBusy(false);
      setMessage({
        kind: "error",
        text: "This account does not have administrator access. Please sign in with an admin account (e.g. admin@karachibites.com).",
      });
      return;
    }

    setBusy(false);
    navigate({ to: "/admin", replace: true });
  };

  return (
    <div className="min-h-screen bg-[#171513] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-[#4A3A2B] bg-[#2A211B] p-6 shadow-[0_30px_80px_rgba(28,23,21,0.08)] sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4A017] text-2xl shadow-lg shadow-[#D4A017]/25">
              <Store className="h-5 w-5 text-[#171513]" aria-hidden="true" />
            </div>
            <div>
              <p className="font-display text-2xl font-extrabold text-[#F5EBDD]">
                Karachi<span className="text-[#D4A017]">Bites</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4A017]">
                Admin Access
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/" className="text-xs font-bold text-[#C19A6B] hover:text-[#F5EBDD]">
              Storefront
            </Link>
          </div>
        </div>

        <h1 className="mt-6 font-display text-3xl font-extrabold text-[#F5EBDD]">Admin Login</h1>
        <p className="mt-2 text-sm text-[#C19A6B]">
          Sign in with the authorized administrator account to manage orders, menu, and kitchen ops.
        </p>

        {message && (
          <div
            className={`mt-4 rounded-xl border px-3 py-2 text-sm font-medium ${
              message.kind === "error"
                ? "border-red-500/30 bg-red-950/40 text-red-300"
                : "border-green-500/30 bg-green-950/40 text-green-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#C19A6B]"
            >
              Admin Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#4A3A2B] bg-[#171513] px-4 py-3 text-sm text-[#F5EBDD] outline-none transition focus:border-[#D4A017]"
              placeholder="admin@karachibites.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#C19A6B]"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#4A3A2B] bg-[#171513] px-4 py-3 text-sm text-[#F5EBDD] outline-none transition focus:border-[#D4A017]"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#D4A017] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#B98B12] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {busy ? "Signing in..." : "Access Dashboard"}
          </button>
        </form>

        <div className="mt-6 p-3 rounded-xl bg-[#171513]/60 border border-[#4A3A2B]/60 text-xs text-[#C19A6B]">
          <p className="font-semibold text-[#F5EBDD] mb-1">Default Admin Logins:</p>
          <p>
            Super Admin: <span className="font-mono text-[#D4A017]">admin@karachibites.com</span> /{" "}
            <span className="font-mono text-[#D4A017]">Admin@12345</span>
          </p>
          <p>
            Restaurant Admin:{" "}
            <span className="font-mono text-[#D4A017]">owner1@karachibites.com</span> /{" "}
            <span className="font-mono text-[#D4A017]">Restaurant@123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
