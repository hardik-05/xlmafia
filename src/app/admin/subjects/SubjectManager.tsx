"use client";

import { useState } from "react";
import Link from "next/link";
import type { SubjectWithStats } from "@/lib/types";

export default function SubjectManager({
  initialSubjects,
}: {
  initialSubjects: SubjectWithStats[];
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create the subject.");
        return;
      }
      setSubjects((prev) =>
        [
          { ...data.subject, note_count: 0, total_thumbs_up: 0 },
          ...prev,
        ].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={create}
        className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:grid-cols-[1fr_200px_auto] sm:items-end"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium">Subject name</label>
          <input
            required
            maxLength={200}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Financial Reporting & Analysis"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Subject code</label>
          <input
            required
            maxLength={40}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="FRA-101"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !name.trim() || !code.trim()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] disabled:opacity-50"
        >
          {busy ? "Adding..." : "Add subject"}
        </button>
        {error && (
          <p className="text-sm text-[var(--danger)] sm:col-span-3">{error}</p>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--surface)] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3 font-medium">Thumbs up</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[var(--muted)]"
                >
                  No subjects yet.
                </td>
              </tr>
            )}
            {subjects.map((s) => (
              <tr key={s.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs uppercase">
                  {s.code}
                </td>
                <td className="px-4 py-3">{s.note_count}</td>
                <td className="px-4 py-3">{s.total_thumbs_up}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/subjects/${s.id}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
