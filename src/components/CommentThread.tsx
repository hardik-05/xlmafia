"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommentNode } from "@/lib/types";

function relTime(iso: string): string {
  const d = new Date(iso).getTime();
  const s = Math.round((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

/** Blocks pasting files/images into a text field. */
function blockFilePaste(e: React.ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const it of items) {
    if (it.kind === "file") {
      e.preventDefault();
      return;
    }
  }
}

export default function CommentThread({
  noteId,
  currentUserName,
  currentUserId,
}: {
  noteId: string;
  currentUserName: string;
  currentUserId: string;
}) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?noteId=${noteId}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to load comments");
      setComments(data.comments ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = useMemo(
    () =>
      comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0),
    [comments],
  );

  async function submit(body: string, parentId: string | null) {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId, parentId, body }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Could not post");
    await load();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        Discussion{" "}
        <span className="text-sm font-normal text-[var(--muted)]">({total})</span>
      </h2>

      <CommentComposer
        placeholder="Add a comment (text only)..."
        onSubmit={(b) => submit(b, null)}
        submitLabel="Comment"
        signedInAs={currentUserName}
      />

      {loading && (
        <p className="text-sm text-[var(--muted)]">Loading comments...</p>
      )}
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      {!loading && comments.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          No comments yet. Start the discussion.
        </p>
      )}

      <ul className="space-y-4">
        {comments.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <CommentRow
              comment={c}
              canDelete={c.author_id === currentUserId}
              onDelete={() => remove(c.id)}
            />

            <div className="mt-3 space-y-3 border-l border-[var(--border)] pl-4">
              {(c.replies ?? []).map((r) => (
                <CommentRow
                  key={r.id}
                  comment={r}
                  canDelete={r.author_id === currentUserId}
                  onDelete={() => remove(r.id)}
                />
              ))}
              <ReplyBox onSubmit={(b) => submit(b, c.id)} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CommentRow({
  comment,
  canDelete,
  onDelete,
}: {
  comment: CommentNode;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <span className="font-medium text-[var(--text)]">
          {comment.author_name}
        </span>
        <span>{relTime(comment.created_at)}</span>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto hover:text-[var(--danger)]"
          >
            Delete
          </button>
        )}
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm">
        {comment.body}
      </p>
    </div>
  );
}

function CommentComposer({
  placeholder,
  onSubmit,
  submitLabel,
  signedInAs,
}: {
  placeholder: string;
  onSubmit: (body: string) => Promise<void>;
  submitLabel: string;
  signedInAs?: string;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await onSubmit(value.trim());
      setValue("");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={go} className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPaste={blockFilePaste}
        placeholder={placeholder}
        rows={3}
        maxLength={4000}
        className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !value.trim()}
          className="btn btn-primary btn-sm"
        >
          {busy ? "Posting..." : submitLabel}
        </button>
        {signedInAs && (
          <span className="text-xs text-[var(--muted)]">as {signedInAs}</span>
        )}
        {err && <span className="text-xs text-[var(--danger)]">{err}</span>}
      </div>
    </form>
  );
}

function ReplyBox({ onSubmit }: { onSubmit: (body: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--accent)] hover:underline"
      >
        Reply
      </button>
    );
  }
  return (
    <CommentComposer
      placeholder="Write a reply..."
      submitLabel="Reply"
      onSubmit={async (b) => {
        await onSubmit(b);
        setOpen(false);
      }}
    />
  );
}
