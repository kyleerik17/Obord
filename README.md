# O'BORD - Site Web

Site web pour O'BORD, un atelier de jeu de détente et feux de camps.

## 🚀 Démarrage Rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Copiez l'URL et la clé publique (`publishable key`) depuis les paramètres du projet
4. Créez un fichier `.env.local` à la racine du projet avec :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=votre_cle_publique
# Ajouter une fois le nom de domaine connu pour les images Open Graph :
# NEXT_PUBLIC_SITE_URL=https://votre-domaine
```

### 3. Démarrer le serveur de développement

```bash
npm run dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📱 Pages du Site

- **Accueil** (`/`) - Présentation du concept O'BORD
- **À propos** (`/a-propos`) - Histoire, mission, valeurs et équipe
- **Contact** (`/contact`) - Coordonnées et formulaire e-mail
- **Organisateurs** (`/organisateurs`) - Les 3 organisateurs du projet
- **Lieu** (`/lieu`) - Le lieu où se déroulent les événements
- **Soirées** (`/soirees`) - Dates confirmées et informations pratiques
- **Espace équipe** (`/backoffice`) - Gestion privée des réservations par les organisateurs
- **Vidéos** (`/videos`) - Page dédiée aux vidéos
- **FAQ** (`/faq`) et pages d’informations légales (`/mentions-legales`, `/conditions`, `/confidentialite`, `/cookies`)
- **Connexion** (`/login`) - Interface d'authentification

## 🎨 Technologies

- **Next.js 16** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **Supabase** - Backend as a Service (Auth, Database, Storage)

## 📝 À Faire

- [ ] Configurer Supabase avec les tables requises
- [x] Implémenter l'authentification Supabase (connexion, création de compte, confirmation e-mail, réinitialisation)
- [ ] Exécuter le schéma et les données initiales dans Supabase
- [x] Connecter les pages d’événements à Supabase
- [ ] Implémenter l'upload de vidéos
- [ ] Ajouter le panel admin
- [x] Implémenter les demandes de réservation et leur confirmation par l’équipe
- [ ] Ajouter les vraies photos et vidéos

## 🗄️ Structure de la Base de Données (Supabase)

Pour une nouvelle base, exécute [`supabase/obord_schema.sql`](supabase/obord_schema.sql), puis [`supabase/obord_backoffice.sql`](supabase/obord_backoffice.sql) dans **Supabase → SQL Editor**. Pour une base existante, exécute [`supabase/obord_birth_year_requirement.sql`](supabase/obord_birth_year_requirement.sql), puis réexécute `obord_backoffice.sql`, `obord_remove_attendance_confirmation.sql` et [`obord_reservation_rules.sql`](supabase/obord_reservation_rules.sql). Pour activer le compte partagé de l’équipe, exécute ensuite [`supabase/obord_organizer_access.sql`](supabase/obord_organizer_access.sql) ; le compte doit exister dans Supabase Auth et ses utilisateurs doivent se déconnecter puis se reconnecter. Le back-office est disponible sur `/backoffice`; les participants y sont exclus par les règles RLS. À l’inscription, chaque personne indique son année de naissance ; la base vérifie prudemment qu’elle aura 21 ans à la date de la rencontre. L’équipe confirme les réservations; les participants n’ont pas d’étape de confirmation de présence.

Pour publier le plan chill du samedi 24 octobre 2026 à 14 h (heure d’Abidjan), exécute ensuite [`supabase/seed_plan_chill_2026_10_24.sql`](supabase/seed_plan_chill_2026_10_24.sql). Les participants doivent être connectés pour réserver en solo ou en groupe; l’équipe confirme ou refuse les demandes dans le back-office. Les réservations restent privées.

Le schéma comprend :

- `profiles` - Profils utilisateurs
- `events` - Soirées/événements
- `event_activities` - Programme par soirée
- `event_registrations` - Demandes et décisions de réservation

Voir le fichier `CAHIER_DE_CHARGE.md` pour plus de détails.

## 📄 Documentation

- `CAHIER_DE_CHARGE.md` - Cahier de charge complet
- `CHARTE_GRAPHIQUE.md` - Charte graphique et architecture

## 🎯 Objectifs

Le site O'BORD permet de :
- ✅ Se faire connaître en ligne
- ✅ Stocker et partager des vidéos
- ✅ Présenter les organisateurs et le lieu
- ✅ Gérer les inscriptions aux soirées
- ✅ Créer une communauté autour du concept

## 📧 Contact

Pour toute question sur le projet, consultez la page `/contact`.
# Obord
