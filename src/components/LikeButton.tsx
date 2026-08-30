"use client";

import { useEffect, useState } from "react";

/**
 * Anonymous thumbs-up. One increment per browser is enforced client-side with
 * localStorage (the spec asks for no user association). Optimistic update with
 * rollback on failure.
 */
export default function LikeButton({
  noteId,
  initialCount,
}: {
  noteId: string;
  initialCount: number;
}) {
  const storageKey = `xlri:liked:${noteId}`;
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(storageKey) === "1");
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  async function like() {
    if (liked || busy) return;
    setBusy(true);
    setCount((c) => c + 1);
    setLiked(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }

    try {
      const res = await fetch(`/api/notes/${noteId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (typeof data.thumbs_up === "number") setCount(data.thumbs_up);
    } catch {
      setCount((c) => Math.max(0, c - 1));
      setLiked(false);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={like}
      disabled={liked || busy}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
        liked
          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
          : "border-[var(--border)] hover:border-[var(--accent)]"
      } disabled:cursor-default`}
      title={liked ? "You liked this" : "Thumbs up"}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
      </svg>
      {count}
    </button>
  );
}
