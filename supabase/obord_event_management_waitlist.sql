-- O'BORD: agenda administrable, compteur de places cohérent et liste d'attente.
-- À exécuter dans Supabase SQL Editor après les scripts O'BORD de schéma,
-- back-office, âge et galerie. Puis déconnecter/reconnecter le compte organisateur.

begin;

alter table public.events
  add column if not exists external_reserved_count integer not null default 0;
alter table public.events
  add column if not exists external_registration_url text;
alter table public.events
  drop constraint if exists events_external_reserved_count_check;
alter table public.events
  add constraint events_external_reserved_count_check
  check (external_reserved_count between 0 and 10000);
alter table public.events
  drop constraint if exists events_external_registration_url_check;
alter table public.events
  add constraint events_external_registration_url_check
  check (
    external_registration_url is null
    or (
      length(external_registration_url) <= 500
      and external_registration_url ~ '^https://(www[.])?tikko[.]ci([/?#]|$)'
    )
  );

-- The public count combines O'BORD registrations with externally maintained
-- sales (for example Tikko) without exposing attendee data.
create or replace function public.get_public_event_availability(p_event_ids uuid[])
returns table (
  event_id uuid,
  capacity integer,
  reserved_count integer,
  remaining_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id,
    e.capacity,
    e.external_reserved_count + coalesce(sum(r.group_size) filter (
      where r.reservation_status in ('pending', 'confirmed')
    ), 0)::integer,
    case when e.capacity is null then null else greatest(
      e.capacity - e.external_reserved_count - coalesce(sum(r.group_size) filter (
        where r.reservation_status in ('pending', 'confirmed')
      ), 0)::integer,
      0
    ) end
  from public.events e
  left join public.event_registrations r on r.event_id = e.id
  where coalesce(cardinality(p_event_ids), 0) between 1 and 50
    and e.id = any(p_event_ids)
    and e.status = 'published'
    and e.starts_at > now()
  group by e.id, e.capacity, e.external_reserved_count;
$$;
revoke all on function public.get_public_event_availability(uuid[]) from public, anon, authenticated;
grant execute on function public.get_public_event_availability(uuid[]) to anon, authenticated;

-- Organizer-only event creation and editing. Drafts are not readable publicly.
grant select on public.events to authenticated;
grant insert (title, event_type, starts_at, ends_at, description, venue_area, venue_name, participation_details, capacity, external_reserved_count, external_registration_url, status, created_by)
  on public.events to authenticated;
grant update (title, event_type, starts_at, ends_at, description, venue_area, venue_name, participation_details, capacity, external_reserved_count, external_registration_url, status)
  on public.events to authenticated;
drop policy if exists "Organizers can create events" on public.events;
create policy "Organizers can create events"
on public.events for insert to authenticated
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer'
  and created_by = (select auth.uid())
);
drop policy if exists "Organizers can edit events" on public.events;
create policy "Organizers can edit events"
on public.events for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

-- Capacity enforcement includes confirmed/pending O'BORD registrations and
-- the external count entered by an organizer. Event row locking serializes edits.
create or replace function public.check_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_capacity integer;
  external_reserved integer;
  already_reserved integer;
begin
  select e.capacity, e.external_reserved_count
    into event_capacity, external_reserved
  from public.events e
  where e.id = new.event_id
  for update;

  if not found then raise exception 'event_not_found'; end if;

  if new.reservation_status in ('pending', 'confirmed') and event_capacity is not null then
    select coalesce(sum(r.group_size), 0)::integer into already_reserved
    from public.event_registrations r
    where r.event_id = new.event_id
      and r.reservation_status in ('pending', 'confirmed')
      and r.id is distinct from new.id;
    if external_reserved + already_reserved + new.group_size > event_capacity then
      raise exception 'event_capacity_reached';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.check_event_capacity() from public, anon, authenticated;

create table if not exists public.event_waitlist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_name text not null check (char_length(btrim(contact_name)) between 1 and 120),
  contact_email text not null check (char_length(contact_email) between 3 and 254),
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 40),
  group_size integer not null check (group_size between 1 and 30),
  attendee_birth_years integer[] not null,
  status text not null default 'waiting' check (status in ('waiting', 'contacted', 'converted', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(attendee_birth_years) = group_size),
  check (array_position(attendee_birth_years, null) is null),
  check (1900 <= all(attendee_birth_years))
);

create unique index if not exists event_waitlist_one_active_per_user_idx
  on public.event_waitlist (event_id, user_id)
  where status in ('waiting', 'contacted');
create index if not exists event_waitlist_event_status_created_idx
  on public.event_waitlist (event_id, status, created_at);

alter table public.event_waitlist enable row level security;
revoke all on public.event_waitlist from anon, authenticated;
grant select, insert on public.event_waitlist to authenticated;
grant update (status) on public.event_waitlist to authenticated;

drop policy if exists "Participants can view own waitlist requests" on public.event_waitlist;
create policy "Participants can view own waitlist requests"
on public.event_waitlist for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists "Organizers can view event waitlist" on public.event_waitlist;
create policy "Organizers can view event waitlist"
on public.event_waitlist for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');
drop policy if exists "Participants can join event waitlist" on public.event_waitlist;
create policy "Participants can join event waitlist"
on public.event_waitlist for insert to authenticated
with check (
  user_id = (select auth.uid())
  and lower(contact_email) = lower((select auth.jwt() ->> 'email'))
  and status = 'waiting'
  and public.registration_birth_years_meet_minimum(
    attendee_birth_years,
    (select e.starts_at from public.events e where e.id = event_id)
  )
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.status = 'published' and e.starts_at > now()
  )
);
drop policy if exists "Participants can leave own waitlist" on public.event_waitlist;
create policy "Participants can leave own waitlist"
on public.event_waitlist for update to authenticated
using (user_id = (select auth.uid()) and status in ('waiting', 'contacted'))
with check (user_id = (select auth.uid()) and status = 'withdrawn');
drop policy if exists "Organizers can update waitlist status" on public.event_waitlist;
create policy "Organizers can update waitlist status"
on public.event_waitlist for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

create or replace function public.guard_event_waitlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_capacity integer;
  external_reserved integer;
  start_time timestamptz;
  event_status text;
  o_bord_reserved integer;
begin
  if tg_op = 'INSERT' then
    if new.user_id is distinct from (select auth.uid()) then
      raise exception 'waitlist_owner_required';
    end if;
    select e.capacity, e.external_reserved_count, e.starts_at, e.status
      into event_capacity, external_reserved, start_time, event_status
    from public.events e where e.id = new.event_id for update;
    if not found or event_status <> 'published' or start_time <= now() or event_capacity is null then
      raise exception 'waitlist_event_unavailable';
    end if;
    select coalesce(sum(r.group_size), 0)::integer into o_bord_reserved
    from public.event_registrations r
    where r.event_id = new.event_id and r.reservation_status in ('pending', 'confirmed');
    if external_reserved + o_bord_reserved < event_capacity then
      raise exception 'waitlist_event_has_places';
    end if;
    if not public.registration_birth_years_meet_minimum(new.attendee_birth_years, start_time) then
      raise exception 'waitlist_age_requirement';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.event_id is distinct from old.event_id
     or new.user_id is distinct from old.user_id
     or new.contact_name is distinct from old.contact_name
     or new.contact_email is distinct from old.contact_email
     or new.contact_phone is distinct from old.contact_phone
     or new.group_size is distinct from old.group_size
     or new.attendee_birth_years is distinct from old.attendee_birth_years then
    raise exception 'waitlist_details_immutable';
  end if;
  if (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer' then
    return new;
  end if;
  if new.user_id = (select auth.uid()) and new.status = 'withdrawn' and old.status in ('waiting', 'contacted') then
    return new;
  end if;
  raise exception 'waitlist_update_not_allowed';
end;
$$;
revoke all on function public.guard_event_waitlist() from public, anon, authenticated;
drop trigger if exists event_waitlist_guard on public.event_waitlist;
create trigger event_waitlist_guard
before insert or update on public.event_waitlist
for each row execute function public.guard_event_waitlist();

drop trigger if exists event_waitlist_set_updated_at on public.event_waitlist;
create trigger event_waitlist_set_updated_at before update on public.event_waitlist
for each row execute function public.set_updated_at();

-- Ask PostgREST to refresh its schema metadata (fixes stale RPC/table caches).
notify pgrst, 'reload schema';

commit;
