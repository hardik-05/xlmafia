"use client";

import NoCopyWrapper from "./NoCopyWrapper";
import PdfCanvasViewer from "./PdfCanvasViewer";
import ImageViewer from "./ImageViewer";
import MarkdownViewer from "./MarkdownViewer";
import DocxViewer from "./DocxViewer";
import type { FileKind } from "@/lib/validation";

/**
 * Picks the right renderer for the file kind and wraps everything in the
 * no-copy / no-context-menu / no-print surface.
 */
export default function SecureDocViewer({
  noteId,
  fileKind,
}: {
  noteId: string;
  fileKind: FileKind;
}) {
  const src = `/api/notes/${noteId}/file`;

  return (
    <NoCopyWrapper className="select-none">
      {fileKind === "pdf" && <PdfCanvasViewer src={src} />}
      {fileKind === "image" && <ImageViewer src={src} />}
      {fileKind === "md" && <MarkdownViewer src={src} />}
      {fileKind === "docx" && <DocxViewer src={src} />}
      <p className="mt-3 text-center text-[11px] text-[var(--muted)]">
        For personal study only. Copying, downloading and printing are disabled.
      </p>
    </NoCopyWrapper>
  );
}
