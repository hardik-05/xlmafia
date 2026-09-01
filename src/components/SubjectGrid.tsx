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
              className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
            >
              <span className="font-mono text-xs uppercase tracking-wide text-[var(--accent)]">
                {s.code}
              </span>
              <span className="mt-2 text-base font-medium leading-snug">
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
