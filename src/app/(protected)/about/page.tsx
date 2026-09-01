import Image from "next/image";
import { ALLOWED_DOMAIN } from "@/lib/auth/domain";
import {
  CONTRIBUTORS,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  REPO_URL,
  BATCH_LABEL,
  BATCH_MOTTO,
  BATCH_PHOTO,
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
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>

      <div className="mt-6 space-y-4 text-[var(--muted)]">
        <p>
          The XLRI Notes Portal is a place for our batch to share study material.
          An administrator uploads notes &mdash; PDFs, Markdown, Word documents
          and scanned images &mdash; organised by subject. You browse and search
          subjects, read notes in a viewer that blocks copying, downloading and
          printing, and discuss in text-only threads.
        </p>
        <p>
          Access is restricted to{" "}
          <span className="font-medium text-[var(--text)]">
            @{ALLOWED_DOMAIN}
          </span>{" "}
          accounts, checked at sign-in, in the API and by a database rule. It
          runs entirely on free infrastructure.
        </p>
      </div>

      <figure className="mt-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <Image
          src={BATCH_PHOTO}
          alt={`XLRI ${BATCH_LABEL}`}
          width={1280}
          height={744}
          priority
          className="h-auto w-full"
        />
        <figcaption className="px-6 py-5 text-center">
          <p className="text-lg font-semibold tracking-tight">
            &ldquo;{BATCH_MOTTO}&rdquo;
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">&mdash; {BATCH_LABEL}</p>
        </figcaption>
      </figure>

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

      <h2 className="mt-12 text-xl font-semibold">Help &amp; support</h2>
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
        Source:{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          github.com/hardik-05/xlmafia
        </a>
      </p>
    </div>
  );
}
