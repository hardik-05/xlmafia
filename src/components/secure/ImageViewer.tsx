"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders a scanned image as a CSS background on a <div>, with a transparent
 * overlay on top so it cannot be dragged to the desktop or saved via the
 * context menu. No <img> element is placed in the DOM.
 */
export default function ImageViewer({ src }: { src: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [ratio, setRatio] = useState(1.4); // height / width
  const [zoom, setZoom] = useState(1);
  const blobUrlRef = useRef<string | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setBgUrl(url);

        const probe = new Image();
        probe.onload = () => {
          if (!cancelled && probe.naturalWidth > 0) {
            setRatio(probe.naturalHeight / probe.naturalWidth);
          }
          if (!cancelled) setState("ready");
        };
        probe.onerror = () => !cancelled && setState("error");
        probe.src = url;
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    };
  }, [src]);

  if (state === "error") {
    return (
      <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
        This image could not be displayed.
      </p>
    );
  }

  if (state === "loading" || !bgUrl) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--muted)]">
        Loading image...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.2).toFixed(2)))}
          className="rounded border border-[var(--border)] px-3 py-1"
        >
          -
        </button>
        <span className="tabular-nums text-[var(--muted)]">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
          className="rounded border border-[var(--border)] px-3 py-1"
        >
          +
        </button>
      </div>

      <div className="max-h-[80vh] overflow-auto rounded-lg border border-[var(--border)] bg-[#333] p-2">
        <div
          className="relative mx-auto"
          style={{ width: `${zoom * 100}%`, maxWidth: zoom <= 1 ? "900px" : "none" }}
        >
          <div
            role="img"
            aria-label="Scanned note"
            style={{
              backgroundImage: `url("${bgUrl}")`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "top center",
              paddingBottom: `${ratio * 100}%`,
            }}
          />
          {/* Transparent shield against drag-to-save / long-press menus. */}
          <div className="absolute inset-0" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
