import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin, requireUser, withErrors } from "@/lib/api";
import { subjectSchema } from "@/lib/validation";
import type { SubjectWithStats } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/subjects - list all subjects with aggregate stats (any signed-in user). */
export const GET = withErrors(async () => {
  const { supabase } = await requireUser();

  const [{ data: subjects, error: sErr }, { data: stats, error: stErr }] =
    await Promise.all([
      supabase
        .from("subjects")
        .select("id, name, code, created_at")
        .order("name", { ascending: true }),
      supabase
        .from("subject_stats")
        .select("subject_id, note_count, total_thumbs_up"),
    ]);

  if (sErr || stErr) {
    return NextResponse.json({ error: "Could not load subjects" }, { status: 500 });
  }

  const byId = new Map(
    (stats ?? []).map((s) => [s.subject_id as string, s]),
  );

  const merged: SubjectWithStats[] = (subjects ?? []).map((s) => {
    const st = byId.get(s.id);
    return {
      ...s,
      note_count: Number(st?.note_count ?? 0),
      total_thumbs_up: Number(st?.total_thumbs_up ?? 0),
    };
  });

  return NextResponse.json({ subjects: merged });
});

/** POST /api/subjects - create a subject (admin only). */
export const POST = withErrors(async (request: NextRequest) => {
  const { supabase, userId } = await requireAdmin();

  const body = await request.json().catch(() => null);
  const parsed = subjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("subjects")
    .insert({
      name: parsed.data.name,
      code: parsed.data.code,
      created_by: userId,
    })
    .select("id, name, code, created_at")
    .single();

  if (error) {
    const conflict = error.code === "23505";
    return NextResponse.json(
      {
        error: conflict
          ? "A subject with that code already exists."
          : "Could not create the subject.",
      },
      { status: conflict ? 409 : 500 },
    );
  }

  return NextResponse.json({ subject: data }, { status: 201 });
});
