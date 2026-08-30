-- ===========================================================================
-- 0005_security_hardening.sql  -  address database linter findings
--   * subject_stats: run with security_invoker so RLS of the caller applies
--   * enforce_comment_depth: pin search_path
--   * trigger functions: not callable as RPC by anyone
--   * is_admin / increment_thumbs_up: callable only by signed-in users
-- ===========================================================================

-- View should honour the querying user's RLS, not the view owner's.
alter view public.subject_stats set (security_invoker = on);

-- Pin search_path on the remaining trigger function.
create or replace function public.enforce_comment_depth()
returns trigger
language plpgsql
set search_path = ''
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

-- Trigger functions must never be reachable through PostgREST /rpc.
-- (Triggers still fire; they run as the table owner regardless of EXECUTE.)
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_email_change() from public, anon, authenticated;

-- Helper + like RPC: signed-in users only, never anon.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke all on function public.increment_thumbs_up(uuid) from public, anon;
grant execute on function public.increment_thumbs_up(uuid) to authenticated;
