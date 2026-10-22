-- O'BORD - Schema de base pour Supabase SQL Editor
-- Executez ce fichier dans Supabase > SQL Editor > New query.
-- Les données de rendez-vous sont séparées dans les fichiers seed_*.sql.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  event_type text not null check (event_type in ('sortie', 'atelier')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  description text not null check (char_length(btrim(description)) between 1 and 3000),
  venue_area text not null check (char_length(btrim(venue_area)) between 1 and 120),
  venue_name text,
  venue_details text,
  food_and_drinks text,
  participation_details text,
  capacity integer check (capacity is null or capacity > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled', 'completed')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

alter table public.events
  add column if not exists participation_details text;

create table if not exists public.event_activities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 1000),
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  user_id uuid references auth.users (id) on delete set null,
  attendance_type text not null check (attendance_type in ('solo', 'group')),
  contact_name text not null check (char_length(btrim(contact_name)) between 1 and 120),
  contact_email text not null check (char_length(btrim(contact_email)) between 3 and 254),
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 40),
  group_size integer not null default 1 check (group_size between 1 and 30),
  attendee_birth_years integer[],
  -- A reservation is one request for one person or for the whole group.
  -- The organizer confirms or declines the reservation.
  reservation_status text not null default 'pending'
    check (reservation_status in ('pending', 'confirmed', 'declined', 'cancelled')),
  attendance_confirmation text not null default 'pending'
    check (attendance_confirmation in ('pending', 'yes', 'no')),
  confirmed_attendee_count integer check (confirmed_attendee_count is null or confirmed_attendee_count between 0 and 30),
  reservation_confirmed_at timestamptz,
  attendance_confirmed_at timestamptz,
  message text check (message is null or char_length(message) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (attendance_type = 'solo' and group_size = 1)
    or (attendance_type = 'group' and group_size >= 2)
  ),
  check (confirmed_attendee_count is null or confirmed_attendee_count <= group_size),
  check (
    (attendance_confirmation = 'pending' and confirmed_attendee_count is null)
    or (attendance_confirmation = 'yes' and confirmed_attendee_count is not null and confirmed_attendee_count between 1 and group_size)
    or (attendance_confirmation = 'no' and confirmed_attendee_count is not null and confirmed_attendee_count = 0)
  )
);

create or replace function public.registration_birth_years_meet_minimum(
  p_birth_years integer[], p_event_date timestamptz
)
returns boolean language sql immutable set search_path = '' as $$
  select p_birth_years is not null and p_event_date is not null
    and cardinality(p_birth_years) > 0
    and array_position(p_birth_years, null) is null
    and 1900 <= all(p_birth_years)
    and coalesce(bool_and(
      birth_year <= extract(year from (p_event_date at time zone 'Africa/Abidjan'))::integer - 21
        - case when extract(month from (p_event_date at time zone 'Africa/Abidjan'))::integer < 7 then 1 else 0 end
    ), false)
  from unnest(p_birth_years) as birth_year
$$;

-- Upgrade the earlier O'BORD schema if it was already installed.
alter table public.event_registrations
  add column if not exists reservation_status text not null default 'pending',
  add column if not exists attendance_confirmation text not null default 'pending',
  add column if not exists confirmed_attendee_count integer,
  add column if not exists reservation_confirmed_at timestamptz,
  add column if not exists attendance_confirmed_at timestamptz,
  add column if not exists attendee_birth_years integer[],
  add column if not exists status text;

update public.event_registrations
set reservation_status = case status
  when 'confirmed' then 'confirmed'
  when 'cancelled' then 'cancelled'
  else reservation_status
end
where status is not null;

alter table public.event_registrations drop column status;
alter table public.event_registrations
  drop constraint if exists event_registrations_reservation_status_check,
  drop constraint if exists event_registrations_attendance_confirmation_check,
  drop constraint if exists event_registrations_confirmed_attendee_count_check,
  drop constraint if exists event_registrations_attendee_birth_years_check,
  drop constraint if exists event_registrations_check,
  drop constraint if exists event_registrations_check1,
  drop constraint if exists event_registrations_check2;

alter table public.event_registrations
  add constraint event_registrations_reservation_status_check
    check (reservation_status in ('pending', 'confirmed', 'declined', 'cancelled')),
  add constraint event_registrations_attendance_confirmation_check
    check (attendance_confirmation in ('pending', 'yes', 'no')),
  add constraint event_registrations_confirmed_attendee_count_check
    check (confirmed_attendee_count is null or confirmed_attendee_count between 0 and group_size),
  add constraint event_registrations_attendee_birth_years_check
    check (
      attendee_birth_years is null
      or (
        cardinality(attendee_birth_years) = group_size
        and array_position(attendee_birth_years, null) is null
        and 1900 <= all(attendee_birth_years)
        and public.registration_birth_years_meet_minimum(attendee_birth_years, created_at)
      )
    ),
  add constraint event_registrations_solo_group_size_check
    check (
      (attendance_type = 'solo' and group_size = 1)
      or (attendance_type = 'group' and group_size between 2 and 30)
    ),
  add constraint event_registrations_attendance_count_check
    check (
      (attendance_confirmation = 'pending' and confirmed_attendee_count is null)
      or (attendance_confirmation = 'yes' and confirmed_attendee_count is not null and confirmed_attendee_count between 1 and group_size)
      or (attendance_confirmation = 'no' and confirmed_attendee_count is not null and confirmed_attendee_count = 0)
    );

create index if not exists events_public_schedule_idx
  on public.events (starts_at)
  where status = 'published';

create index if not exists event_activities_schedule_idx
  on public.event_activities (event_id, sort_order, starts_at);

drop index if exists public.event_registrations_event_status_idx;
create index event_registrations_event_status_idx
  on public.event_registrations (event_id, reservation_status, created_at desc);

create unique index if not exists event_registrations_one_open_request_idx
  on public.event_registrations (event_id, user_id)
  where user_id is not null and reservation_status in ('pending', 'confirmed');

create index if not exists event_registrations_user_idx
  on public.event_registrations (user_id, created_at desc)
  where user_id is not null;

-- Maintain updated_at for edits from the dashboard or future trusted server code.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists event_registrations_set_updated_at on public.event_registrations;
create trigger event_registrations_set_updated_at before update on public.event_registrations
for each row execute function public.set_updated_at();

create or replace function public.set_registration_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.reservation_status = 'confirmed' and old.reservation_status is distinct from 'confirmed' then
    new.reservation_confirmed_at := now();
  end if;
  if new.attendance_confirmation in ('yes', 'no')
     and old.attendance_confirmation is distinct from new.attendance_confirmation then
    new.attendance_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists event_registrations_set_confirmation_timestamps on public.event_registrations;
create trigger event_registrations_set_confirmation_timestamps
before update on public.event_registrations
for each row execute function public.set_registration_timestamps();

create or replace function public.guard_registration_age_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role')
     and (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'organizer' then
    raise exception 'organizer_required';
  end if;
  return new;
end;
$$;

drop trigger if exists event_registrations_guard_age_update on public.event_registrations;
create trigger event_registrations_guard_age_update
  before update of attendee_birth_years on public.event_registrations
for each row execute function public.guard_registration_age_update();

-- Reserve capacity atomically. Pending requests count until an organizer
-- confirms, declines, or cancels them. A row lock prevents two simultaneous
-- requests from taking the same last places.
create or replace function public.check_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_capacity integer;
  already_reserved integer;
begin
  select e.capacity into event_capacity
  from public.events e
  where e.id = new.event_id
  for update;

  if not found then
    raise exception 'event_not_found';
  end if;

  if new.reservation_status in ('pending', 'confirmed') and event_capacity is not null then
    select coalesce(sum(r.group_size), 0)::integer into already_reserved
    from public.event_registrations r
    where r.event_id = new.event_id
      and r.reservation_status in ('pending', 'confirmed')
      and r.id is distinct from new.id;

    if already_reserved + new.group_size > event_capacity then
      raise exception 'event_capacity_reached';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.check_event_capacity() from public, anon, authenticated;
drop trigger if exists event_registrations_check_event_capacity on public.event_registrations;
create trigger event_registrations_check_event_capacity
before insert or update of event_id, group_size, reservation_status
on public.event_registrations
for each row execute function public.check_event_capacity();

-- Create a private profile row after signup. Metadata is user-controlled, so it is
-- only copied as a display name and remains length-checked by the table.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
begin
  display_name := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  insert into public.profiles (id, full_name)
  values (new.id, left(display_name, 80))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_activities enable row level security;
alter table public.event_registrations enable row level security;

-- Published event information is public. Drafts and private meeting details
-- remain inaccessible to browser clients by default.
drop policy if exists "Anyone can read published events" on public.events;
create policy "Anyone can read published events"
on public.events for select to anon, authenticated
using (status = 'published');

drop policy if exists "Anyone can read activities of published events" on public.event_activities;
create policy "Anyone can read activities of published events"
on public.event_activities for select to anon, authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.status = 'published'
  )
);

-- A signed-in user can only read and update their own profile.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Logged-in participants can submit a reservation for a published future event
-- and read only their own private reservation. They cannot choose the organizer
-- decision or mark a reservation as confirmed on creation.
drop policy if exists "Participants can request a reservation" on public.event_registrations;
create policy "Participants can request a reservation"
on public.event_registrations for insert to authenticated
with check (
  user_id = (select auth.uid())
  and lower(contact_email) = lower((select auth.jwt() ->> 'email'))
  and reservation_status = 'pending'
  and attendee_birth_years is not null
  and cardinality(attendee_birth_years) = group_size
  and array_position(attendee_birth_years, null) is null
  and 1900 <= all(attendee_birth_years)
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.status = 'published'
      and e.starts_at > now()
      and (e.ends_at is null or e.ends_at > now())
      and public.registration_birth_years_meet_minimum(attendee_birth_years, e.starts_at)
  )
);

drop policy if exists "Participants can read own reservations" on public.event_registrations;
create policy "Participants can read own reservations"
on public.event_registrations for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Organizers can read all registrations" on public.event_registrations;
create policy "Organizers can read all registrations"
on public.event_registrations for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

drop policy if exists "Organizers can update reservation decisions" on public.event_registrations;
create policy "Organizers can update reservation decisions"
on public.event_registrations for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

-- Participant attendance is not confirmed through the site. Keep the legacy
-- columns for existing records, but do not expose a participant update path.
drop policy if exists "Participants can confirm own attendance" on public.event_registrations;

-- Explicit grants keep the policies meaningful and do not expose private tables.
revoke all on public.profiles, public.events, public.event_activities, public.event_registrations from anon, authenticated;
revoke all on function public.guard_registration_age_update() from public, anon, authenticated;
revoke all on function public.registration_birth_years_meet_minimum(integer[], timestamptz) from public, anon;
grant execute on function public.registration_birth_years_meet_minimum(integer[], timestamptz) to authenticated;

create or replace function public.guard_registration_birth_year_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('postgres', 'service_role')
     and (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'organizer' then
    raise exception 'organizer_required';
  end if;
  return new;
end;
$$;

drop trigger if exists event_registrations_guard_birth_year_update on public.event_registrations;
create trigger event_registrations_guard_birth_year_update
before update of attendee_birth_years on public.event_registrations
for each row execute function public.guard_registration_birth_year_update();
revoke all on function public.guard_registration_birth_year_update() from public, anon, authenticated;
grant select on public.events, public.event_activities to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.event_registrations to authenticated;
grant insert (event_id, user_id, attendance_type, contact_name, contact_email, contact_phone, group_size, attendee_birth_years, message)
  on public.event_registrations to authenticated;
revoke update on public.event_registrations from authenticated;
revoke update (attendance_confirmation, confirmed_attendee_count)
  on public.event_registrations from authenticated;
grant update (reservation_status, attendee_birth_years)
  on public.event_registrations to authenticated;

commit;
