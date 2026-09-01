"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

const SANITIZE_OPTS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "iframe", "form", "input", "script"] as string[],
  FORBID_ATTR: ["style", "srcset"] as string[],
};

/**
 * Renders Markdown as sanitized HTML. If `html` is supplied (pre-rendered at
 * upload) it is used directly; otherwise the source is fetched and converted.
 */
export default function MarkdownViewer({
  src,
  html,
}: {
  src: string;
  html?: string;
}) {
  const [out, setOut] = useState<string | null>(html ?? null);
  const [state, setState] = useState<"loading" | "ready" | "error">(
    html ? "ready" : "loading",
  );

  useEffect(() => {
    if (html) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const md = await res.text();
        const rawHtml = await marked.parse(md, { async: true, gfm: true });
        const clean = DOMPurify.sanitize(rawHtml, SANITIZE_OPTS);
        if (!cancelled) {
          setOut(clean);
          setState("ready");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src, html]);

  if (state === "error") {
    return (
      <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
        This note could not be displayed.
      </p>
    );
  }
  if (state === "loading" || out === null) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--muted)]">
        Loading note...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
      <div className="doc-prose" dangerouslySetInnerHTML={{ __html: out }} />
    </div>
  );
}
