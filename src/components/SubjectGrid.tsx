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
      <div className="sticky top-[61px] z-30 -mx-4 bg-[var(--background)]/90 px-4 py-2 backdrop-blur-lg sm:-mx-6 sm:px-6">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subjects by name or code…"
            aria-label="Search subjects"
            className="field pl-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="card px-4 py-12 text-center text-sm text-[var(--muted)]">
          {subjects.length === 0
            ? "No subjects have been published yet."
            : `No subjects match “${q}”.`}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/subjects/${s.id}`}
              className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-[var(--accent-weak-hover)] hover:shadow-[var(--shadow-md)]"
            >
              <span className="w-fit rounded-md bg-[var(--accent-weak)] px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--on-accent-weak)]">
                {s.code}
              </span>
              <span className="mt-3 text-[15px] font-semibold leading-snug">
                {s.name}
              </span>
              <span className="mt-auto pt-4 text-xs text-[var(--muted)]">
                {s.note_count} {s.note_count === 1 ? "note" : "notes"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
