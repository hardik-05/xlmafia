"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

const SANITIZE_OPTS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "iframe", "form", "input", "script"] as string[],
  FORBID_ATTR: ["style"] as string[],
};

/**
 * Renders a .docx as HTML. If `html` is supplied (converted with mammoth at
 * upload time) it is used directly; otherwise the file is fetched and
 * converted in the browser.
 */
export default function DocxViewer({
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
        const arrayBuffer = await res.arrayBuffer();
        const mammoth = await import("mammoth/mammoth.browser");
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const clean = DOMPurify.sanitize(
          result.value || "<p>(empty document)</p>",
          SANITIZE_OPTS,
        );
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
        This document could not be displayed. Try a PDF export instead.
      </p>
    );
  }
  if (state === "loading" || out === null) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--muted)]">
        Loading document...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-8 text-[#1a1a1a]">
      <div
        className="doc-prose doc-prose--light"
        dangerouslySetInnerHTML={{ __html: out }}
      />
    </div>
  );
}
