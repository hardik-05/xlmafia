# Setup & Deployment

End-to-end walkthrough: Supabase project → database → Google OAuth → local run →
Vercel deploy → first admin. Everything here is free-tier.

---

## 1. Supabase project

1. Create a project at <https://supabase.com/dashboard> (Free plan, region closest to
   your users — e.g. `ap-south-1` Mumbai).
2. **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / `publishable` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — keep secret)

## 2. Database schema

Run the migrations in order in **SQL Editor** (or `supabase db push` with the CLI):

| Order | File | Creates |
| --- | --- | --- |
| 1 | `supabase/migrations/0001_init.sql` | enum + `profiles`, `subjects`, `notes`, `comments`, `subject_stats` view |
| 2 | `supabase/migrations/0002_functions_triggers.sql` | `is_admin()`, `handle_new_user()` (domain gate), comment-depth trigger, `increment_thumbs_up()` RPC |
| 3 | `supabase/migrations/0003_rls.sql` | RLS + policies (non-admins cannot write subjects/notes) |
| 4 | `supabase/migrations/0004_storage.sql` | private `notes` bucket + storage policies |

## 3. Auth configuration (Dashboard — cannot be scripted)

**Authentication → URL Configuration**

- Site URL: your deployment URL (e.g. `https://xlmafia.vercel.app`); for local dev
  add `http://localhost:3000`.
- Redirect URLs: add
  - `http://localhost:3000/auth/callback`
  - `https://<your-vercel-domain>/auth/callback`

**Authentication → Providers → Email**

- Enable Email provider. Enable "Email OTP" / Magic Link. (Confirm email ON.)

**Authentication → Providers → Google**

1. In Google Cloud Console → APIs & Services → Credentials → **OAuth client ID**
   (type: Web application).
   - Authorized redirect URI: `https://<PROJECT-ref>.supabase.co/auth/v1/callback`
2. If you have a Google Workspace for `astra.xlri.ac.in`, set the OAuth consent
   screen to **Internal** — that alone restricts sign-in to the domain.
3. Paste the Client ID + Client Secret into Supabase's Google provider and save.

> The app also sends `hd=astra.xlri.ac.in` and independently rejects any other
> domain in the callback and in a DB trigger, so out-of-domain accounts cannot be
> created even if the consent screen is left "External".

## 4. Local run

```bash
npm install
cp .env.example .env.local     # paste the values from step 1
npm run dev                     # http://localhost:3000
```

## 5. Deploy to Vercel

1. Import the GitHub repo `hardik-05/xlmafia` at <https://vercel.com/new>
   (Framework preset: **Next.js**, no build overrides needed).
2. **Project → Settings → Environment Variables** — add for *Production* and *Preview*:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | from step 1 |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from step 1 (secret) |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-vercel-domain>` |
   | `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` | `astra.xlri.ac.in` |
   | `ALLOWED_EMAIL_DOMAIN` | `astra.xlri.ac.in` |

3. Redeploy. Add the Vercel domain to Supabase Site URL + Redirect URLs (step 3).

Every push to `main` auto-deploys.

## 6. Create the first admin

New users are created with role `user`. Promote yourself once, in SQL Editor:

```sql
update public.profiles
set role = 'admin'
where email = 'your-name@astra.xlri.ac.in';
```

Sign out / in; `/admin` is now reachable.

## 7. Smoke test

- Try to log in with a non-`astra.xlri.ac.in` email → rejected.
- As admin: create a subject, batch-upload a PDF + `.md` + `.docx` + PNG.
- As a normal user: `/admin` redirects away; open a note → canvas viewer, right-click
  and Ctrl+C/Ctrl+P/Ctrl+S do nothing; like it; post a comment and one reply.
