"use client";

import { useEffect, type ReactNode } from "react";

const BLOCKED_LOWER = new Set(["c", "x", "s", "p", "u"]);

/**
 * Wraps rendered document content and blocks the common copy / save / print
 * interactions: selection, context menu, drag, copy/cut events, and the
 * Ctrl/Cmd + C/X/S/P/U shortcuts. A global print stylesheet (globals.css)
 * blanks the page if the user reaches the print dialog anyway.
 *
 * This is a deterrent for ordinary use. It cannot stop screenshots, screen
 * recording, or a determined user with developer tools.
 */
export default function NoCopyWrapper({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && BLOCKED_LOWER.has(key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      // DevTools shortcuts - best effort only.
      if (
        key === "f12" ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
      }
    };

    const onCopyLike = (e: Event) => e.preventDefault();

    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("copy", onCopyLike, true);
    document.addEventListener("cut", onCopyLike, true);
    document.addEventListener("dragstart", onCopyLike, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("copy", onCopyLike, true);
      document.removeEventListener("cut", onCopyLike, true);
      document.removeEventListener("dragstart", onCopyLike, true);
    };
  }, []);

  return (
    <div
      className={`secure-surface relative ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
