-- O'BORD - Activer l'accès back-office du compte partagé de l'équipe.
-- À exécuter dans Supabase > SQL Editor après la création du compte Auth.
-- La requête conserve toutes les métadonnées administratives déjà présentes.

do $$
declare
  updated_user_id uuid;
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', 'organizer')
  where lower(email) = lower('obord@gmail.com')
  returning id into updated_user_id;

  if updated_user_id is null then
    raise exception 'Aucun compte Auth ne correspond à obord@gmail.com. Crée le compte avant de relancer ce script.';
  end if;

  raise notice 'Rôle organisateur activé pour le compte Auth %.', updated_user_id;
end
$$;
