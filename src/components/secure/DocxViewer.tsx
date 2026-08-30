"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

/**
 * Converts a .docx to HTML in the browser with mammoth, then sanitizes it and
 * renders it inside the locked wrapper. No download, no iframe.
 */
export default function DocxViewer({ src }: { src: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();

        const mammoth = await import("mammoth/mammoth.browser");
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const clean = DOMPurify.sanitize(result.value || "<p>(empty document)</p>", {
          USE_PROFILES: { html: true },
          FORBID_TAGS: ["style", "iframe", "form", "input", "script"],
          FORBID_ATTR: ["style"],
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
        This document could not be displayed. Try a PDF export instead.
      </p>
    );
  }
  if (state === "loading" || html === null) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--muted)]">
        Converting document...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-8 text-[#1a1a1a]">
      <div className="doc-prose doc-prose--light" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
