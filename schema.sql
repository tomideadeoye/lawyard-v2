-- 1. SETUP INITIAL TABLES (CHAMBERS, SPECIALTIES, LAWYERS)
-- =========================================================

-- Create Chambers Table
CREATE TABLE chambers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  focus TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Specialties Table
CREATE TABLE specialties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Create Lawyers Table
CREATE TABLE lawyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  location TEXT,
  bio TEXT,
  image_url TEXT,
  rating NUMERIC(3,1) DEFAULT 0.0,
  reviews_count INT DEFAULT 0,
  email TEXT,
  phone TEXT,
  website TEXT,
  chamber_id UUID REFERENCES chambers(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  education TEXT[] DEFAULT '{}',
  experience TEXT[] DEFAULT '{}',
  achievements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Junction Table for Lawyers and Specialties
CREATE TABLE lawyer_specialties (
  lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
  specialty_id TEXT REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (lawyer_id, specialty_id)
);


-- 2. SETUP AUTH & USER PROFILES
-- ============================

-- Create a table for user profiles linked to Supabase Auth
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('lawyer', 'client', 'admin')) DEFAULT 'client',
  
  CONSTRAINT full_name_length CHECK (char_length(full_name) >= 3)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

-- Polices for Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can edit own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for Directory Data (Publicly readable)
CREATE POLICY "Directory data is publicly readable" ON lawyers FOR SELECT USING (true);
CREATE POLICY "Chambers data is publicly readable" ON chambers FOR SELECT USING (true);
CREATE POLICY "Specialties data is publicly readable" ON specialties FOR SELECT USING (true);

-- Trigger: Handle user creation
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
