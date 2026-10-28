-- O'BORD - Activation de l'espace personnel
-- À exécuter dans Supabase > SQL Editor une fois.

begin;

-- A participant may read published meetings and past meetings linked to their
-- own reservation. Use a narrowly scoped SECURITY DEFINER helper so this
-- events policy does not recurse through event_registrations RLS.
create or replace function public.user_has_event_registration(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.event_registrations r
    where r.event_id = p_event_id
      and r.user_id = (select auth.uid())
  );
$$;
revoke all on function public.user_has_event_registration(uuid) from public, anon;
grant execute on function public.user_has_event_registration(uuid) to authenticated;

drop policy if exists "Anyone can read published events" on public.events;
drop policy if exists "Participants can read published and joined events" on public.events;
create policy "Participants can read published and joined events"
on public.events for select to authenticated
using (
  status = 'published'
  or public.user_has_event_registration(id)
);

-- Keep anonymous access limited to currently published events.
drop policy if exists "Anyone can read published events" on public.events;
create policy "Anyone can read published events"
on public.events for select to anon
using (status = 'published');

-- Remove old alcohol or bottle requirements from existing Plan chill records.
update public.events
set participation_details = case
      when participation_details ~* '(bouteille|vodka|liqueur|alcool)' then null
      else participation_details
    end,
    food_and_drinks = case
      when food_and_drinks ~* '(bouteille|vodka|liqueur|alcool)' then null
      else food_and_drinks
    end,
    updated_at = now()
where title ilike 'Plan chill%'
  and (
    participation_details ~* '(bouteille|vodka|liqueur|alcool)'
    or food_and_drinks ~* '(bouteille|vodka|liqueur|alcool)'
  );

commit;
