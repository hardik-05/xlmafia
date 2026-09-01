"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

type LoadState = "loading" | "ready" | "error";
type ViewMode = "single" | "double";

/**
 * Renders a PDF strictly as <canvas> pages using pdf.js - no text layer, so
 * there is no selectable DOM text. The view is always page-wise (never one
 * long scroll): choose one page or a two-page spread and page through.
 */
export default function PdfCanvasViewer({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const tasksRef = useRef<RenderTask[]>([]);

  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [start, setStart] = useState(1); // first page of the current spread
  const [mode, setMode] = useState<ViewMode>("single");
  const [zoom, setZoom] = useState(1);

  const step = mode === "double" ? 2 : 1;
  const visible: number[] = [];
  for (let i = 0; i < step; i++) {
    const p = start + i;
    if (p <= numPages) visible.push(p);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setState("loading");
        if (
          typeof (Promise as unknown as { withResolvers?: unknown })
            .withResolvers !== "function"
        ) {
          (Promise as unknown as { withResolvers: () => unknown }).withResolvers =
            function <T>() {
              let resolve!: (v: T) => void;
              let reject!: (e?: unknown) => void;
              const promise = new Promise<T>((res, rej) => {
                resolve = res;
                reject = rej;
              });
              return { promise, resolve, reject };
            };
        }
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = new Uint8Array(await res.arrayBuffer());

        const doc = await pdfjs.getDocument({
          data,
          isEvalSupported: false,
          disableAutoFetch: true,
        }).promise;

        if (cancelled) {
          doc.destroy();
          return;
        }
        docRef.current = doc;
        setNumPages(doc.numPages);
        setStart(1);
        setState("ready");
      } catch (err) {
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : "Failed to load PDF");
          setState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      tasksRef.current.forEach((t) => t.cancel());
      docRef.current?.destroy();
      docRef.current = null;
    };
  }, [src]);

  const renderSpread = useCallback(async () => {
    const doc = docRef.current;
    const container = containerRef.current;
    if (!doc || !container) return;

    tasksRef.current.forEach((t) => t.cancel());
    tasksRef.current = [];

    const count = Math.max(1, visible.length);
    const gap = 12;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const avail =
      (container.clientWidth - (count - 1) * gap - 4) / count;

    for (let i = 0; i < visible.length; i++) {
      const canvas = canvasRefs.current[i];
      if (!canvas) continue;
      const pdfPage = await doc.getPage(visible[i]);
      const unscaled = pdfPage.getViewport({ scale: 1 });
      const cssScale = Math.max(0.15, (avail / unscaled.width) * zoom);
      const viewport = pdfPage.getViewport({ scale: cssScale * dpr });

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

      const task = pdfPage.render({ canvasContext: ctx, viewport });
      tasksRef.current.push(task);
      try {
        await task.promise;
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          (err as { name: string }).name !== "RenderingCancelledException"
        ) {
          setMessage("Failed to render this page");
          setState("error");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, mode, zoom, numPages]);

  useEffect(() => {
    if (state !== "ready") return;
    void renderSpread();
  }, [state, renderSpread]);

  useEffect(() => {
    if (state !== "ready") return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => void renderSpread());
    ro.observe(el);
    return () => ro.disconnect();
  }, [state, renderSpread]);

  // Keep `start` valid when the mode changes.
  useEffect(() => {
    setStart((s) => Math.min(s, Math.max(1, numPages)));
  }, [mode, numPages]);

  const atStart = start <= 1;
  const atEnd = start + step - 1 >= numPages;
  const label =
    visible.length > 1
      ? `Pages ${visible[0]}–${visible[visible.length - 1]} / ${numPages}`
      : `Page ${start} / ${numPages}`;

  return (
    <div ref={containerRef} className="w-full">
      {state === "error" && (
        <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
          {message || "This PDF could not be displayed."}
        </p>
      )}

      {state === "loading" && (
        <div className="flex h-64 items-center justify-center text-sm text-[var(--muted)]">
          Loading document...
        </div>
      )}

      {state === "ready" && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setStart((p) => Math.max(1, p - step))}
              disabled={atStart}
              className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="tabular-nums text-[var(--muted)]">{label}</span>
            <button
              type="button"
              onClick={() =>
                setStart((p) => (p + step > numPages ? p : p + step))
              }
              disabled={atEnd}
              className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>

            <span className="mx-2 h-4 w-px bg-[var(--border)]" />

            <div className="inline-flex overflow-hidden rounded border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`px-3 py-1 ${
                  mode === "single"
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : ""
                }`}
              >
                1 page
              </button>
              <button
                type="button"
                onClick={() => setMode("double")}
                className={`border-l border-[var(--border)] px-3 py-1 ${
                  mode === "double"
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : ""
                }`}
              >
                2 pages
              </button>
            </div>

            <span className="mx-2 h-4 w-px bg-[var(--border)]" />

            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))
              }
              className="rounded border border-[var(--border)] px-3 py-1"
            >
              -
            </button>
            <span className="tabular-nums text-[var(--muted)]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
              className="rounded border border-[var(--border)] px-3 py-1"
            >
              +
            </button>
          </div>

          <div className="flex justify-center gap-3 overflow-auto rounded-lg border border-[var(--border)] bg-[#333] p-2">
            {visible.map((p, i) => (
              <canvas
                key={p}
                ref={(el) => {
                  canvasRefs.current[i] = el;
                }}
                className="block h-auto max-w-full self-start bg-white"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
