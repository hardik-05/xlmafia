"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const H_PAD = 24; // body horizontal padding (px, both sides)
const COL_GAP = 16; // gap between the two pages of a spread
const ROW_GAP = 20; // vertical gap between spreads
const OVERSCAN = 2; // rows rendered above/below the viewport
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

export default function PdfViewer({ src }: { src: string }) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef(1);

  const [numPages, setNumPages] = useState(0);
  const [ratio, setRatio] = useState(1.294); // page height / width (A4-ish)
  const [spread, setSpread] = useState<1 | 2>(2);
  const [zoom, setZoom] = useState(1);
  const [bodyW, setBodyW] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const file = useMemo(() => ({ url: src, withCredentials: true }), [src]);
  const options = useMemo(
    () => ({ isEvalSupported: false, disableAutoFetch: false }),
    [],
  );

  // Spreads: [[1,2],[3,4],…] for 2-up, [[1],[2],…] for 1-up.
  const rows = useMemo(() => {
    const out: number[][] = [];
    for (let p = 1; p <= numPages; p += spread) {
      const r: number[] = [];
      for (let k = 0; k < spread && p + k <= numPages; k++) r.push(p + k);
      out.push(r);
    }
    return out;
  }, [numPages, spread]);

  const pageWidth = Math.max(
    140,
    ((bodyW || 800) - H_PAD * 2 - (spread - 1) * COL_GAP) / spread,
  ) * zoom;
  const rowHeight = pageWidth * ratio + ROW_GAP;

  // Measure the scroll body.
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const measure = () => setBodyW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track scroll position (rAF-throttled) and the current page.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrollTop(el.scrollTop);
        const row = Math.round(el.scrollTop / rowHeight);
        currentPageRef.current = rows[row]?.[0] ?? 1;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [rowHeight, rows]);

  const scrollToPage = useCallback(
    (page: number) => {
      const el = bodyRef.current;
      if (!el) return;
      const rowIdx = rows.findIndex((r) => r.includes(page));
      if (rowIdx >= 0) el.scrollTop = rowIdx * rowHeight;
    },
    [rows, rowHeight],
  );

  // Keep the reading position when zoom / spread changes.
  useEffect(() => {
    scrollToPage(currentPageRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spread, zoom]);

  // Zoom via keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "+" || e.key === "=")
        setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)));
      else if (e.key === "-")
        setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const viewH = bodyRef.current?.clientHeight ?? 600;
  const firstVisible = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const lastVisible = Math.min(
    rows.length - 1,
    Math.ceil((scrollTop + viewH) / rowHeight) + OVERSCAN,
  );

  const curRow =
    rows.length > 0
      ? Math.min(rows.length - 1, Math.round(scrollTop / rowHeight))
      : 0;
  const curPages = rows[curRow] ?? [];
  const label =
    numPages === 0
      ? "…"
      : curPages.length > 1
        ? `Pages ${curPages[0]}–${curPages[curPages.length - 1]} / ${numPages}`
        : `Page ${curPages[0] ?? 1} / ${numPages}`;

  return (
    <div className="viewer-frame">
      <div className="viewer-toolbar">
        <button
          className="viewer-btn"
          onClick={() => {
            const el = bodyRef.current;
            if (el) el.scrollTop = Math.max(0, el.scrollTop - rowHeight);
          }}
          disabled={numPages === 0}
        >
          ↑
        </button>
        <span className="min-w-[9ch] text-center text-[13px] tabular-nums text-[var(--muted)]">
          {label}
        </span>
        <button
          className="viewer-btn"
          onClick={() => {
            const el = bodyRef.current;
            if (el) el.scrollTop += rowHeight;
          }}
          disabled={numPages === 0}
        >
          ↓
        </button>

        <span className="mx-1 h-4 w-px bg-[var(--border)]" />

        <button
          className="viewer-btn"
          data-on={spread === 1}
          onClick={() => setSpread(1)}
        >
          1 page
        </button>
        <button
          className="viewer-btn"
          data-on={spread === 2}
          onClick={() => setSpread(2)}
        >
          2 pages
        </button>

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

      <div ref={bodyRef} className="viewer-body" tabIndex={0}>
        {error ? (
          <p className="p-8 text-center text-sm text-[var(--danger)]">{error}</p>
        ) : (
          <Document
            file={file}
            options={options}
            onLoadSuccess={async (d) => {
              setError(null);
              try {
                const p = await d.getPage(1);
                const vp = p.getViewport({ scale: 1 });
                setRatio(vp.height / vp.width);
              } catch {
                /* keep default ratio */
              }
              setNumPages(d.numPages);
            }}
            onLoadError={(e) =>
              setError(e?.message || "This PDF could not be displayed.")
            }
            loading={
              <div className="flex h-full items-center justify-center p-8 text-sm text-[var(--muted)]">
                Loading document…
              </div>
            }
          >
            <div
              style={{ height: rows.length * rowHeight, padding: `0 ${H_PAD}px` }}
              className="relative"
            >
              {rows.map((r, i) => {
                const top = i * rowHeight;
                if (i < firstVisible || i > lastVisible) {
                  return (
                    <div
                      key={i}
                      style={{ position: "absolute", top, height: rowHeight, width: `calc(100% - ${H_PAD * 2}px)` }}
                    />
                  );
                }
                return (
                  <div
                    key={i}
                    style={{ position: "absolute", top, height: rowHeight }}
                    className="flex justify-center gap-4"
                  >
                    {r.map((pg) => (
                      <Page
                        key={pg}
                        pageNumber={pg}
                        width={pageWidth}
                        renderTextLayer
                        renderAnnotationLayer
                        loading=""
                        className="h-max shadow-lg"
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </Document>
        )}
      </div>
    </div>
  );
}
