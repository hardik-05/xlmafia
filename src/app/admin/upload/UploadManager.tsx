"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  classifyFile,
  MAX_FILE_BYTES,
  type FileKind,
} from "@/lib/validation";
import type { Subject } from "@/lib/types";

type Status = "pending" | "uploading" | "done" | "error";

interface Item {
  key: string;
  file: File;
  kind: FileKind;
  title: string;
  docDate: string;
  sessionTag: string;
  status: Status;
  message?: string;
}

const CONTENT_TYPE: Record<FileKind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  md: "text/markdown",
  image: "image/*",
};

const ACCEPT = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/markdown": [".md", ".markdown"],
  "text/plain": [".md"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

function extOf(name: string): string {
  const e = name.split(".").pop()?.toLowerCase();
  return e && e.length <= 5 ? e : "bin";
}

export default function UploadManager({ subjects }: { subjects: Subject[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setItems((prev) => {
      const next = [...prev];
      for (const file of accepted) {
        const kind = classifyFile(file.name, file.type);
        if (!kind) continue;
        if (file.size > MAX_FILE_BYTES) continue;
        next.push({
          key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          file,
          kind,
          title: file.name.replace(/\.[^.]+$/, ""),
          docDate: "",
          sessionTag: "",
          status: "pending",
        });
      }
      return next;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: true,
    disabled: running || !subjectId,
  });

  const patch = (key: string, p: Partial<Item>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)));

  const remove = (key: string) =>
    setItems((prev) => prev.filter((it) => it.key !== key));

  const pending = useMemo(
    () => items.filter((i) => i.status === "pending" || i.status === "error"),
    [items],
  );
  const canRun =
    !running &&
    subjectId &&
    pending.length > 0 &&
    pending.every((i) => i.title.trim().length > 0);

  async function uploadOne(supabase: ReturnType<typeof createSupabaseBrowserClient>, it: Item) {
    patch(it.key, { status: "uploading", message: undefined });
    const path = `${subjectId}/${crypto.randomUUID()}.${extOf(it.file.name)}`;

    const { error: upErr } = await supabase.storage
      .from("notes")
      .upload(path, it.file, {
        contentType: it.file.type || CONTENT_TYPE[it.kind],
        upsert: false,
      });
    if (upErr) {
      patch(it.key, { status: "error", message: `Storage: ${upErr.message}` });
      return;
    }

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        title: it.title.trim(),
        description: "",
        docDate: it.docDate || "",
        sessionTag: it.sessionTag || "",
        storagePath: path,
        fileKind: it.kind,
        mimeType: it.file.type || CONTENT_TYPE[it.kind],
        fileSize: it.file.size,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      await supabase.storage.from("notes").remove([path]);
      patch(it.key, {
        status: "error",
        message: data.error || "Could not save metadata",
      });
      return;
    }
    patch(it.key, { status: "done", message: "Uploaded" });
  }

  async function runBatch() {
    setRunning(true);
    const supabase = createSupabaseBrowserClient();
    // Snapshot the queue; inputs are disabled while running so titles/tags
    // are stable. Only `status` mutates during the loop.
    const snapshot = items.filter(
      (i) => i.status === "pending" || i.status === "error",
    );
    // Sequential keeps the free-tier function load predictable.
    for (const it of snapshot) {
      await uploadOne(supabase, it);
    }
    setRunning(false);
  }

  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <label className="mb-1.5 block text-sm font-medium">Subject</label>
        {subjects.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Create a subject first on the{" "}
            <Link href="/admin/subjects" className="text-[var(--accent)] underline">
              Subjects
            </Link>{" "}
            page.
          </p>
        ) : (
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={running}
            className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
          isDragActive
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] bg-[var(--surface)]"
        } ${running || !subjectId ? "pointer-events-none opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        <p className="text-sm">
          {isDragActive
            ? "Drop the files here"
            : "Drag & drop files here, or click to choose"}
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          PDF / DOCX / MD / PNG / JPG - up to 50 MB each
        </p>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.key}
              className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-[1fr_140px_160px_auto] sm:items-end"
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--muted)]">
                    {it.kind}
                  </span>
                  <span className="truncate text-xs text-[var(--muted)]">
                    {it.file.name}
                  </span>
                </div>
                <input
                  value={it.title}
                  onChange={(e) => patch(it.key, { title: e.target.value })}
                  placeholder="Title (required)"
                  disabled={it.status === "done" || running}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-[var(--muted)]">
                  Date
                </label>
                <input
                  type="date"
                  value={it.docDate}
                  onChange={(e) => patch(it.key, { docDate: e.target.value })}
                  disabled={it.status === "done" || running}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-[var(--muted)]">
                  Session ID / tag
                </label>
                <input
                  value={it.sessionTag}
                  onChange={(e) =>
                    patch(it.key, { sessionTag: e.target.value })
                  }
                  maxLength={80}
                  placeholder="e.g. Session 4"
                  disabled={it.status === "done" || running}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <StatusPill status={it.status} message={it.message} />
                {it.status !== "done" && !running && (
                  <button
                    type="button"
                    onClick={() => remove(it.key)}
                    className="text-[var(--muted)] hover:text-[var(--danger)]"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={runBatch}
            disabled={!canRun}
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] disabled:opacity-50"
          >
            {running
              ? "Uploading..."
              : `Upload ${pending.length} file${pending.length === 1 ? "" : "s"}`}
          </button>
          <span className="text-sm text-[var(--muted)]">
            {doneCount} of {items.length} uploaded
          </span>
          {doneCount > 0 && subjectId && (
            <Link
              href={`/subjects/${subjectId}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              View subject
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, message }: { status: Status; message?: string }) {
  const map: Record<Status, string> = {
    pending: "text-[var(--muted)]",
    uploading: "text-[var(--accent)]",
    done: "text-green-400",
    error: "text-[var(--danger)]",
  };
  return (
    <span className={map[status]} title={message}>
      {status === "pending"
        ? "Ready"
        : status === "uploading"
          ? "Uploading"
          : status === "done"
            ? "Done"
            : `Error: ${message ?? "failed"}`}
    </span>
  );
}
