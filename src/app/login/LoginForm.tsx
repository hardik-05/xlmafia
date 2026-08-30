"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const REASONS: Record<string, string> = {
  auth: "Please sign in to continue.",
  expired: "Your session expired. Please sign in again.",
  signed_out: "You have been signed out.",
  domain: "That account is not on the allowed email domain.",
  auth_error: "Sign-in failed or the link expired. Try again.",
  forbidden: "You do not have access to that area.",
  idle: "Signed out after inactivity. Please sign in again.",
};

export default function LoginForm({ allowedDomain }: { allowedDomain: string }) {
  const params = useSearchParams();
  const reason = params.get("reason");
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [stay, setStay] = useState(false);
  const [busy, setBusy] = useState<null | "otp" | "google">(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    reason ? (REASONS[reason] ?? null) : null,
  );

  const emailOk = useMemo(() => {
    const e = email.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.endsWith(`@${allowedDomain}`);
  }, [email, allowedDomain]);

  const siteOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!emailOk) {
      setError(`Enter a valid @${allowedDomain} email address.`);
      return;
    }
    setBusy("otp");
    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), stay }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send the link.");
      } else {
        setNotice(
          "Check your inbox for a one-time sign-in link. It expires shortly.",
        );
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function continueWithGoogle() {
    setError(null);
    setNotice(null);
    setBusy("google");
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${siteOrigin}/auth/callback?stay=${
        stay ? "1" : "0"
      }&next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            hd: allowedDomain, // Workspace hint - restricts the account chooser
            prompt: "select_account",
          },
        },
      });
      if (error) {
        setError(error.message);
        setBusy(null);
      }
      // On success the browser navigates away.
    } catch {
      setError("Could not start Google sign-in.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-2 text-sm text-[var(--accent)]">
          {notice}
        </p>
      )}

      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={busy !== null}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--border)] disabled:opacity-50"
      >
        <GoogleGlyph />
        {busy === "google" ? "Redirecting..." : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        or use a magic link
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <form onSubmit={sendMagicLink} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Institute email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder={`you@${allowedDomain}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          {email.length > 0 && !emailOk && (
            <p className="mt-1 text-xs text-[var(--danger)]">
              Must be a valid @{allowedDomain} address.
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={stay}
            onChange={(e) => setStay(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)] bg-[var(--background)]"
          />
          Stay logged in (up to 48 hours)
        </label>

        <button
          type="submit"
          disabled={busy !== null || !emailOk}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90 disabled:opacity-50"
        >
          {busy === "otp" ? "Sending..." : "Email me a sign-in link"}
        </button>
      </form>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
