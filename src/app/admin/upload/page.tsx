import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Subject } from "@/lib/types";
import UploadManager from "./UploadManager";

export const dynamic = "force-dynamic";

export default async function AdminUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name, code, created_at")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Upload material</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          PDF, Word (.docx), Markdown (.md) and scanned images (PNG/JPG). Single
          or batch. Each file needs a topic name; date and session ID are
          optional.
        </p>
      </div>
      <UploadManager
        subjects={(subjects ?? []) as Subject[]}
        defaultSubjectId={subject}
      />
    </div>
  );
}
