"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/** Renders Markdown as sanitized HTML. No raw HTML from the source survives. */
export default function MarkdownViewer({ src }: { src: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const md = await res.text();
        const rawHtml = await marked.parse(md, { async: true, gfm: true });
        const clean = DOMPurify.sanitize(rawHtml, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ["style", "iframe", "form", "input", "script"],
          FORBID_ATTR: ["style", "srcset"],
        });
        if (!cancelled) {
          setHtml(clean);
          setState("ready");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (state === "error") {
    return (
      <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
        This note could not be displayed.
      </p>
    );
  }
  if (state === "loading" || html === null) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--muted)]">
        Loading note...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
      <div
        className="doc-prose"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
