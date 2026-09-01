import Link from "next/link";
import { ALLOWED_DOMAIN } from "@/lib/auth/domain";
import {
  CONTRIBUTORS,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  REPO_URL,
} from "@/lib/site";

export const metadata = { title: "About - XLRI Notes Portal" };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>

      <div className="mt-6 space-y-4 text-[var(--muted)]">
        <p>
          The XLRI Notes Portal is a proof-of-concept for sharing study material
          within the institute. An administrator uploads notes &mdash; PDFs,
          Markdown, Word documents and scanned images &mdash; organised by
          subject. Signed-in students browse and search subjects, read notes in a
          viewer that blocks copying, downloading and printing, discuss in
          text-only threads and upvote what they find useful.
        </p>
        <p>
          Access is restricted to{" "}
          <span className="font-medium text-[var(--text)]">
            @{ALLOWED_DOMAIN}
          </span>{" "}
          email addresses, checked in the sign-in form, in the API and again by a
          database rule. It runs entirely on free infrastructure.
        </p>
      </div>

      <h2 className="mt-12 text-xl font-semibold">Contributors</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {CONTRIBUTORS.map((c, i) => (
          <a
            key={`${c.handle}-${i}`}
            href={c.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent)]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-semibold text-[var(--accent)]">
              {initials(c.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{c.name}</span>
              <span className="block text-sm text-[var(--muted)]">{c.role}</span>
              <span className="block text-xs text-[var(--muted)]">
                @{c.handle}
              </span>
            </span>
          </a>
        ))}
      </div>

      <h2 className="mt-12 text-xl font-semibold">Support</h2>
      <p className="mt-3 text-[var(--muted)]">
        Questions, access requests or bug reports go to{" "}
        <a
          href={SUPPORT_MAILTO}
          className="font-medium text-[var(--accent)] hover:underline"
        >
          {SUPPORT_EMAIL}
        </a>
        .
      </p>

      <p className="mt-8 text-sm text-[var(--muted)]">
        Source code:{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          github.com/hardik-05/xlmafia
        </a>{" "}
        &middot; <Link href="/" className="hover:underline">Back to home</Link>
      </p>
    </main>
  );
}
