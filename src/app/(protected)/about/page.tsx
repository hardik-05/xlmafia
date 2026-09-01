import Image from "next/image";
import {
  CONTRIBUTORS,
  SUPPORT_CONTACTS,
  BATCH_LABEL,
  BATCH_MOTTO,
  BATCH_PHOTO,
  SITE_NAME,
} from "@/lib/site";

export const metadata = { title: "About · XL Notes" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>

      <p className="mt-6 text-[var(--muted)]">
        {SITE_NAME} is a portal for our batch to share study material.
      </p>

      <figure className="mt-10 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
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
        {CONTRIBUTORS.map((c) => (
          <div
            key={c.handle}
            className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--accent-weak)] text-sm font-bold text-[var(--on-accent-weak)]">
              {c.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{c.name}</span>
              <span className="block text-sm text-[var(--muted)]">{c.role}</span>
              <span className="block text-xs text-[var(--muted)]">
                {c.handle}
              </span>
            </span>
          </div>
        ))}
      </div>

      <h2 id="support" className="mt-12 scroll-mt-24 text-xl font-semibold">
        Help &amp; support
      </h2>
      <ul className="mt-4 space-y-3">
        {SUPPORT_CONTACTS.map((s) => (
          <li
            key={s.email}
            className="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="text-sm text-[var(--muted)]">{s.label}</span>
            <a
              href={`mailto:${s.email}?subject=${encodeURIComponent(
                `XL Notes - ${s.label}`,
              )}`}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              {s.email}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
