import type { FileKind } from "@/lib/validation";

export type { FileKind };

export interface Subject {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface SubjectWithStats extends Subject {
  note_count: number;
  total_thumbs_up: number;
}

export interface Note {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  doc_date: string | null;
  session_tag: string | null;
  file_kind: FileKind;
  mime_type: string | null;
  file_size: number | null;
  thumbs_up: number;
  created_at: string;
}

export interface CommentNode {
  id: string;
  note_id: string;
  parent_id: string | null;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
  replies?: CommentNode[];
}

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  pdf: "PDF",
  md: "Markdown",
  docx: "Word",
  image: "Scan",
};
