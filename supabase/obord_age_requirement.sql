-- SCRIPT OBSOLÈTE — ne pas exécuter.
-- Cette ancienne version utilisait attendee_ages (un âge saisi, non une année)
-- et ne correspond plus au schéma actuel de O'BORD.
-- Pour une base déjà installée, utiliser dans l'ordre :
--   1. obord_birth_year_requirement.sql
--   2. obord_capacity_member_edits_event_photos.sql
--   3. fix_registration_age_edit_trigger.sql

do $$
begin
  raise exception 'Script obsolète. Utilise supabase/obord_birth_year_requirement.sql.';
end;
$$;
