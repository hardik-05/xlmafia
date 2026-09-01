"use client";

import { useEffect, useRef, useState } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

/** Plain image render with zoom. Bytes come from the auth-gated API endpoint. */
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

  const btn =
    "rounded border border-[var(--border)] px-2.5 py-1 text-sm hover:bg-[var(--surface-2)]";

  if (state === "error") {
    return (
      <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
        This image could not be displayed.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          className={btn}
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.25).toFixed(2)))}
        >
          −
        </button>
        <button className={btn} onClick={() => setZoom(1)} title="Reset zoom">
          {Math.round(zoom * 100)}%
        </button>
        <button
          className={btn}
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.25).toFixed(2)))}
        >
          +
        </button>
      </div>
      <div className="max-h-[82vh] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--doc-bg)] p-3">
        {state === "loading" || !url ? (
          <div className="flex h-64 items-center justify-center text-sm text-[var(--muted)]">
            Loading image…
          </div>
        ) : (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Scanned note"
              style={{ width: `${zoom * 100}%`, maxWidth: zoom <= 1 ? 1100 : "none" }}
              className="h-auto shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
