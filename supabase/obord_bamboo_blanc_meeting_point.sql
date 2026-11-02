-- O'BORD - Point de rendez-vous habituel des prochains Plans chill
-- À exécuter dans Supabase > SQL Editor.
-- Les données sont modifiées uniquement pour les Plans chill futurs publiés.

begin;

update public.events
set venue_area = 'Quartier France, Grand-Bassam',
    venue_name = 'Bamboo Blanc',
    venue_details = 'Point de rendez-vous : Bamboo Blanc, quartier France, Grand-Bassam.',
    updated_at = now()
where status = 'published'
  and title ilike 'Plan chill%'
  and starts_at > now();

commit;
