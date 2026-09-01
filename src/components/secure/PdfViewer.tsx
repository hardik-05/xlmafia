"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Served from /public by scripts/copy-pdf-worker.mjs; version matches react-pdf.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const GAP = 16;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export default function PdfViewer({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [first, setFirst] = useState(1); // 1-based first page of the spread
  const [spread, setSpread] = useState<1 | 2>(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const file = useMemo(() => ({ url: src, withCredentials: true }), [src]);
  const options = useMemo(
    () => ({ isEvalSupported: false, disableAutoFetch: false }),
    [],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const step = spread;
  const pages: number[] = [];
  for (let i = 0; i < step; i++) {
    const p = first + i;
    if (p <= numPages) pages.push(p);
  }

  const pageWidth = Math.max(
    120,
    Math.floor(((width || 800) - (spread - 1) * GAP) / spread) * zoom,
  );

  const atStart = first <= 1;
  const atEnd = first + step - 1 >= numPages;

  const go = useCallback(
    (dir: -1 | 1) => {
      setFirst((f) => {
        const next = f + dir * step;
        if (next < 1) return 1;
        if (next > numPages) return f;
        return next;
      });
    },
    [step, numPages],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === "+" || e.key === "=")
        setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.15).toFixed(2)));
      else if (e.key === "-")
        setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.15).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Keep the spread aligned when switching to 2-up.
  useEffect(() => {
    setFirst((f) => Math.min(f, Math.max(1, numPages)));
  }, [spread, numPages]);

  const btn =
    "rounded border border-[var(--border)] px-2.5 py-1 text-sm disabled:opacity-40 hover:bg-[var(--surface-2)]";

  return (
    <div ref={containerRef} className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className={btn} onClick={() => go(-1)} disabled={atStart}>
          Prev
        </button>
        <span className="tabular-nums text-sm text-[var(--muted)]">
          {numPages === 0
            ? "…"
            : pages.length > 1
              ? `Pages ${pages[0]}–${pages[pages.length - 1]} / ${numPages}`
              : `Page ${first} / ${numPages}`}
        </span>
        <button className={btn} onClick={() => go(1)} disabled={atEnd}>
          Next
        </button>

        <span className="mx-1 h-4 w-px bg-[var(--border)]" />

        <div className="inline-flex overflow-hidden rounded border border-[var(--border)] text-sm">
          <button
            className={`px-2.5 py-1 ${spread === 1 ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : ""}`}
            onClick={() => setSpread(1)}
          >
            1 page
          </button>
          <button
            className={`border-l border-[var(--border)] px-2.5 py-1 ${spread === 2 ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : ""}`}
            onClick={() => setSpread(2)}
          >
            2 pages
          </button>
        </div>

        <span className="mx-1 h-4 w-px bg-[var(--border)]" />

        <button
          className={btn}
          onClick={() =>
            setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.15).toFixed(2)))
          }
        >
          −
        </button>
        <button
          className={btn}
          onClick={() => setZoom(1)}
          title="Reset zoom"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          className={btn}
          onClick={() =>
            setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.15).toFixed(2)))
          }
        >
          +
        </button>
      </div>

      <div className="max-h-[82vh] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--doc-bg)] p-3">
        {error ? (
          <p className="p-6 text-center text-sm text-[var(--danger)]">{error}</p>
        ) : (
          <Document
            file={file}
            options={options}
            onLoadSuccess={(d) => {
              setNumPages(d.numPages);
              setError(null);
            }}
            onLoadError={(e) =>
              setError(e?.message || "This PDF could not be displayed.")
            }
            loading={
              <div className="flex h-64 items-center justify-center text-sm text-[var(--muted)]">
                Loading document…
              </div>
            }
            className="flex justify-center gap-4"
          >
            {pages.map((p) => (
              <Page
                key={p}
                pageNumber={p}
                width={pageWidth}
                renderTextLayer
                renderAnnotationLayer
                loading=""
                className="h-max self-start shadow-lg"
              />
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}
