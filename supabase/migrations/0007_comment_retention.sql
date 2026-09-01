-- ===========================================================================
-- 0007_comment_retention.sql
-- Automatically delete comments older than 30 days (daily job via pg_cron).
-- ===========================================================================

create extension if not exists pg_cron;

-- Reusable cleanup function (also runnable by hand).
create or replace function public.purge_old_comments()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.comments
  where created_at < now() - interval '30 days';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.purge_old_comments() from public, anon, authenticated;

-- Schedule daily at 03:30 UTC. cron.schedule upserts by job name.
select cron.schedule(
  'purge-old-comments',
  '30 3 * * *',
  $$select public.purge_old_comments();$$
);
