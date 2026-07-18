-- 1. SETUP INITIAL TABLES (CHAMBERS, SPECIALTIES, LAWYERS)
-- =========================================================

-- Create Chambers Table
CREATE TABLE chambers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  focus TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
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
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
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
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'premium_single', 'premium_package')) DEFAULT 'free',
  subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'canceled')) DEFAULT 'active',
  
  -- Notification & display preferences
  hide_contact_form BOOLEAN DEFAULT false,
  display_email TEXT DEFAULT 'everyone' CHECK (display_email IN ('everyone', 'logged_in_only', 'dont_display')),
  contact_form_recipient TEXT DEFAULT 'author_email' CHECK (contact_form_recipient IN ('author_email', 'listing_email')),
  
  CONSTRAINT full_name_length CHECK (char_length(full_name) >= 3)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chambers ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_specialties ENABLE ROW LEVEL SECURITY;

-- Polices for Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can edit own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for Directory Data (Publicly readable)
CREATE POLICY "Directory data is publicly readable" ON lawyers FOR SELECT USING (true);
CREATE POLICY "Chambers data is publicly readable" ON chambers FOR SELECT USING (true);
CREATE POLICY "Specialties data is publicly readable" ON specialties FOR SELECT USING (true);
CREATE POLICY "Lawyer specialties are publicly readable" ON lawyer_specialties FOR SELECT USING (true);

-- Trigger: Handle user creation
-- Google OAuth provides 'name', email/password provides 'full_name'.
-- Falls back to email local-part if both are missing.
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
DECLARE
  _full_name TEXT;
BEGIN
  _full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    _full_name,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'client')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. CONTENT TABLES (REPLACING WORDPRESS)
-- =======================================

-- Articles Table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  category TEXT DEFAULT 'documentation' CHECK (category IN ('documentation', 'clients', 'lawyers', 'chambers')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Podcasts Table
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('audio', 'video')) DEFAULT 'audio',
  duration TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Articles are publicly readable" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can manage own articles" ON articles FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Podcasts are publicly readable" ON podcasts FOR SELECT USING (status = 'published');
CREATE POLICY "Authors can manage own podcasts" ON podcasts FOR ALL USING (auth.uid() = author_id);

-- 4. NEWSLETTER SUBSCRIPTIONS
-- ==========================
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can subscribe" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admin can view subscribers" ON newsletter_subscribers FOR SELECT USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- 5. NEWSLETTER CAMPAIGNS
-- ==========================
CREATE TABLE newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipients_count INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view newsletter campaigns" ON newsletter_campaigns FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Only admins can insert newsletter campaigns" ON newsletter_campaigns FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Only admins can update newsletter campaigns" ON newsletter_campaigns FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Only admins can delete newsletter campaigns" ON newsletter_campaigns FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
