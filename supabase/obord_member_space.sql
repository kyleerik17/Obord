-- O'BORD - Activation de l'espace personnel
-- À exécuter dans Supabase > SQL Editor une fois.

begin;

-- A participant may read published meetings and past meetings linked to their
-- own reservation. Registration RLS still prevents access to other users' rows.
drop policy if exists "Anyone can read published events" on public.events;
create policy "Participants can read published and joined events"
on public.events for select to authenticated
using (
  status = 'published'
  or exists (
    select 1
    from public.event_registrations r
    where r.event_id = id
      and r.user_id = (select auth.uid())
  )
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
