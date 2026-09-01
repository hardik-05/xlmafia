"use client";

import dynamic from "next/dynamic";
import ImageViewer from "./ImageViewer";
import HtmlDocViewer from "./HtmlDocViewer";
import type { FileKind } from "@/lib/validation";

// react-pdf touches the DOM at import; load it only in the browser, only here.
const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="viewer-frame items-center justify-center text-sm text-[var(--muted)]">
      Loading viewer…
    </div>
  ),
});

/**
 * Routes a note to the right renderer. New uploads are PDF (incl. images
 * wrapped to PDF at upload); md/docx render as HTML in the same bounded frame.
 * `image` remains for notes uploaded before the image→PDF change.
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

  if (fileKind === "pdf") return <PdfViewer src={src} />;
  if (fileKind === "image") return <ImageViewer src={src} />;
  return (
    <HtmlDocViewer
      src={src}
      html={renderedHtml ?? undefined}
      kind={fileKind === "docx" ? "docx" : "md"}
    />
  );
}
