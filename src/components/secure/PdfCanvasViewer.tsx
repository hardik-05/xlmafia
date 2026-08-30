"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";

type LoadState = "loading" | "ready" | "error";

/**
 * Renders a PDF strictly as <canvas> pages using pdf.js. No text layer is
 * created, so there is no selectable DOM text to copy. Bytes are fetched once
 * from our auth-gated API endpoint.
 */
export default function PdfCanvasViewer({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string>("");
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  // Load the document once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setState("loading");
        // pdf.js v4 relies on Promise.withResolvers (very recent browsers).
        if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers !== "function") {
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
        setPage(1);
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
      renderTaskRef.current?.cancel();
      docRef.current?.destroy();
      docRef.current = null;
    };
  }, [src]);

  const renderPage = useCallback(async () => {
    const doc = docRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!doc || !canvas || !container) return;

    renderTaskRef.current?.cancel();

    const pdfPage = await doc.getPage(page);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const unscaled = pdfPage.getViewport({ scale: 1 });
    const fit = (container.clientWidth - 4) / unscaled.width;
    const cssScale = Math.max(0.2, fit * zoom);
    // Bake devicePixelRatio into the render scale for a crisp canvas.
    const viewport = pdfPage.getViewport({ scale: cssScale * dpr });

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
    canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

    const task = pdfPage.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;

    try {
      await task.promise;
    } catch (err) {
      // RenderingCancelledException is expected on rapid page/zoom changes.
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        err.name !== "RenderingCancelledException"
      ) {
        setMessage("Failed to render this page");
        setState("error");
      }
    }
  }, [page, zoom]);

  useEffect(() => {
    if (state !== "ready") return;
    void renderPage();
  }, [state, renderPage]);

  // Re-fit on container resize.
  useEffect(() => {
    if (state !== "ready") return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => void renderPage());
    ro.observe(el);
    return () => ro.disconnect();
  }, [state, renderPage]);

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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="tabular-nums text-[var(--muted)]">
              Page {page} / {numPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(numPages, p + 1))}
              disabled={page >= numPages}
              className="rounded border border-[var(--border)] px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
            <span className="mx-2 h-4 w-px bg-[var(--border)]" />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
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

          <div className="flex justify-center overflow-auto rounded-lg border border-[var(--border)] bg-[#333] p-1">
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
        </>
      )}
    </div>
  );
}
