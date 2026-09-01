import Link from "next/link";
import { SUPPORT_MAILTO } from "@/lib/site";

export default function TopBar({
  displayName,
  isAdmin,
}: {
  displayName: string;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/dashboard" className="font-semibold">
          XLRI Notes
        </Link>
        <div className="ml-auto flex items-center gap-4 text-sm text-[var(--muted)]">
          {isAdmin && (
            <Link href="/admin" className="hover:text-[var(--text)]">
              Admin
            </Link>
          )}
          <a
            href={SUPPORT_MAILTO}
            className="hidden hover:text-[var(--text)] sm:inline"
          >
            Support
          </a>
          <span className="hidden max-w-[16ch] truncate sm:inline">
            {displayName}
          </span>
          <a href="/auth/signout" className="hover:text-[var(--text)]">
            Sign out
          </a>
        </div>
      </div>
    </header>
  );
}
