-- ===========================================================================
-- 0003_rls.sql  -  Row Level Security
-- Non-admins can read everything they need but can only write comments.
-- Subjects and notes are admin-write-only, enforced here (not just in the UI).
-- ===========================================================================

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.notes    enable row level security;
alter table public.comments enable row level security;

-- --- profiles --------------------------------------------------------
-- Any authenticated user can read profiles (needed to show commenter names
-- and to resolve roles); a user can update only their own display name;
-- inserts happen only via the signup trigger; deletes are cascade-only.
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

-- --- subjects -------------------------------------------------------
drop policy if exists subjects_select_authenticated on public.subjects;
create policy subjects_select_authenticated
  on public.subjects for select
  to authenticated
  using (true);

drop policy if exists subjects_admin_insert on public.subjects;
create policy subjects_admin_insert
  on public.subjects for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists subjects_admin_update on public.subjects;
create policy subjects_admin_update
  on public.subjects for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists subjects_admin_delete on public.subjects;
create policy subjects_admin_delete
  on public.subjects for delete
  to authenticated
  using (public.is_admin());

-- --- notes ---------------------------------------------------------
drop policy if exists notes_select_authenticated on public.notes;
create policy notes_select_authenticated
  on public.notes for select
  to authenticated
  using (true);

drop policy if exists notes_admin_insert on public.notes;
create policy notes_admin_insert
  on public.notes for insert
  to authenticated
  with check (public.is_admin());

-- Admin updates only. The public thumbs-up path goes through the
-- security-definer RPC, which bypasses RLS, so no broad UPDATE grant is needed.
drop policy if exists notes_admin_update on public.notes;
create policy notes_admin_update
  on public.notes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists notes_admin_delete on public.notes;
create policy notes_admin_delete
  on public.notes for delete
  to authenticated
  using (public.is_admin());

-- --- comments ----------------------------------------------------
drop policy if exists comments_select_authenticated on public.comments;
create policy comments_select_authenticated
  on public.comments for select
  to authenticated
  using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own
  on public.comments for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists comments_update_own on public.comments;
create policy comments_update_own
  on public.comments for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists comments_delete_own_or_admin on public.comments;
create policy comments_delete_own_or_admin
  on public.comments for delete
  to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- --- grants (RLS still applies on top) --------------------------
grant usage on schema public to authenticated;
grant select on public.subject_stats to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select on public.subjects, public.notes, public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
