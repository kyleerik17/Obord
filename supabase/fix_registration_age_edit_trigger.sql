-- O'BORD: enforce age against the event date when birth years are edited.
-- Apply after obord_schema.sql, obord_birth_year_requirement.sql, and
-- obord_capacity_member_edits_event_photos.sql.
-- Safe to run more than once.

begin;

-- Birth years describe eligibility on the meeting date, not on the day the
-- request was created. Keep shape checks in the constraint; validate age in
-- the trigger against events.starts_at.
alter table public.event_registrations
  drop constraint if exists event_registrations_attendee_birth_years_check;

alter table public.event_registrations
  add constraint event_registrations_attendee_birth_years_check
  check (
    attendee_birth_years is null
    or (
      cardinality(attendee_birth_years) = group_size
      and array_position(attendee_birth_years, null) is null
      and 1900 <= all(attendee_birth_years)
    )
  );

create or replace function public.guard_registration_birth_year_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  event_start timestamptz;
begin
  select e.starts_at into event_start
  from public.events e
  where e.id = new.event_id;

  if event_start is null
     or not public.registration_birth_years_meet_minimum(new.attendee_birth_years, event_start) then
    raise exception 'reservation_birth_years_invalid';
  end if;

  if current_user in ('postgres', 'service_role')
     or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer' then
    return new;
  end if;

  if old.user_id is distinct from (select auth.uid())
     or old.reservation_status <> 'pending'
     or new.reservation_status <> 'pending'
     or new.user_id is distinct from old.user_id
     or new.event_id is distinct from old.event_id
     or event_start <= now() then
    raise exception 'reservation_edit_not_allowed';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_registration_birth_year_update() from public, anon, authenticated;
drop trigger if exists event_registrations_guard_age_update on public.event_registrations;
drop trigger if exists event_registrations_guard_birth_year_update on public.event_registrations;
create trigger event_registrations_guard_birth_year_update
  before update of attendee_birth_years on public.event_registrations
for each row execute function public.guard_registration_birth_year_update();

create or replace function public.set_registration_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  event_start timestamptz;
begin
  if new.reservation_status = 'confirmed'
     and old.reservation_status is distinct from 'confirmed' then
    select starts_at into event_start
    from public.events
    where id = new.event_id;

    if not public.registration_birth_years_meet_minimum(new.attendee_birth_years, event_start) then
      raise exception 'reservation_birth_years_invalid';
    end if;

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

create or replace function public.guard_registration_member_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role')
     or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer' then
    return new;
  end if;

  if old.user_id is distinct from (select auth.uid())
     or new.user_id is distinct from old.user_id
     or new.event_id is distinct from old.event_id then
    raise exception 'reservation_owner_required';
  end if;

  if old.reservation_status = 'pending' and new.reservation_status = 'pending' then
    return new;
  end if;

  if old.reservation_status in ('pending', 'confirmed')
     and new.reservation_status = 'cancelled' then
    if new.attendance_type is distinct from old.attendance_type
       or new.contact_name is distinct from old.contact_name
       or new.contact_email is distinct from old.contact_email
       or new.contact_phone is distinct from old.contact_phone
       or new.group_size is distinct from old.group_size
       or new.attendee_birth_years is distinct from old.attendee_birth_years
       or new.message is distinct from old.message
       or new.attendance_confirmation is distinct from old.attendance_confirmation
       or new.confirmed_attendee_count is distinct from old.confirmed_attendee_count then
      raise exception 'reservation_cancellation_details_immutable';
    end if;
    return new;
  end if;

  raise exception 'reservation_update_not_allowed';
end;
$$;
revoke all on function public.guard_registration_member_update() from public, anon, authenticated;
drop trigger if exists event_registrations_guard_member_update on public.event_registrations;
create trigger event_registrations_guard_member_update
before update on public.event_registrations
for each row execute function public.guard_registration_member_update();

notify pgrst, 'reload schema';

commit;
