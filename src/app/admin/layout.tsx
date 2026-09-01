import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin · XL Notes" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?reason=auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  // Middleware already gates /admin, this is defence in depth.
  if (profile?.role !== "admin") redirect("/dashboard?error=forbidden");

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3 sm:px-6">
          <Link
            href="/admin"
            className="mr-3 flex items-center gap-2 text-[15px] font-bold tracking-tight"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--accent-weak)] text-[13px] font-extrabold text-[var(--on-accent-weak)]">
              XL
            </span>
            Admin
          </Link>
          <Link href="/admin/subjects" className="nav-link">
            Subjects
          </Link>
          <Link href="/admin/upload" className="nav-link">
            Upload
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <Link href="/dashboard" className="nav-link">
              User view
            </Link>
            <span className="hidden px-2 text-sm text-[var(--muted)] sm:inline">
              {(profile?.email ?? "").split("@")[0]}
            </span>
            <a href="/auth/signout" className="nav-link">
              Sign out
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
