-- ===========================================================================
-- 0002_functions_triggers.sql
--   is_admin()               - role check helper (security definer)
--   handle_new_user()        - domain gate + profile row on signup
--   enforce_comment_depth()  - one level of nesting only
--   increment_thumbs_up()    - anonymous like RPC
-- ===========================================================================

-- --- role helper -------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- --- signup: enforce email domain, create profile --------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_domain constant text := 'astra.xlri.ac.in';
  email_domain   text;
begin
  email_domain := lower(split_part(coalesce(new.email, ''), '@', 2));

  if email_domain is distinct from allowed_domain then
    raise exception 'Signups are restricted to @% addresses (got %)',
      allowed_domain, new.email
      using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )), ''),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- keep profile.email in sync if it ever changes -------------------
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_change on auth.users;
create trigger on_auth_user_email_change
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- --- comment depth: replies may not have replies --------------------
create or replace function public.enforce_comment_depth()
returns trigger
language plpgsql
as $$
declare
  parent_parent uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select parent_id into parent_parent
  from public.comments
  where id = new.parent_id;

  if not found then
    raise exception 'Parent comment % does not exist', new.parent_id
      using errcode = 'foreign_key_violation';
  end if;

  if parent_parent is not null then
    raise exception 'Comment threads are limited to one level of replies'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_comment_depth on public.comments;
create trigger trg_enforce_comment_depth
  before insert on public.comments
  for each row execute function public.enforce_comment_depth();

-- --- anonymous thumbs-up --------------------------------------------
-- No user association is stored. Any authenticated user may bump the counter;
-- the client keeps a one-per-browser guard in localStorage.
create or replace function public.increment_thumbs_up(p_note_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.notes
  set thumbs_up = thumbs_up + 1
  where id = p_note_id
  returning thumbs_up into new_count;

  if not found then
    raise exception 'Note % not found', p_note_id
      using errcode = 'no_data_found';
  end if;

  return new_count;
end;
$$;

revoke all on function public.increment_thumbs_up(uuid) from public;
grant execute on function public.increment_thumbs_up(uuid) to authenticated;
