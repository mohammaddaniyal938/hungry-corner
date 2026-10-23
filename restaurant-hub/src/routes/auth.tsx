import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Utensils } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context.jsx";

type AuthSearch = {
  redirect?: string | undefined;
  error?: string | undefined;
  error_description?: string | undefined;
};
type AuthError = { message: string } | null;
type AuthState = {
  loading: boolean;
  user: { id: string } | null;
  resetPassword: (email: string) => Promise<{ error: AuthError }>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName: string,
    phone: string,
    redirectTo: string,
  ) => Promise<{ error: AuthError; needsConfirmation: boolean }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthError }>;
  signInWithGoogle: (redirectTo: string) => Promise<{ error: AuthError; redirected: boolean }>;
};

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
    error: typeof search["error"] === "string" ? (search["error"] as string) : undefined,
    error_description:
      typeof search["error_description"] === "string"
        ? (search["error_description"] as string)
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — KarachiBites" },
      {
        name: "description",
        content:
          "Sign in or create your KarachiBites account to save your cart, track live orders and reorder your favourite bites.",
      },
      { property: "og:title", content: "Sign in — KarachiBites" },
      {
        property: "og:description",
        content:
          "Create a KarachiBites account to save favourites, track orders and check out faster.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  ),
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" }) as AuthSearch;
  const auth = useAuth() as AuthState;

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  const safeRedirect = getSafeRedirect(search.redirect);

  useEffect(() => {
    if (search.error || search.error_description) {
      setMessage({
        kind: "error",
        text: search.error_description || "Authentication was cancelled or could not be completed.",
      });
    }
  }, [search.error, search.error_description]);

  useEffect(() => {
    if (!auth.loading && auth.user) {
      navigate({ to: safeRedirect, replace: true });
    }
  }, [auth.loading, auth.user, safeRedirect, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      if (mode === "forgot") {
        const { error } = await auth.resetPassword(email.trim());
        setMessage(
          error
            ? { kind: "error", text: error.message }
            : { kind: "info", text: "Password reset link sent. Check your inbox." },
        );
        return;
      }

      if (!email.trim() || password.length < 6) {
        setMessage({
          kind: "error",
          text: "Enter a valid email and a password of at least 6 characters.",
        });
        return;
      }

      if (mode === "signup") {
        const { error, needsConfirmation } = await auth.signUpWithPassword(
          email.trim(),
          password,
          fullName.trim(),
          phone.trim(),
          safeRedirect,
        );
        if (error) {
          setMessage({ kind: "error", text: error.message });
        } else if (needsConfirmation) {
          setMessage({
            kind: "info",
            text: "Account created! Check your email and click the confirmation link to finish signing in.",
          });
        }
        return;
      }

      const { error } = await auth.signInWithPassword(email.trim(), password);
      setBusy(false);
      if (error) setMessage({ kind: "error", text: error.message });
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Authentication failed. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { error, redirected } = await auth.signInWithGoogle(safeRedirect);
      if (error) {
        setMessage({ kind: "error", text: error.message });
      } else if (!redirected) {
        setMessage({
          kind: "error",
          text: "Google sign-in could not be started. Please try again.",
        });
      }
    } catch (error) {
      setMessage({
        kind: "error",
        text: error instanceof Error ? error.message : "Google sign-in failed. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171513] text-[#F5EBDD] flex flex-col items-center justify-center px-4 py-6 sm:py-8 overflow-y-auto">
      <Link to="/" className="flex items-center gap-2 mb-4 group">
        <span className="w-10 h-10 rounded-2xl bg-[#D4A017] flex items-center justify-center text-xl shadow-lg shadow-[#D4A017]/30 group-hover:scale-105 transition-transform">
          <Utensils className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="font-display font-extrabold text-2xl tracking-tight text-white">
          Karachi<span className="text-[#D4A017]">Bites</span>
        </span>
      </Link>

      <div className="w-full max-w-md bg-[#2A211B] rounded-[24px] shadow-2xl border border-[#4A3A2B] p-5 sm:p-7">
        <h1 className="font-display font-extrabold text-2xl text-[#F5EBDD]">
          {mode === "signin" && "Welcome back"}
          {mode === "signup" && "Create your account"}
          {mode === "forgot" && "Reset your password"}
        </h1>
        <p className="text-xs sm:text-sm text-[#C19A6B] mt-1">
          {mode === "forgot"
            ? "We'll email you a secure link to set a new password."
            : "Save favourites, track live orders and check out in seconds."}
        </p>

        {message && (
          <div
            className={`mt-4 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium ${
              message.kind === "error"
                ? "bg-red-950/50 text-red-300 border border-red-500/30"
                : "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {mode === "signup" && (
            <>
              <input
                className="w-full rounded-xl border border-[#4A3A2B] bg-[#171513] px-3.5 py-2.5 text-sm text-[#F5EBDD] placeholder-[#A89078] outline-none transition focus:border-[#D4A017]"
                placeholder="Full name"
                value={fullName}
                maxLength={80}
                onChange={(e) => setFullName(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-[#4A3A2B] bg-[#171513] px-3.5 py-2.5 text-sm text-[#F5EBDD] placeholder-[#A89078] outline-none transition focus:border-[#D4A017]"
                placeholder="Phone (03xx xxxxxxx)"
                value={phone}
                maxLength={20}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          <input
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-[#4A3A2B] bg-[#171513] px-3.5 py-2.5 text-sm text-[#F5EBDD] placeholder-[#A89078] outline-none transition focus:border-[#D4A017]"
            placeholder="Email address"
            value={email}
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
          />

          {mode !== "forgot" && (
            <input
              type="password"
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-[#4A3A2B] bg-[#171513] px-3.5 py-2.5 text-sm text-[#F5EBDD] placeholder-[#A89078] outline-none transition focus:border-[#D4A017]"
              placeholder="Password"
              value={password}
              maxLength={72}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#D4A017] hover:bg-[#B98B12] disabled:opacity-60 text-white font-bold text-sm py-2.5 transition-all shadow-lg shadow-[#D4A017]/25 active:scale-95 cursor-pointer"
          >
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>
        </form>

        {mode !== "forgot" && (
          <>
            <div className="flex items-center gap-3 my-4">
              <span className="h-px flex-1 bg-[#4A3A2B]" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#C19A6B]">
                or
              </span>
              <span className="h-px flex-1 bg-[#4A3A2B]" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="w-full rounded-xl border border-[#4A3A2B] bg-[#171513] hover:bg-[#3B3020] text-[#F5EBDD] font-bold text-sm py-2.5 flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

        <div className="mt-4 space-y-1.5 text-center text-xs text-[#C19A6B]">
          {mode === "signin" && (
            <>
              <div>
                <button
                  type="button"
                  className="font-bold text-[#D4A017] hover:text-[#B98B12] transition-colors cursor-pointer"
                  onClick={() => setMode("signup")}
                >
                  New here? Create an account
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="text-[#C19A6B] hover:text-[#F5EBDD] underline cursor-pointer transition-colors"
                  onClick={() => setMode("forgot")}
                >
                  Forgot your password?
                </button>
              </div>
            </>
          )}
          {mode !== "signin" && (
            <div>
              <button
                type="button"
                className="font-bold text-[#D4A017] hover:text-[#B98B12] transition-colors cursor-pointer"
                onClick={() => setMode("signin")}
              >
                Back to sign in
              </button>
            </div>
          )}
          <div>
            <Link
              to="/"
              className="text-[#C19A6B] hover:text-[#F5EBDD] underline cursor-pointer transition-colors"
            >
              Continue browsing as guest
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSafeRedirect(path?: string) {
  if (!path) return "/";
  try {
    const target = new URL(path, window.location.origin);
    return target.origin === window.location.origin
      ? `${target.pathname}${target.search}${target.hash}`
      : "/";
  } catch {
    return "/";
  }
}
