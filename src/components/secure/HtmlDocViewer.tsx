"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

const SANITIZE_OPTS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "iframe", "form", "input", "script"] as string[],
  FORBID_ATTR: ["style", "srcset"] as string[],
};

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;

/**
 * Markdown / DOCX viewer. Uses the HTML rendered at upload when present
 * (instant); otherwise fetches and converts in the browser. Shown as a white
 * "page" column inside the same bounded, internally-scrolling frame as the PDF
 * viewer, with a CSS zoom control.
 */
export default function HtmlDocViewer({
  src,
  html,
  kind,
}: {
  src: string;
  html?: string;
  kind: "md" | "docx";
}) {
  const [out, setOut] = useState<string | null>(html ?? null);
  const [state, setState] = useState<"loading" | "ready" | "error">(
    html ? "ready" : "loading",
  );
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (html) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src, { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let raw: string;
        if (kind === "md") {
          const { marked } = await import("marked");
          raw = await marked.parse(await res.text(), { async: true, gfm: true });
        } else {
          const mammoth = await import("mammoth/mammoth.browser");
          const { value } = await mammoth.convertToHtml({
            arrayBuffer: await res.arrayBuffer(),
          });
          raw = value || "<p>(empty document)</p>";
        }
        const clean = DOMPurify.sanitize(raw, SANITIZE_OPTS);
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
  }, [src, html, kind]);

  return (
    <div className="viewer-frame">
      <div className="viewer-toolbar">
        <span className="text-[13px] text-[var(--muted)]">
          {kind === "md" ? "Markdown" : "Document"}
        </span>
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        <button
          className="viewer-btn"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))}
        >
          −
        </button>
        <button
          className="viewer-btn min-w-[4ch]"
          onClick={() => setZoom(1)}
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          className="viewer-btn"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))}
        >
          +
        </button>
      </div>

      <div className="viewer-body" tabIndex={0}>
        {state === "error" ? (
          <p className="p-8 text-center text-sm text-[var(--danger)]">
            This document could not be displayed.
            {kind === "docx" && " Try uploading a PDF export instead."}
          </p>
        ) : state === "loading" || out === null ? (
          <div className="flex h-full items-center justify-center p-8 text-sm text-[var(--muted)]">
            Loading document…
          </div>
        ) : (
          <div
            className="doc-page doc-prose doc-prose--light"
            style={{ zoom }}
            dangerouslySetInnerHTML={{ __html: out }}
          />
        )}
      </div>
    </div>
  );
}
