# O’BORD — La maison du chill

O’BORD est un collectif basé à Grand-Bassam qui propose des occasions de se retrouver autour du jeu, des échanges et des sorties conviviales. Le site présente le collectif, publie les prochaines rencontres et permet aux participants de demander une réservation.

## Fonctionnalités

- Accueil présentant les activités et les prochaines rencontres publiées.
- Pages À propos, Collectif, Contact, Soirées et Vidéos.
- Agenda relié à Supabase : seules les rencontres publiées et à venir s’affichent.
- Réservation en solo ou en groupe, avec année de naissance demandée pour chaque participant.
- Contrôle de l’âge minimum de 21 ans à la date de la rencontre.
- Espace personnel pour modifier son nom et consulter l’historique de ses demandes.
- Back-office privé pour consulter les demandes et confirmer ou refuser les réservations.
- Espace membre permettant de corriger une demande en attente ou d’annuler sa place avant le début du rendez-vous.
- Galerie de photos réelles des rencontres, administrée depuis l’espace équipe.
- Blog public présenté en cartes, avec rédaction, publication et miniatures réelles depuis l’espace équipe.
- Nombre de places restantes calculé à partir des réservations actives lorsque la capacité est définie.
- Pages FAQ et informations légales.
- Mise en page responsive, adaptée aux téléphones et aux ordinateurs.

Les réservations restent des demandes tant que l’équipe ne les a pas traitées. Aucune présence après réservation n’est demandée aux participants.

## Technologies

- Next.js 16 et React 19
- TypeScript
- Tailwind CSS 4 et styles CSS du projet
- Supabase Auth et PostgreSQL

## Démarrage local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

Crée un fichier `.env.local` à la racine du projet et renseigne l’URL et la clé publique du projet Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

N’ajoute jamais de clé `secret` ou `service_role` à une variable `NEXT_PUBLIC_` ni au dépôt Git.

### 3. Lancer le site

```bash
npm run dev
```

Le site sera disponible sur [http://localhost:3000](http://localhost:3000).

## Commandes utiles

```bash
npm run lint       # Vérifier le code avec ESLint
npx tsc --noEmit   # Vérifier les types TypeScript
npm run build      # Générer la version de production
npm run start      # Servir la version compilée
```

## Pages principales

| URL | Contenu |
| --- | --- |
| `/` | Accueil, activités et aperçu de l’agenda |
| `/soirees` | Rencontres à venir et formulaires de réservation |
| `/soirees?plan=<id>` | Affiche un seul rendez-vous choisi depuis l’agenda |
| `/a-propos` | Esprit et valeurs du collectif |
| `/organisateurs` | Le collectif : Malick, Ange Erik et Aurore |
| `/contact` | Coordonnées et formulaire de contact |
| `/videos` | Souvenirs vidéo des rencontres |
| `/blog` | Articles publiés par le collectif, présentés en cartes |
| `/blog/<slug>` | Lecture d’un article |
| `/login` | Connexion |
| `/mon-espace` | Profil et historique privé des réservations |
| `/backoffice` | Gestion des réservations pour l’équipe |

Les pages `/faq`, `/mentions-legales`, `/conditions`, `/confidentialite` et `/cookies` complètent le site.

## Base de données Supabase

Pour créer le schéma, exécute [`supabase/obord_schema.sql`](supabase/obord_schema.sql), puis [`supabase/obord_backoffice.sql`](supabase/obord_backoffice.sql), dans **Supabase → SQL Editor**.

Pour mettre à niveau une base existante, applique les migrations adaptées à son état. Les scripts disponibles couvrent le contrôle de l’âge, les règles de réservation, le back-office et l’accès de l’équipe. Consulte chaque script avant de l’exécuter et conserve les règles RLS activées.

Pour permettre à chaque participant de retrouver aussi les rencontres passées liées à ses réservations, exécute [`supabase/obord_member_space.sql`](supabase/obord_member_space.sql) dans le SQL Editor.

Si Supabase affiche `42P17: infinite recursion detected in policy for relation event_registrations`, exécute [`supabase/fix_event_registration_rls_recursion.sql`](supabase/fix_event_registration_rls_recursion.sql) pour remplacer la policy des événements par une vérification sécurisée sans récursion.

Pour activer le nombre de places restantes, l’édition/annulation autonome et l’ajout de photos depuis le back-office, exécute d’abord [`supabase/obord_birth_year_requirement.sql`](supabase/obord_birth_year_requirement.sql) si cette règle n’est pas déjà installée, puis [`supabase/obord_capacity_member_edits_event_photos.sql`](supabase/obord_capacity_member_edits_event_photos.sql) dans le SQL Editor. Les photos publiées seront accessibles publiquement ; seul un compte organisateur peut les envoyer ou les retirer.

Pour créer le blog et activer la rédaction/publication d’articles avec miniatures dans le back-office, exécute [`supabase/obord_blog.sql`](supabase/obord_blog.sql). La lecture publique ne retourne que les articles publiés ; l’upload des miniatures est réservé aux comptes organisateurs.

Le fichier [`supabase/weekly_plan_chill.sql`](supabase/weekly_plan_chill.sql) met à jour le lieu des plans chill, publie le prochain rendez-vous à 14 h (heure de Grand-Bassam), puis programme un seul nouveau rendez-vous chaque samedi. Il utilise Supabase Cron (`pg_cron`), qui doit être activé dans les intégrations du projet. Le script peut être relancé sans créer un doublon pour la même date. Vérifie le prochain horaire et les détails avant son exécution.

Pour enregistrer la participation de 3 000 FCFA sur les plans chill publiés à venir dans une base existante, exécute [`supabase/plan_chill_participation_3000.sql`](supabase/plan_chill_participation_3000.sql) dans le SQL Editor. Les nouveaux plans créés par le script hebdomadaire auront aussi ce montant.

Le schéma utilise notamment ces tables :

- `profiles` : informations de profil
- `events` : rencontres et détails pratiques
- `event_activities` : programme des rencontres
- `event_registrations` : réservations et décisions de l’équipe

## Configuration et secrets

Les variables locales se placent dans `.env.local`, ignoré par Git. Sur Vercel, configure les variables dans les paramètres du projet pour les environnements concernés (Production, Preview et Development). Après toute modification de variables, redéploie l’application.

La clé publique Supabase peut être utilisée côté navigateur avec les politiques RLS adaptées. Toute clé secrète ou clé de service doit rester exclusivement côté serveur et ne doit jamais être publiée dans le dépôt.
