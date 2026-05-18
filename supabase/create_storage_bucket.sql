-- ========================================
-- Create 'media' storage bucket and policies
-- ========================================

-- Insert the 'media' bucket
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Ensure RLS is enabled
alter table storage.objects enable row level security;

-- Drop policies if they exist to avoid conflict
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Full insert access" on storage.objects;
drop policy if exists "Full update access" on storage.objects;
drop policy if exists "Full delete access" on storage.objects;

-- Create policies for media bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'media' );

create policy "Full insert access"
on storage.objects for insert
with check ( bucket_id = 'media' and auth.role() = 'authenticated' );

create policy "Full update access"
on storage.objects for update
using ( bucket_id = 'media' and auth.role() = 'authenticated' );

create policy "Full delete access"
on storage.objects for delete
using ( bucket_id = 'media' and auth.role() = 'authenticated' );
