import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FileKind } from "@/lib/types";
import SubjectNotesAdmin from "./SubjectNotesAdmin";

export const dynamic = "force-dynamic";

export interface AdminNote {
  id: string;
  title: string;
  description: string | null;
  session_tag: string | null;
  doc_date: string | null;
  file_kind: FileKind;
  file_size: number | null;
  created_at: string;
}

export default async function AdminSubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, code")
    .eq("id", id)
    .single();
  if (!subject) notFound();

  const { data: notes } = await supabase
    .from("notes")
    .select(
      "id, title, description, session_tag, doc_date, file_kind, file_size, created_at",
    )
    .eq("subject_id", id)
    .order("created_at", { ascending: false });

  return (
    <SubjectNotesAdmin
      subject={subject}
      notes={(notes ?? []) as AdminNote[]}
    />
  );
}
