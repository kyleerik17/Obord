-- O'BORD - Notifications d'équipe, messages de contact et journal des demandes
-- À exécuter une seule fois dans Supabase > SQL Editor.

begin;

-- Contact inbox: visitors can create a message, only organizers can read it.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  email text not null check (char_length(email) between 3 and 254),
  subject text check (subject is null or char_length(subject) <= 120),
  body text not null check (char_length(btrim(body)) between 10 and 3000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  read_by uuid references auth.users(id) on delete set null
);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
grant insert (name, email, subject, body) on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
grant update (read_at, read_by) on public.contact_messages to authenticated;

drop policy if exists "Visitors can send O'BORD a message" on public.contact_messages;
create policy "Visitors can send O'BORD a message"
on public.contact_messages for insert to anon, authenticated
with check (
  char_length(btrim(name)) between 2 and 80
  and char_length(email) between 3 and 254
  and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  and (subject is null or char_length(subject) <= 120)
  and char_length(btrim(body)) between 10 and 3000
);

drop policy if exists "Organizers can read O'BORD contact messages" on public.contact_messages;
create policy "Organizers can read O'BORD contact messages"
on public.contact_messages for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

drop policy if exists "Organizers can mark O'BORD contact messages read" on public.contact_messages;
create policy "Organizers can mark O'BORD contact messages read"
on public.contact_messages for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer')
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer'
  and (read_by is null or read_by = (select auth.uid()))
);

create index if not exists contact_messages_unread_idx
  on public.contact_messages (created_at desc) where read_at is null;
create index if not exists contact_messages_email_created_idx
  on public.contact_messages (lower(email), created_at desc);

-- Per-address throttle as a first spam barrier; the advisory lock avoids races.
create or replace function public.guard_contact_message_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
  normalized_email text := lower(btrim(new.email));
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(normalized_email, 0));
  select count(*)::integer into current_count
  from public.contact_messages
  where lower(email) = normalized_email and created_at >= now() - interval '1 hour';

  if current_count >= 5 then
    raise exception 'contact_message_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_contact_message_rate() from public, anon, authenticated;
drop trigger if exists contact_messages_rate_limit on public.contact_messages;
create trigger contact_messages_rate_limit
before insert on public.contact_messages
for each row execute function public.guard_contact_message_rate();

-- Audit entries omit contact data and birth years; actor identity is retained.
create table if not exists public.event_registration_audit (
  id bigint generated always as identity primary key,
  registration_id uuid references public.event_registrations(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null check (action in ('created', 'status_changed', 'details_changed')),
  previous_status text,
  next_status text,
  previous_group_size integer,
  next_group_size integer,
  previous_attendance_type text,
  next_attendance_type text,
  created_at timestamptz not null default now()
);

alter table public.event_registration_audit enable row level security;
revoke all on public.event_registration_audit from anon, authenticated;
grant select on public.event_registration_audit to authenticated;

drop policy if exists "Organizers can read reservation audit" on public.event_registration_audit;
create policy "Organizers can read reservation audit"
on public.event_registration_audit for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

create index if not exists event_registration_audit_created_idx
  on public.event_registration_audit (created_at desc);
create index if not exists event_registration_audit_registration_idx
  on public.event_registration_audit (registration_id, created_at desc);

create or replace function public.audit_event_registration_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  action_name text;
begin
  if tg_op = 'INSERT' then
    action_name := 'created';
    insert into public.event_registration_audit (
      registration_id, event_id, actor_id, actor_email, action,
      next_status, next_group_size, next_attendance_type
    ) values (
      new.id, new.event_id, (select auth.uid()), (select auth.jwt() ->> 'email'), action_name,
      new.reservation_status, new.group_size, new.attendance_type
    );
    return new;
  end if;

  if old.reservation_status is distinct from new.reservation_status then
    action_name := 'status_changed';
  elsif old.group_size is distinct from new.group_size or old.attendance_type is distinct from new.attendance_type then
    action_name := 'details_changed';
  else
    return new;
  end if;

  insert into public.event_registration_audit (
    registration_id, event_id, actor_id, actor_email, action,
    previous_status, next_status, previous_group_size, next_group_size,
    previous_attendance_type, next_attendance_type
  ) values (
    new.id, new.event_id, (select auth.uid()), (select auth.jwt() ->> 'email'), action_name,
    old.reservation_status, new.reservation_status, old.group_size, new.group_size,
    old.attendance_type, new.attendance_type
  );
  return new;
end;
$$;

revoke all on function public.audit_event_registration_change() from public, anon, authenticated;
drop trigger if exists event_registrations_audit_changes on public.event_registrations;
create trigger event_registrations_audit_changes
after insert or update on public.event_registrations
for each row execute function public.audit_event_registration_change();

-- Notify the back-office only; Realtime still applies organizer SELECT policies.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'contact_messages'
  ) then
    alter publication supabase_realtime add table public.contact_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'event_registrations'
  ) then
    alter publication supabase_realtime add table public.event_registrations;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'event_registration_audit'
  ) then
    alter publication supabase_realtime add table public.event_registration_audit;
  end if;
end $$;

commit;
