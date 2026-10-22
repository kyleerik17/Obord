-- O'BORD: remove the participant attendance-confirmation step.
-- Run in Supabase SQL Editor after the birth-year and back-office scripts.
-- Historical attendance columns and values are intentionally preserved.

begin;

drop policy if exists "Participants can confirm own attendance"
  on public.event_registrations;

-- Remove any broad or column-specific participant UPDATE grants. Organizer
-- permissions are re-granted narrowly for the fields managed by the backoffice.
revoke update on public.event_registrations from authenticated;
grant update (reservation_status, attendee_birth_years)
  on public.event_registrations to authenticated;

-- Reservations retain their seats until the organizer declines or cancels them.
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

commit;
