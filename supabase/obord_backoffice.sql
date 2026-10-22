-- O'BORD - Accès organisateur au back-office
-- À exécuter dans Supabase SQL Editor après obord_schema.sql.
-- Ensuite, dans Authentication > Users, attribuer dans App Metadata :
-- { "role": "organizer" } aux comptes des organisateurs concernés.
-- Les utilisateurs concernés doivent se déconnecter puis se reconnecter.

begin;

grant select on public.events to authenticated;
grant select on public.event_registrations to authenticated;
revoke update on public.event_registrations from authenticated;
grant update (reservation_status, attendee_birth_years) on public.event_registrations to authenticated;

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
revoke all on function public.guard_registration_age_update() from public, anon, authenticated;

create or replace function public.guard_registration_birth_year_update()
returns trigger language plpgsql set search_path = '' as $$
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

drop policy if exists "Organizers can read all events" on public.events;
create policy "Organizers can read all events"
on public.events for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

drop policy if exists "Organizers can read all registrations" on public.event_registrations;
create policy "Organizers can read all registrations"
on public.event_registrations for select to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

drop policy if exists "Organizers can update reservation decisions" on public.event_registrations;
create policy "Organizers can update reservation decisions"
on public.event_registrations for update to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'organizer');

commit;
