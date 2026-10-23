import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { claimRestaurantAdmin } from "../lib/roles.functions";

/**
 * Shown when someone opens the restaurant dashboard without a staff/admin role.
 * Offers sign-in and a one-time admin claim for a brand new restaurant.
 */
export default function StaffAccessGate({ auth, onReturnToStore, onShowToast }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleClaimAdmin = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await claimRestaurantAdmin();
      if (result.granted) {
        await auth.refreshRoles();
        onShowToast?.("Admin access granted. Welcome aboard! ");
      } else {
        setNotice(result.reason);
      }
    } catch (err) {
      setNotice(err?.message || "Could not grant admin access.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-subtle flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-cream border border-cream-dark rounded-3xl shadow-xl shadow-black/5 p-7 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-chili-light flex items-center justify-center text-2xl">
          <ShieldCheck className="h-6 w-6 text-[#171513]" aria-hidden="true" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-ink mt-4">Staff access only</h1>
        <p className="text-sm text-ink-muted mt-2">
          The restaurant dashboard is limited to staff and administrators.
          {auth.user
            ? ` You are signed in as ${auth.user.email}, but your account has no staff role yet.`
            : " Please sign in with your staff account to continue."}
        </p>

        {notice && (
          <div className="mt-4 rounded-xl bg-chili-light text-chili text-sm font-medium px-3 py-2">
            {notice}
          </div>
        )}

        <div className="mt-6 space-y-2">
          {!auth.user && (
            <a
              href={`${import.meta.env.BASE_URL}auth?redirect=%2F`}
              className="block w-full rounded-xl bg-chili hover:bg-chili-hover text-white font-bold text-sm py-3 transition-colors"
            >
              Sign in
            </a>
          )}

          {auth.user && (
            <button
              type="button"
              onClick={handleClaimAdmin}
              disabled={busy}
              className="w-full rounded-xl bg-chili hover:bg-chili-hover disabled:opacity-60 text-white font-bold text-sm py-3 transition-colors"
            >
              {busy ? "Checking…" : "Claim admin access (first user only)"}
            </button>
          )}

          <button
            type="button"
            onClick={onReturnToStore}
            className="w-full rounded-xl border border-cream-dark bg-cream hover:bg-cream-subtle text-ink font-bold text-sm py-3 transition-colors"
          >
            Back to the menu
          </button>
        </div>
      </div>
    </div>
  );
}
