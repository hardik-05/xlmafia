import type { CSSProperties } from "react";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PUBLIC_SUPPORT_MAILTO, SITE_NAME } from "@/lib/site";
import HomePet from "@/components/HomePet";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Open dashboard" : "Sign in";

  return (
    <main className="relative flex flex-1 items-center justify-center px-6">
      <div className="hero-decor" aria-hidden="true">
        <div className="hero-grid" />
        <div className="hero-blob b1" />
        <div className="hero-blob b2" />
        <div className="hero-blob b3" />
        <div
          className="hero-card c1"
          data-pet-perch
          style={{ "--r": "-8deg" } as CSSProperties}
        >
          <div className="ln accent" />
          <div className="ln" />
          <div className="ln" style={{ width: "80%" }} />
          <div className="ln" style={{ width: "60%" }} />
        </div>
        <div
          className="hero-card c2"
          data-pet-perch
          style={{ "--r": "7deg" } as CSSProperties}
        >
          <div className="ln accent" />
          <div className="ln" />
          <div className="ln" style={{ width: "70%" }} />
        </div>
        <div
          className="hero-card c3"
          data-pet-perch
          style={{ "--r": "-5deg" } as CSSProperties}
        >
          <div className="ln accent" />
          <div className="ln" style={{ width: "85%" }} />
          <div className="ln" style={{ width: "55%" }} />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center">
        <span
          data-pet-perch
          className="inline-block rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1 text-xs font-medium text-[var(--muted)] backdrop-blur"
        >
          {SITE_NAME} · internal
        </span>

        <h1
          data-pet-perch
          className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-[3.25rem]"
        >
          Study notes for the batch,
          <br />
          <span className="bg-gradient-to-r from-[var(--accent)] to-[#a78bfa] bg-clip-text text-transparent">
            in one calm place.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
          Browse subject notes, read them in a fast in-app viewer, internally
          contributed.
          <br />
          Sign-in is limited to your institute email.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href={primaryHref} data-pet-perch className="btn btn-primary">
            {primaryLabel}
          </Link>
          <a
            href={PUBLIC_SUPPORT_MAILTO}
            data-pet-perch
            className="btn btn-ghost"
          >
            Contact support
          </a>
        </div>
      </div>

      <HomePet />
    </main>
  );
}
