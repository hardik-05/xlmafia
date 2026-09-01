import Link from "next/link";
import { SITE_NAME, SUPPORT_MAILTO, SUPPORT_EMAIL, REPO_URL } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-medium text-[var(--text)]">{SITE_NAME}</span>
          <span className="mx-2">·</span>
          <span>Personal study use only. Do not copy or redistribute.</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/" className="hover:text-[var(--text)]">
            Home
          </Link>
          <Link href="/about" className="hover:text-[var(--text)]">
            About
          </Link>
          <Link href="/login" className="hover:text-[var(--text)]">
            Sign in
          </Link>
          <a
            href={SUPPORT_MAILTO}
            className="hover:text-[var(--text)]"
            title={`Email ${SUPPORT_EMAIL}`}
          >
            Support
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-[var(--text)]"
          >
            Source
          </a>
        </nav>
      </div>
    </footer>
  );
}
