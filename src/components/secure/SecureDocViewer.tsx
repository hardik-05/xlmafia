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
 *
 * For md/docx a pre-sanitised `renderedHtml` (produced at upload) is used when
 * present, so there is no in-browser conversion on open.
 */
export default function SecureDocViewer({
  noteId,
  fileKind,
  renderedHtml,
}: {
  noteId: string;
  fileKind: FileKind;
  renderedHtml?: string | null;
}) {
  const src = `/api/notes/${noteId}/file`;

  return (
    <NoCopyWrapper className="select-none">
      {fileKind === "pdf" && <PdfCanvasViewer src={src} />}
      {fileKind === "image" && <ImageViewer src={src} />}
      {fileKind === "md" && (
        <MarkdownViewer src={src} html={renderedHtml ?? undefined} />
      )}
      {fileKind === "docx" && (
        <DocxViewer src={src} html={renderedHtml ?? undefined} />
      )}
      <p className="mt-3 text-center text-[11px] text-[var(--muted)]">
        For personal study only. Copying, downloading and printing are disabled.
      </p>
    </NoCopyWrapper>
  );
}
