-- ===========================================================================
-- 0006_iteration.sql
--   * remove the thumbs-up feature entirely
--   * add notes.rendered_html: pre-sanitised HTML for md / docx so the viewer
--     renders instantly instead of converting on every open
-- ===========================================================================

-- subject_stats references notes.thumbs_up, so drop and recreate it.
drop view if exists public.subject_stats;

alter table public.notes drop column if exists thumbs_up;
alter table public.notes add column if not exists rendered_html text;

create view public.subject_stats as
select
  s.id                       as subject_id,
  count(n.id)                as note_count
from public.subjects s
left join public.notes n on n.subject_id = s.id
group by s.id;

alter view public.subject_stats set (security_invoker = on);
grant select on public.subject_stats to authenticated;

comment on view public.subject_stats is
  'Per-subject note count for the dashboard tiles.';

-- The anonymous like RPC is no longer used.
drop function if exists public.increment_thumbs_up(uuid);
