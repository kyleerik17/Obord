-- Création des tables pour O'BORD

-- Table des organisateurs
CREATE TABLE organizers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table du lieu
CREATE TABLE venue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  capacity INTEGER,
  photos JSONB,
  amenities JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des événements/soirées
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue_id UUID REFERENCES venue(id),
  status TEXT DEFAULT 'upcoming',
  max_participants INTEGER,
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des activités/postes par soirée
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  post_number INTEGER,
  comments JSONB,
  photos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des vidéos
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT,
  event_id UUID REFERENCES events(id),
  duration INTEGER,
  views INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des inscriptions
CREATE TABLE registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  UNIQUE(user_id, event_id)
);

-- Insertion des 3 organisateurs par défaut
INSERT INTO organizers (name, role, bio, contact_email) VALUES
('Organisateur 1', 'Créateur & Coordinateur', 'Passionné par les feux de camps et les jeux de société depuis plus de 10 ans. Il a créé O''BORD pour partager sa passion avec les jeunes.', 'organisateur1@obord.com'),
('Organisateur 2', 'Responsable Activités', 'Expert en animation et jeux de groupe. Il conçoit les ateliers de détente pour chaque soirée avec créativité.', 'organisateur2@obord.com'),
('Organisateur 3', 'Gestion & Communication', 'Assure la logistique et la communication de nos événements. Il veille à ce que chaque soirée soit parfaite et détendue.', 'organisateur3@obord.com');

-- Insertion du lieu par défaut
INSERT INTO venue (name, description, address, capacity, amenities) VALUES
('Le Camp O''BORD', 'Notre lieu est situé en pleine nature, offrant un cadre idéal pour nos feux de camps, ateliers jeux et picnics. Entouré de forêts et loin de l''agitation urbaine, c''est l''endroit parfait pour se détendre sans pression.', 'Adresse à définir', 50, '["Fosse à feu", "Assises", "Espace jeux", "Sanitaires", "Parking", "Éclairage"]'::jsonb);

-- Activer Row Level Security
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Organisateurs viewable by everyone" ON organizers FOR SELECT USING (true);
CREATE POLICY "Venue viewable by everyone" ON venue FOR SELECT USING (true);
CREATE POLICY "Events viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Activities viewable by everyone" ON activities FOR SELECT USING (true);
CREATE POLICY "Videos viewable by everyone" ON videos FOR SELECT USING (true);
CREATE POLICY "Registrations viewable by own user" ON registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Registrations insertable by authenticated" ON registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
