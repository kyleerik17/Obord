-- O'BORD - Fixer la participation des plans chill à 3 000 FCFA par personne.
-- À exécuter dans Supabase > SQL Editor.
-- Mise à jour limitée aux plans chill publiés qui n'ont pas encore commencé.

begin;

update public.events
set participation_details = '3 000 FCFA par personne',
    updated_at = now()
where title ilike 'Plan chill%'
  and starts_at >= now()
  and status = 'published';

commit;
