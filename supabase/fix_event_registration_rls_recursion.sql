-- O'BORD: break the RLS cycle between events and event_registrations.
-- Run this in Supabase SQL Editor on an existing installation.

begin;

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

-- Keep anonymous visitors limited to published events.
create policy "Anyone can read published events"
on public.events for select to anon
using (status = 'published');

commit;
