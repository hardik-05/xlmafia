-- ===========================================================================
-- 0004_storage.sql  -  private "notes" bucket + policies
-- Bytes are never served straight from storage to the browser. The app's
-- /api/notes/[id]/file route (service role) is the only reader; here we allow
-- admins to manage objects and deny everyone else.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'notes',
  'notes',
  false,
  52428800, -- 50 MB per file
  array[
    'application/pdf',
    'text/markdown',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admin-only management of objects in the "notes" bucket.
drop policy if exists notes_bucket_admin_read on storage.objects;
create policy notes_bucket_admin_read
  on storage.objects for select
  to authenticated
  using (bucket_id = 'notes' and public.is_admin());

drop policy if exists notes_bucket_admin_insert on storage.objects;
create policy notes_bucket_admin_insert
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'notes' and public.is_admin());

drop policy if exists notes_bucket_admin_update on storage.objects;
create policy notes_bucket_admin_update
  on storage.objects for update
  to authenticated
  using (bucket_id = 'notes' and public.is_admin())
  with check (bucket_id = 'notes' and public.is_admin());

drop policy if exists notes_bucket_admin_delete on storage.objects;
create policy notes_bucket_admin_delete
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'notes' and public.is_admin());
