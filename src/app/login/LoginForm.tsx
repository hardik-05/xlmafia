"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  const nextParam = params.get("next");
  const next =
    nextParam && /^\/(?!\/)/.test(nextParam) ? nextParam : undefined;

  const [email, setEmail] = useState("");
  const [stay, setStay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    reason ? (REASONS[reason] ?? null) : null,
  );

  const emailOk = useMemo(() => {
    const e = email.trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.endsWith(`@${allowedDomain}`);
  }, [email, allowedDomain]);

  async function sendLoginLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!emailOk) {
      setError(`Enter a valid @${allowedDomain} email address.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          stay,
          ...(next ? { next } : {}),
        }),
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
      setBusy(false);
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
        <p className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-weak)] px-3 py-2 text-sm text-[var(--on-accent-weak)]">
          {notice}
        </p>
      )}

      <div className="text-sm font-semibold text-[var(--text)]">
        Get login link
      </div>

      <form onSubmit={sendLoginLink} className="space-y-4">
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
            className="field"
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
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
          />
          Stay logged in (up to 48 hours)
        </label>

        <button
          type="submit"
          disabled={busy || !emailOk}
          className="btn btn-primary w-full"
        >
          {busy ? "Sending…" : "Send login link"}
        </button>
      </form>
    </div>
  );
}
