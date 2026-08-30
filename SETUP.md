# Setup & Deployment

End-to-end walkthrough: Supabase project → database → Google OAuth → local run →
Vercel deploy → first admin. Everything here is free-tier.

---

## 1. Supabase project

A free-plan project has already been provisioned for this POC:

| | |
| --- | --- |
| Project ref | `lyinnonapazyflaccmmt` |
| Project URL | `https://lyinnonapazyflaccmmt.supabase.co` |
| Region | `ap-south-1` (Mumbai) |
| Publishable key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) | `sb_publishable_ZlCPLmKEsp0lz3NRx_dutg_XNg2CqNq` |
| `SUPABASE_SERVICE_ROLE_KEY` | **copy yourself** from Dashboard → Project Settings → API → `service_role` (secret; not retrievable via tooling) |

To create your own instead: new project at <https://supabase.com/dashboard> (Free plan,
`ap-south-1`), then read the three values from **Project Settings → API**.

## 2. Database schema

Migrations `0001`–`0005` have **already been applied** to `lyinnonapazyflaccmmt`.
For a fresh project, run them in order in **SQL Editor** (or `supabase db push`):

| Order | File | Creates |
| --- | --- | --- |
| 1 | `supabase/migrations/0001_init.sql` | enum + `profiles`, `subjects`, `notes`, `comments`, `subject_stats` view |
| 2 | `supabase/migrations/0002_functions_triggers.sql` | `is_admin()`, `handle_new_user()` (domain gate), comment-depth trigger, `increment_thumbs_up()` RPC |
| 3 | `supabase/migrations/0003_rls.sql` | RLS + policies (non-admins cannot write subjects/notes) |
| 4 | `supabase/migrations/0004_storage.sql` | private `notes` bucket + storage policies |
| 5 | `supabase/migrations/0005_security_hardening.sql` | linter fixes: `security_invoker` view, pinned `search_path`, trigger fns not RPC-exposed |

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

The Vercel project **`xlmafia`** (team *hdk's projects*, Hobby plan) is linked to the
GitHub repo `hardik-05/xlmafia`; every push to `main` auto-deploys.

- Production URL: **https://xlmafia.vercel.app**
- Project: <https://vercel.com/hdks-projects-74da0404/xlmafia>

The build compiles without env vars (values are read lazily), but **the running app
returns 500 on every route until the variables below are set** — middleware needs the
Supabase URL/key on every request. Add them, then redeploy.

1. **Vercel → Project `xlmafia` → Settings → Environment Variables** — add for
   *Production* and *Preview*:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://lyinnonapazyflaccmmt.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_ZlCPLmKEsp0lz3NRx_dutg_XNg2CqNq` |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(secret — copy from Supabase Dashboard → Settings → API)* |
   | `NEXT_PUBLIC_SITE_URL` | your production URL, e.g. `https://xlmafia.vercel.app` |
   | `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` | `astra.xlri.ac.in` |
   | `ALLOWED_EMAIL_DOMAIN` | `astra.xlri.ac.in` |

2. **Redeploy** (Deployments → ⋯ → Redeploy) so the new vars take effect — the
   `NEXT_PUBLIC_*` values are inlined at build time.

3. Add the production URL to Supabase **Authentication → URL Configuration**:
   Site URL + Redirect URL `https://<domain>/auth/callback` (see step 3).

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
