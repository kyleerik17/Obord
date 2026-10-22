# O’BORD — La maison du chill

O’BORD est un collectif basé à Grand-Bassam qui propose des occasions de se retrouver autour du jeu, des échanges et des sorties conviviales. Le site présente le collectif, publie les prochaines rencontres et permet aux participants de demander une réservation.

## Fonctionnalités

- Accueil présentant les activités et les prochaines rencontres publiées.
- Pages À propos, Organisateurs, Contact, Soirées et Vidéos.
- Agenda relié à Supabase : seules les rencontres publiées et à venir s’affichent.
- Réservation en solo ou en groupe, avec année de naissance demandée pour chaque participant.
- Contrôle de l’âge minimum de 21 ans à la date de la rencontre.
- Back-office privé pour consulter les demandes et confirmer ou refuser les réservations.
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
| `/a-propos` | Esprit et valeurs du collectif |
| `/organisateurs` | Malick, Ange Erik et Aurore |
| `/contact` | Coordonnées et formulaire de contact |
| `/videos` | Souvenirs vidéo des rencontres |
| `/login` | Connexion |
| `/backoffice` | Gestion des réservations pour l’équipe |

Les pages `/faq`, `/mentions-legales`, `/conditions`, `/confidentialite` et `/cookies` complètent le site.

## Base de données Supabase

Pour créer le schéma, exécute [`supabase/obord_schema.sql`](supabase/obord_schema.sql), puis [`supabase/obord_backoffice.sql`](supabase/obord_backoffice.sql), dans **Supabase → SQL Editor**.

Pour mettre à niveau une base existante, applique les migrations adaptées à son état. Les scripts disponibles couvrent le contrôle de l’âge, les règles de réservation, le back-office et l’accès des organisateurs. Consulte chaque script avant de l’exécuter et conserve les règles RLS activées.

Le fichier [`supabase/seed_three_plans_next_three_saturdays.sql`](supabase/seed_three_plans_next_three_saturdays.sql) met à jour le lieu des plans chill et ajoute trois rencontres pour chacun des trois prochains samedis, à partir de 14 h, heure de Grand-Bassam. Il crée neuf rendez-vous au total et peut être relancé sans doublons. Vérifie les dates et les détails avant de publier les rendez-vous dans une base utilisée par les participants.

Le schéma utilise notamment ces tables :

- `profiles` : informations de profil
- `events` : rencontres et détails pratiques
- `event_activities` : programme des rencontres
- `event_registrations` : réservations et décisions de l’équipe

## Configuration et secrets

Les variables locales se placent dans `.env.local`, ignoré par Git. Sur Vercel, configure les variables dans les paramètres du projet pour les environnements concernés (Production, Preview et Development). Après toute modification de variables, redéploie l’application.

La clé publique Supabase peut être utilisée côté navigateur avec les politiques RLS adaptées. Toute clé secrète ou clé de service doit rester exclusivement côté serveur et ne doit jamais être publiée dans le dépôt.
