import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/services/api";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Set a new password — KarachiBites" },
      { name: "description", content: "Choose a new password for your KarachiBites account." },
      { property: "og:title", content: "Set a new password — KarachiBites" },
      {
        property: "og:description",
        content: "Choose a new password for your KarachiBites account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword: password });
      setMessage("Password updated successfully. Taking you to the menu…");
      setTimeout(() => navigate({ to: "/", replace: true }), 1200);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Password update failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171513] text-[#F5EBDD] flex items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#2A211B] border border-[#4A3A2B] rounded-3xl shadow-2xl p-6 sm:p-8"
      >
        <h1 className="font-display font-extrabold text-2xl text-[#F5EBDD]">Change Password</h1>
        <p className="text-xs sm:text-sm text-[#C19A6B] mt-1">
          Enter your current and new password for your KarachiBites account.
        </p>

        {message && (
          <div className="mt-4 rounded-xl bg-[#3B3020] text-[#F5EBDD] border border-[#4A3A2B] text-xs sm:text-sm font-medium px-3.5 py-2">
            {message}
          </div>
        )}

        <input
          type="password"
          required
          autoComplete="current-password"
          className="mt-5 w-full rounded-xl border border-[#4A3A2B] bg-[#171513] px-3.5 py-2.5 text-sm text-[#F5EBDD] placeholder-[#A89078] outline-none transition focus:border-[#D4A017]"
          placeholder="Current password"
          value={currentPassword}
          maxLength={72}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <input
          type="password"
          required
          autoComplete="new-password"
          className="mt-3 w-full rounded-xl border border-[#4A3A2B] bg-[#171513] px-3.5 py-2.5 text-sm text-[#F5EBDD] placeholder-[#A89078] outline-none transition focus:border-[#D4A017]"
          placeholder="New password"
          value={password}
          maxLength={72}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-[#D4A017] hover:bg-[#B98B12] disabled:opacity-60 text-white font-bold text-sm py-2.5 transition-all shadow-lg shadow-[#D4A017]/25 active:scale-95 cursor-pointer"
        >
          {busy ? "Saving…" : "Update password"}
        </button>

        <div className="mt-5 text-center text-xs text-[#C19A6B]">
          <Link
            to="/auth"
            className="text-[#C19A6B] hover:text-[#F5EBDD] underline transition-colors cursor-pointer"
          >
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
