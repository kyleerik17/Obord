-- O'BORD - Articles publics et miniatures gérés depuis l'espace équipe.
-- À exécuter dans Supabase > SQL Editor après obord_schema.sql et obord_backoffice.sql.

begin;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 4 and 120),
  excerpt text not null check (char_length(excerpt) <= 280),
  content text not null check (char_length(content) between 20 and 30000),
  cover_image_path text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc)
  where status = 'published';

alter table public.blog_posts enable row level security;

revoke all on public.blog_posts from anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;

drop policy if exists "Anyone can read published O'BORD articles" on public.blog_posts;
create policy "Anyone can read published O'BORD articles"
on public.blog_posts for select to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "Organizers can read all O'BORD articles" on public.blog_posts;
create policy "Organizers can read all O'BORD articles"
on public.blog_posts for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

drop policy if exists "Organizers can create O'BORD articles" on public.blog_posts;
create policy "Organizers can create O'BORD articles"
on public.blog_posts for insert to authenticated
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer'
  and created_by = (select auth.uid())
);

drop policy if exists "Organizers can update O'BORD articles" on public.blog_posts;
create policy "Organizers can update O'BORD articles"
on public.blog_posts for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

drop policy if exists "Organizers can delete O'BORD articles" on public.blog_posts;
create policy "Organizers can delete O'BORD articles"
on public.blog_posts for delete to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obord-blog-covers', 'obord-blog-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "O'BORD organizers upload blog covers" on storage.objects;
create policy "O'BORD organizers upload blog covers"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'obord-blog-covers'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer'
);

drop policy if exists "O'BORD organizers delete blog covers" on storage.objects;
create policy "O'BORD organizers delete blog covers"
on storage.objects for delete to authenticated
using (
  bucket_id = 'obord-blog-covers'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer'
);

commit;
