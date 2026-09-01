"use client";

import { useEffect, useRef, useState } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

/** Legacy path: notes stored as raw images (new image uploads become PDFs). */
export default function ImageViewer({ src }: { src: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src, { cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        const u = URL.createObjectURL(blob);
        blobRef.current = u;
        setUrl(u);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    };
  }, [src]);

  return (
    <div className="viewer-frame">
      <div className="viewer-toolbar">
        <span className="text-[13px] text-[var(--muted)]">Scan</span>
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />
        <button
          className="viewer-btn"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2)))}
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
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2)))}
        >
          +
        </button>
      </div>
      <div className="viewer-body" tabIndex={0}>
        {state === "error" ? (
          <p className="p-8 text-center text-sm text-[var(--danger)]">
            This image could not be displayed.
          </p>
        ) : state === "loading" || !url ? (
          <div className="flex h-full items-center justify-center p-8 text-sm text-[var(--muted)]">
            Loading image…
          </div>
        ) : (
          <div className="flex justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Scanned note"
              style={{ width: `${zoom * 100}%`, maxWidth: zoom <= 1 ? 1000 : "none" }}
              className="h-auto shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
