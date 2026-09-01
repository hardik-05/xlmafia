# XLRI Secure Notes Portal

A domain-restricted study-notes portal. An **Admin** uploads study material
(PDF / Markdown / DOCX / scanned images) organised by **Subject**, tagging each
with a topic name, date and session ID. Authenticated users from
`@astra.xlri.ac.in` can search subjects and read notes in a
**copy / download-hardened viewer** (page-wise, single or two-page) and discuss
in text-only comment threads.

Built to run entirely on **free tiers** (Vercel Hobby + Supabase Free) for a POC
of up to ~45 concurrent users.

- **Live:** https://xlmafia.com
- **Supabase project:** `lyinnonapazyflaccmmt` (ap-south-1), schema + RLS applied

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Auth + DB | Supabase Auth + Postgres (`@supabase/ssr`) |
| Storage | Supabase Storage (private bucket `notes`), bytes proxied through an auth-gated API route |
| PDF / DOCX rendering | `pdfjs-dist` → `<canvas>` (no selectable text), `mammoth` → sanitized HTML |
| Markdown | `marked` + `DOMPurify` |

## Architecture

```
Browser ──▶ Next.js middleware ──▶ App Router (RSC + route handlers)
                 │                        │
                 │ session refresh        ├─ /api/*  server-only Supabase calls
                 │ absolute-expiry gate   │
                 │ /admin role gate       ▼
                 └────────────────▶ Supabase (Auth, Postgres w/ RLS, Storage)
```

- **Auth**: Google OAuth (Workspace `hd` hint) + Email Magic Link. Domain is enforced
  in four places: login form, `/api/otp`, the OAuth callback, and a Postgres
  `AFTER INSERT` trigger on `auth.users` (hard backstop).
- **RBAC**: `profiles.role` (`admin` | `user`). Every protected route passes through
  `middleware.ts`; `/admin/*` additionally re-checks the role server-side. All write
  paths are also gated by **Row Level Security** so a forged client cannot insert
  subjects/notes.
- **Sessions**: 4h inactivity auto-logout (client activity listeners) + an absolute
  cap enforced in middleware — 4h normally, 48h when "Stay logged in" is ticked.
- **Secure viewer**: documents are fetched only through `/api/notes/[id]/file`
  (authenticated, `no-store`, `Content-Disposition: inline`); the raw storage URL is
  never sent to the client. PDFs render to `<canvas>` with the text layer disabled,
  images render as non-draggable CSS backgrounds, and the whole surface blocks
  selection, context menu, drag, copy/cut, and the Ctrl/Cmd+C/P/S/U shortcuts. A
  global print stylesheet blanks the page.

### Honest limitation

Client-side "no download / no copy" stops normal user actions. It **cannot** stop
screenshots, a determined user with DevTools, or OS-level screen capture. This is a
deterrent layered on RLS + auth, not DRM.

## Module map

| Module | Where |
| --- | --- |
| 1 – Auth & RBAC | `src/middleware.ts`, `src/app/login`, `src/app/auth/*`, `src/lib/auth/*`, `supabase/migrations/0002*`, `0003*` |
| 2 – Admin & content | `src/app/admin/*`, `src/app/api/subjects`, `src/app/api/notes` |
| 3 – Discovery | `src/app/(protected)/dashboard`, `src/app/(protected)/subjects/[id]`, `src/components/Subject*`, `SearchBar` |
| 4 – Secure renderer | `src/components/secure/*` |
| 5 – Interaction | `src/components/LikeButton.tsx`, `src/components/CommentThread.tsx`, `src/app/api/notes/[id]/like`, `src/app/api/comments` |
| 6 – Deploy & docs | `.env.example`, `SETUP.md`, `supabase/migrations/*` |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase values
npm run dev
```

See **[SETUP.md](./SETUP.md)** for the full Supabase + Google OAuth + Vercel + first-admin walkthrough.

## Free-tier notes (~45 users)

- Supabase Free: 500 MB DB, 1 GB storage, 50k MAU — comfortably within scope.
- Document bytes are streamed through a Vercel function; keep individual files modest
  (a few MB) so the Hobby function stays well under limits.
- The subject list is small, so search filters client-side with no extra queries.
