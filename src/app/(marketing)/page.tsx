import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ALLOWED_DOMAIN } from "@/lib/auth/domain";
import { SUPPORT_MAILTO } from "@/lib/site";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    title: "Organised by subject",
    body: "Every note lives under a subject with a code. Search filters subjects by name or code as you type.",
  },
  {
    title: "Protected viewer",
    body: "PDFs render to canvas, scans render without a draggable image, and copy, right-click, download and print are blocked.",
  },
  {
    title: "Discuss",
    body: "Text-only comment threads with one level of replies, so questions get answered in context.",
  },
  {
    title: "Domain-restricted",
    body: `Only @${ALLOWED_DOMAIN} accounts can sign in, enforced at the form, the API and the database.`,
  },
];

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Open dashboard" : "Sign in";

  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <p className="mb-4 inline-block rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
          For {ALLOWED_DOMAIN}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          A private home for XLRI study material.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--muted)]">
          Browse subject notes, read them in a copy-protected viewer and ask
          questions in the comments. Sign-in is limited to your institute email.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={primaryHref}
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-contrast)] transition hover:opacity-90"
          >
            {primaryLabel}
          </Link>
          <Link
            href="/about"
            className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            About the project
          </Link>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)]/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <h2 className="text-sm font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Need access or hit a problem?</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Accounts are provisioned by the admin. Email us and we&apos;ll sort
              it out.
            </p>
          </div>
          <a
            href={SUPPORT_MAILTO}
            className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-sm font-medium transition hover:border-[var(--accent)]"
          >
            Contact support
          </a>
        </div>
      </section>
    </main>
  );
}
