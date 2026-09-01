"use client";

import dynamic from "next/dynamic";
import ImageViewer from "./ImageViewer";
import MarkdownViewer from "./MarkdownViewer";
import DocxViewer from "./DocxViewer";
import type { FileKind } from "@/lib/validation";

// react-pdf touches the DOM at import; load it only in the browser, only here.
const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--doc-bg)] text-sm text-[var(--muted)]">
      Loading viewer…
    </div>
  ),
});

/**
 * Renders a note by file kind. Download is not offered anywhere; there are no
 * copy / screenshot / print restrictions. md/docx use the HTML rendered at
 * upload time for an instant open.
 */
export default function DocViewer({
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
    <div>
      {fileKind === "pdf" && <PdfViewer src={src} />}
      {fileKind === "image" && <ImageViewer src={src} />}
      {fileKind === "md" && (
        <MarkdownViewer src={src} html={renderedHtml ?? undefined} />
      )}
      {fileKind === "docx" && (
        <DocxViewer src={src} html={renderedHtml ?? undefined} />
      )}
    </div>
  );
}
