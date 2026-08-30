-- ===========================================================================
-- 0001_init.sql  -  core schema
-- Tables: profiles, subjects, notes, comments   (+ subject_stats view)
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --- roles -----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'user');
  end if;
end$$;

-- --- profiles (1:1 with auth.users) --------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application profile + role for each authenticated user. Row is created by the handle_new_user() trigger, never by the client.';

-- --- subjects ------------------------------------------------------------
create table if not exists public.subjects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(btrim(name)) between 1 and 200),
  code       text not null check (char_length(btrim(code)) between 1 and 40),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- case-insensitive unique subject code
create unique index if not exists subjects_code_key
  on public.subjects (lower(code));

-- --- notes (files tied to a subject) -----------------------------------
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references public.subjects (id) on delete cascade,
  title        text not null check (char_length(btrim(title)) between 1 and 300),
  description  text,
  doc_date     date,
  session_tag  text check (session_tag is null or char_length(session_tag) <= 80),
  storage_path text not null,
  file_kind    text not null check (file_kind in ('pdf', 'md', 'docx', 'image')),
  mime_type    text,
  file_size    bigint check (file_size is null or file_size >= 0),
  thumbs_up    integer not null default 0 check (thumbs_up >= 0),
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists notes_subject_id_idx on public.notes (subject_id);
create index if not exists notes_created_at_idx on public.notes (created_at desc);

-- --- comments (text only, one level of nesting) -----------------------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid not null references public.notes (id) on delete cascade,
  parent_id   uuid references public.comments (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  body        text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create index if not exists comments_note_id_idx on public.comments (note_id, created_at);
create index if not exists comments_parent_id_idx on public.comments (parent_id);

-- --- aggregated per-subject metrics -----------------------------------
create or replace view public.subject_stats as
select
  s.id                                   as subject_id,
  count(n.id)                            as note_count,
  coalesce(sum(n.thumbs_up), 0)::bigint  as total_thumbs_up
from public.subjects s
left join public.notes n on n.subject_id = s.id
group by s.id;

comment on view public.subject_stats is
  'Per-subject note count and summed thumbs-up, for the dashboard tile badges.';
