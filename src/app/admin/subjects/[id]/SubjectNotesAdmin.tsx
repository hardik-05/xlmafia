"use client";

import { useState } from "react";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import { FILE_KIND_LABEL } from "@/lib/types";
import type { AdminNote } from "./page";

function fmtBytes(n: number | null): string | null {
  if (!n) return null;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SubjectNotesAdmin({
  subject,
  notes: initial,
}: {
  subject: { id: string; name: string; code: string };
  notes: AdminNote[];
}) {
  const [notes, setNotes] = useState(initial);
  const [target, setTarget] = useState<AdminNote | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDelete(n: AdminNote) {
    setTarget(n);
    setConfirmText("");
    setError(null);
  }
  function closeDelete() {
    if (busy) return;
    setTarget(null);
    setConfirmText("");
    setError(null);
  }

  async function confirmDelete() {
    if (!target || confirmText.trim().toLowerCase() !== "delete") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/notes/${target.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Could not delete");
      }
      setNotes((prev) => prev.filter((n) => n.id !== target.id));
      setTarget(null);
      setConfirmText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/admin/subjects" label="All subjects" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{subject.name}</h1>
            <span className="rounded-md bg-[var(--accent-weak)] px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--on-accent-weak)]">
              {subject.code}
            </span>
          </div>
          <Link
            href={`/admin/upload?subject=${subject.id}`}
            className="btn btn-primary btn-sm"
          >
            Upload to this subject
          </Link>
        </div>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          {notes.length} {notes.length === 1 ? "resource" : "resources"}
        </p>
      </div>

      {notes.length === 0 ? (
        <p className="card px-4 py-12 text-center text-sm text-[var(--muted)]">
          No resources yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--muted)]">
                    {FILE_KIND_LABEL[n.file_kind]}
                  </span>
                  <span className="truncate font-medium">{n.title}</span>
                </div>
                {n.description && (
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {n.description}
                  </p>
                )}
                <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-[var(--muted)]">
                  {n.session_tag && <span>#{n.session_tag}</span>}
                  {n.doc_date && <span>{n.doc_date}</span>}
                  {fmtBytes(n.file_size) && <span>{fmtBytes(n.file_size)}</span>}
                  <span>{new Date(n.created_at).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/viewer/${n.id}?back=${encodeURIComponent(
                    `/admin/subjects/${subject.id}`,
                  )}`}
                  className="btn btn-ghost btn-sm"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => openDelete(n)}
                  className="btn btn-sm border border-[var(--danger)]/40 text-[var(--danger)] hover:bg-[var(--danger)]/10"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeDelete}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-md)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Delete resource</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              This permanently removes{" "}
              <span className="font-medium text-[var(--text)]">
                “{target.title}”
              </span>{" "}
              and its file. This cannot be undone.
            </p>
            <label className="mt-4 block text-sm">
              Type <span className="font-mono font-semibold">delete</span> to
              confirm
              <input
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmDelete()}
                className="field mt-1.5"
                placeholder="delete"
              />
            </label>
            {error && (
              <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDelete}
                disabled={busy}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={
                  busy || confirmText.trim().toLowerCase() !== "delete"
                }
                className="btn btn-sm bg-[var(--danger)] text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Confirm delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
