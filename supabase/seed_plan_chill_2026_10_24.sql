-- O'BORD - Plan chill, samedi 24 octobre 2026 à partir de 14 h (heure d'Abidjan)
-- À exécuter après obord_schema.sql. La ligne est publiée pour apparaître sur le site.
-- L'équipe peut modifier les détails directement dans Supabase.

alter table public.events
  add column if not exists participation_details text;

insert into public.events (
  id,
  title,
  event_type,
  starts_at,
  description,
  venue_area,
  venue_name,
  venue_details,
  participation_details,
  capacity,
  status
)
values (
  'b7df7a20-32c3-4f44-8ad5-241024140000'::uuid,
  'Plan chill O’BORD',
  'sortie',
  '2026-10-24 14:00:00 Africa/Abidjan'::timestamptz,
  'Un après-midi chill pour se retrouver. Le programme détaillé sera précisé par l’équipe O’BORD.',
  'Grand-Bassam',
  null,
  'Le point de rencontre précis sera communiqué après confirmation de la réservation.',
  'Une bouteille de liqueur ou de vodka par personne. Réservé aux personnes majeures ; la consommation d’alcool reste facultative.',
  null,
  'published'
)
on conflict (id) do nothing;
