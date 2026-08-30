"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SubjectWithStats } from "@/lib/types";

export default function SubjectGrid({
  subjects,
}: {
  subjects: SubjectWithStats[];
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return subjects;
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.code.toLowerCase().includes(needle),
    );
  }, [q, subjects]);

  return (
    <div className="space-y-5">
      <div className="sticky top-[57px] z-30 -mx-4 bg-[var(--background)]/95 px-4 py-2 backdrop-blur">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search subjects by name or code..."
          aria-label="Search subjects"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-10 text-center text-sm text-[var(--muted)]">
          {subjects.length === 0
            ? "No subjects have been published yet."
            : `No subjects match "${q}".`}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/subjects/${s.id}`}
              className="group relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
            >
              <span
                className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--muted)] group-hover:bg-[var(--background)]"
                title={`${s.total_thumbs_up} thumbs up across all notes`}
              >
                <ThumbIcon />
                {s.total_thumbs_up}
              </span>
              <span className="font-mono text-xs uppercase tracking-wide text-[var(--accent)]">
                {s.code}
              </span>
              <span className="mt-2 pr-12 text-base font-medium leading-snug">
                {s.name}
              </span>
              <span className="mt-3 text-xs text-[var(--muted)]">
                {s.note_count} {s.note_count === 1 ? "note" : "notes"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ThumbIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2 21h4V9H2v12zM23 10c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
    </svg>
  );
}
