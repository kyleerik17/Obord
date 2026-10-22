-- O'BORD - Âge minimum de 21 ans pour les nouvelles réservations
-- À exécuter dans Supabase SQL Editor sur un projet déjà installé.
-- Les réservations antérieures gardent attendee_ages à NULL et sont signalées
-- au back-office pour vérification manuelle.

begin;

alter table public.event_registrations
  add column if not exists attendee_ages integer[];

alter table public.event_registrations
  drop constraint if exists event_registrations_attendee_ages_check;

alter table public.event_registrations
  add constraint event_registrations_attendee_ages_check
  check (
    attendee_ages is null
    or (
      cardinality(attendee_ages) = group_size
      and array_position(attendee_ages, null) is null
      and 21 <= all(attendee_ages)
    )
  );

drop policy if exists "Participants can request a reservation" on public.event_registrations;
create policy "Participants can request a reservation"
on public.event_registrations for insert to authenticated
with check (
  user_id = (select auth.uid())
  and lower(contact_email) = lower((select auth.jwt() ->> 'email'))
  and reservation_status = 'pending'
  and attendee_ages is not null
  and cardinality(attendee_ages) = group_size
  and array_position(attendee_ages, null) is null
  and 21 <= all(attendee_ages)
  and exists (
    select 1 from public.events e
    where e.id = event_id
      and e.status = 'published'
      and e.starts_at > now()
  )
);

grant insert (event_id, user_id, attendance_type, contact_name, contact_email, contact_phone, group_size, attendee_ages, message)
  on public.event_registrations to authenticated;
revoke update on public.event_registrations from authenticated;
grant update (reservation_status, attendee_ages)
  on public.event_registrations to authenticated;

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
before update of attendee_ages on public.event_registrations
for each row execute function public.guard_registration_age_update();
revoke all on function public.guard_registration_age_update() from public, anon, authenticated;

commit;
