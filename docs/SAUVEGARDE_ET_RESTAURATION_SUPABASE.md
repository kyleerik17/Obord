# Sauvegarde et test de restauration O’BORD

## Ce qui est sauvegardé

- Les sauvegardes automatiques de la base dépendent de l’offre Supabase. Les offres Pro, Team et Enterprise ont des sauvegardes quotidiennes ; le niveau gratuit demande une exportation manuelle régulière.
- Une sauvegarde SQL ne contient pas les fichiers stockés dans Supabase Storage (photos de rencontres et miniatures du blog). Il faut aussi exporter les deux buckets `obord-event-photos` et `obord-blog-covers` et les garder dans un emplacement privé.
- Ne jamais versionner un dump, les coordonnées des membres, un mot de passe ou une clé secrète dans Git.

## Export manuel de la base

Sur une machine de confiance avec Supabase CLI et Docker installés :

```powershell
$backupDir = Join-Path $env:LOCALAPPDATA ("O-BORD-backup-" + (Get-Date -Format yyyyMMdd-HHmm))
New-Item -ItemType Directory -Path $backupDir | Out-Null
supabase db dump --db-url "$env:OBORD_DATABASE_URL" -f (Join-Path $backupDir "schema.sql")
supabase db dump --db-url "$env:OBORD_DATABASE_URL" -f (Join-Path $backupDir "data.sql") --data-only --use-copy
```

`OBORD_DATABASE_URL` doit être définie temporairement dans la session PowerShell depuis les paramètres de connexion du projet. Ne la colle pas dans le dépôt ni dans un message. Le premier fichier contient le schéma ; le second contient les données. Range les deux fichiers dans un stockage privé avec accès limité et chiffrement activé.

## Test de restauration sans toucher à la production

1. Crée un projet Supabase de test séparé, sans utilisateurs réels ni accès public de production.
2. Télécharge une sauvegarde récente et les objets des deux buckets.
3. Restaure d’abord `schema.sql`, puis `data.sql` dans ce projet de test selon le [guide de restauration Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), puis remets les fichiers dans les buckets correspondants.
4. Vérifie la présence des tables `events`, `event_registrations`, `event_waitlist`, `contact_messages`, `event_registration_audit` et `blog_posts`.
5. Vérifie qu’un organisateur peut ouvrir le back-office, qu’un compte membre ne peut voir que ses propres réservations et qu’un visiteur ne peut pas lire les messages ou l’historique.
6. Vérifie qu’une rencontre publiée, une photo et une miniature du blog s’affichent. Supprime ensuite le projet de test quand le résultat est consigné.

Ne restaure pas une sauvegarde directement sur le projet de production pour un test : une restauration remplace l’état actuel du projet et provoque une indisponibilité pendant l’opération.

## Rythme conseillé

- Vérifier chaque semaine que la dernière sauvegarde attendue existe.
- Faire un test complet de restauration sur un projet isolé au moins une fois par trimestre et après tout changement majeur de schéma.
- Conserver une copie hors du projet Supabase ; une sauvegarde de base ne protège pas à elle seule les fichiers Storage.

Références : [sauvegardes Supabase](https://supabase.com/docs/guides/platform/backups), [restaurer vers un nouveau projet](https://supabase.com/docs/guides/platform/clone-project).
