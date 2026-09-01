import { z } from "zod";

export const FILE_KINDS = ["pdf", "md", "docx", "image"] as const;
export type FileKind = (typeof FILE_KINDS)[number];

/** Maps an upload's MIME/extension to our stored file_kind, or null if unsupported. */
export function classifyFile(name: string, mime: string): FileKind | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  )
    return "docx";
  if (
    ["text/markdown", "text/x-markdown", "text/plain"].includes(mime) ||
    ext === "md" ||
    ext === "markdown"
  )
    return "md";
  if (
    ["image/png", "image/jpeg"].includes(mime) ||
    ["png", "jpg", "jpeg"].includes(ext)
  )
    return "image";
  return null;
}

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB, matches the storage bucket

export const otpRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  stay: z.boolean().optional().default(false),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required").max(200),
  code: z
    .string()
    .trim()
    .min(1, "Subject code is required")
    .max(40)
    .regex(
      /^[A-Za-z0-9 ._/-]+$/,
      "Code may use letters, numbers, spaces and . _ / -",
    ),
});
export type SubjectInput = z.infer<typeof subjectSchema>;

export const noteMetadataSchema = z.object({
  subjectId: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(300),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  docDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  sessionTag: z.string().trim().max(80).optional().or(z.literal("")),
  storagePath: z.string().min(1),
  fileKind: z.enum(FILE_KINDS),
  mimeType: z.string().max(200).optional(),
  fileSize: z.number().int().nonnegative().max(MAX_FILE_BYTES).optional(),
  // Pre-sanitised HTML for md/docx, produced at upload time. ~5 MB ceiling.
  renderedHtml: z.string().max(5_000_000).optional(),
});
export type NoteMetadataInput = z.infer<typeof noteMetadataSchema>;

export const commentSchema = z.object({
  noteId: z.string().uuid(),
  parentId: z.string().uuid().nullish(),
  // Text only. Newlines allowed; sanitizeCommentBody strips control chars.
  body: z.string().trim().min(1, "Say something").max(4000),
});
export type CommentInput = z.infer<typeof commentSchema>;

/**
 * Strips control characters (keeps tab and newline) and zero-width / bidi /
 * separator characters, then collapses runs of blank lines. Keeps comments
 * strictly plain text.
 */
export function sanitizeCommentBody(raw: string): string {
  const kept = Array.from(raw)
    .filter((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      if (c === 0x09 || c === 0x0a) return true; // tab, newline
      if (c < 0x20 || c === 0x7f) return false; // C0 controls + DEL
      if (c >= 0x200b && c <= 0x200f) return false; // zero-width + bidi marks
      if (c === 0x2028 || c === 0x2029) return false; // line / paragraph separators
      if (c === 0x2060 || c === 0xfeff) return false; // word joiner / BOM
      return true;
    })
    .join("");

  return kept.replace(/\r\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
}
