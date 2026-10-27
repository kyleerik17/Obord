-- O'BORD - Places, autonomie des réservations et galerie des rencontres.
-- À exécuter dans Supabase > SQL Editor après les scripts de schéma et de back-office.

begin;

-- Les chemins restent en base; les objets image sont gérés par l'API Storage.
alter table public.events
  add column if not exists image_paths text[] not null default '{}';

alter table public.events
  drop constraint if exists events_image_paths_check;
alter table public.events
  add constraint events_image_paths_check
  check (
    cardinality(image_paths) <= 6
    and array_position(image_paths, null) is null
  );

-- Return seat totals only for public upcoming events. No attendee data is exposed.
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
    coalesce(sum(r.group_size) filter (where r.reservation_status in ('pending', 'confirmed')), 0)::integer,
    case
      when e.capacity is null then null
      else greatest(e.capacity - coalesce(sum(r.group_size) filter (where r.reservation_status in ('pending', 'confirmed')), 0)::integer, 0)
    end
  from public.events e
  left join public.event_registrations r on r.event_id = e.id
  where cardinality(p_event_ids) between 1 and 50
    and e.id = any(p_event_ids)
    and e.status = 'published'
    and e.starts_at > now()
  group by e.id, e.capacity;
$$;
revoke all on function public.get_public_event_availability(uuid[]) from public, anon, authenticated;
grant execute on function public.get_public_event_availability(uuid[]) to anon, authenticated;

-- Members may update only their own pending request while the meeting is upcoming.
drop policy if exists "Participants can edit own pending reservations" on public.event_registrations;
create policy "Participants can edit own pending reservations"
on public.event_registrations for update to authenticated
using (
  user_id = (select auth.uid())
  and reservation_status = 'pending'
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.status = 'published' and e.starts_at > now()
  )
)
with check (
  user_id = (select auth.uid())
  and reservation_status = 'pending'
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.status = 'published' and e.starts_at > now()
  )
);

-- A pending or confirmed reservation can be cancelled before its start; this
-- releases its capacity. A cancelled request cannot be reopened by its owner.
drop policy if exists "Participants can cancel own upcoming reservations" on public.event_registrations;
create policy "Participants can cancel own upcoming reservations"
on public.event_registrations for update to authenticated
using (
  user_id = (select auth.uid())
  and reservation_status in ('pending', 'confirmed')
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.status = 'published' and e.starts_at > now()
  )
)
with check (
  user_id = (select auth.uid())
  and reservation_status = 'cancelled'
  and exists (
    select 1 from public.events e
    where e.id = event_id and e.status = 'published' and e.starts_at > now()
  )
);

revoke update on public.event_registrations from authenticated;
grant update (reservation_status, attendee_birth_years, attendance_type, contact_name, contact_phone, group_size)
  on public.event_registrations to authenticated;

-- Keep the organizer-only age correction rule while allowing a member to edit
-- valid birth years on their own still-pending reservation.
create or replace function public.guard_registration_birth_year_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  event_start timestamptz;
  event_status text;
begin
  if current_user in ('postgres', 'service_role')
     or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer' then
    return new;
  end if;

  if old.user_id is distinct from (select auth.uid())
     or old.reservation_status <> 'pending'
     or new.reservation_status <> 'pending'
     or new.user_id is distinct from old.user_id
     or new.event_id is distinct from old.event_id then
    raise exception 'reservation_edit_not_allowed';
  end if;

  select e.starts_at, e.status into event_start, event_status
  from public.events e where e.id = new.event_id;

  if event_status is distinct from 'published'
     or event_start is null
     or event_start <= now()
     or coalesce(not public.registration_birth_years_meet_minimum(new.attendee_birth_years, event_start), true) then
    raise exception 'reservation_birth_years_invalid';
  end if;

  return new;
end;
$$;
revoke all on function public.guard_registration_birth_year_update() from public, anon, authenticated;

-- Remove the older organizer-only age trigger, if this database has it.
drop trigger if exists event_registrations_guard_age_update on public.event_registrations;
drop function if exists public.guard_registration_age_update();

-- Public gallery files can be read, but only organizer accounts may upload or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('obord-event-photos', 'obord-event-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "O'BORD organizers upload event photos" on storage.objects;
create policy "O'BORD organizers upload event photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'obord-event-photos'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer'
);

drop policy if exists "O'BORD organizers delete event photos" on storage.objects;
create policy "O'BORD organizers delete event photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'obord-event-photos'
  and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer'
);

-- Events are editable only through their photo-path column by organizers.
grant select on public.events to authenticated;
grant update (image_paths) on public.events to authenticated;
drop policy if exists "Organizers can read all events" on public.events;
create policy "Organizers can read all events"
on public.events for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');
drop policy if exists "Organizers can update event photo paths" on public.events;
create policy "Organizers can update event photo paths"
on public.events for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

commit;
