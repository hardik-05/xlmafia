import Image from "next/image";
import {
  CRS,
  CONTRIBUTORS,
  SUPPORT_CONTACTS,
  BATCH_LABEL,
  BATCH_MOTTO,
  BATCH_PHOTO,
  SITE_NAME,
  handleMailto,
  type Person,
} from "@/lib/site";

export const metadata = { title: "About · XL Notes" };

function PeopleGrid({ people }: { people: Person[] }) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {people.map((p) => (
        <div
          key={p.handle}
          className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--accent-weak-hover)] hover:bg-[var(--nav-hover)]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--accent-weak)] text-sm font-bold text-[var(--on-accent-weak)]">
            {p.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium">{p.name}</span>
            <span className="block text-sm text-[var(--muted)]">{p.role}</span>
            <a
              href={handleMailto(p.handle, `XL Notes - ${p.name}`)}
              className="mt-0.5 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
            >
              {p.handle}
            </a>
          </span>
        </div>
      ))}
    </div>
  );
}

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

      <h2 className="mt-12 text-xl font-semibold">CR</h2>
      <PeopleGrid people={CRS} />

      <h2 className="mt-12 text-xl font-semibold">Contributors</h2>
      <PeopleGrid people={CONTRIBUTORS} />

      <h2
        id="support"
        className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-3 scroll-mt-24"
      >
        <span className="text-xl font-semibold">Help &amp; support</span>
        <div className="flex flex-wrap gap-2">
          {SUPPORT_CONTACTS.map((s) => (
            <a
              key={s.label}
              href={`mailto:${s.email}?subject=${encodeURIComponent(
                `XL Notes - ${s.label}`,
              )}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium transition hover:border-[var(--accent-weak-hover)] hover:bg-[var(--nav-hover)]"
            >
              {s.label}
            </a>
          ))}
        </div>
      </h2>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Tap a topic to email the right person.
      </p>
    </div>
  );
}
