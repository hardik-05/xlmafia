import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PUBLIC_SUPPORT_MAILTO, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Open dashboard" : "Sign in";

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center">
        <span className="inline-block rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
          {SITE_NAME} · internal
        </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
          Study notes for the batch,
          <br />
          in one calm place.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
          Browse subject notes, read them in a fast in-app viewer, internally
          contributed.
          <br />
          Sign-in is limited to your institute email.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={primaryHref} className="btn btn-primary">
            {primaryLabel}
          </Link>
          <a href={PUBLIC_SUPPORT_MAILTO} className="btn btn-ghost">
            Contact support
          </a>
        </div>
      </div>
    </main>
  );
}
