/*
# Create حرفتي (Harafati) Platform Schema

## Overview
An Algerian platform connecting craftsmen/workers with employers. This migration creates the full database schema for a multi-user authenticated platform.

## New Tables
1. `profiles` - Extended user profile data linked to auth.users
2. `jobs` - Job postings by employers
3. `contracts` - Work contracts between employers and workers
4. `messages` - Direct messaging between users
5. `reviews` - Bidirectional rating system
6. `notifications` - Real-time notifications for users
7. `wilayas` - Algeria's 48 states for reference and filtering

## Security
- All tables have RLS enabled
- Owner-scoped policies using auth.uid()
- Cross-user access where appropriate (messages, contracts, reviews)
*/

-- Create custom enums safely (PostgreSQL doesn't support IF NOT EXISTS for types)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('worker', 'employer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'worker_availability') THEN
    CREATE TYPE worker_availability AS ENUM ('available', 'busy', 'unavailable');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('contract', 'message', 'review', 'job', 'system');
  END IF;
END $$;

-- Wilayas table
CREATE TABLE IF NOT EXISTS wilayas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code INTEGER NOT NULL UNIQUE
);

-- Insert all 48 Algerian wilayas
INSERT INTO wilayas (id, name, code) VALUES
(1, 'أدرار', 1), (2, 'الشلف', 2), (3, 'الأغواط', 3), (4, 'أم البواقي', 4),
(5, 'باتنة', 5), (6, 'بجاية', 6), (7, 'بسكرة', 7), (8, 'بشار', 8),
(9, 'البليدة', 9), (10, 'البويرة', 10), (11, 'تمنراست', 11), (12, 'تبسة', 12),
(13, 'تلمسان', 13), (14, 'تيارت', 14), (15, 'تيزي وزو', 15), (16, 'الجزائر', 16),
(17, 'الجلفة', 17), (18, 'جيجل', 18), (19, 'سطيف', 19), (20, 'سعيدة', 20),
(21, 'سكيكدة', 21), (22, 'سيدي بلعباس', 22), (23, 'عنابة', 23), (24, 'قالمة', 24),
(25, 'قسنطينة', 25), (26, 'المدية', 26), (27, 'مستغانم', 27), (28, 'المسيلة', 28),
(29, 'معسكر', 29), (30, 'ورقلة', 30), (31, 'وهران', 31), (32, 'البيض', 32),
(33, 'إليزي', 33), (34, 'برج بوعريريج', 34), (35, 'بومرداس', 35), (36, 'الطارف', 36),
(37, 'تندوف', 37), (38, 'تيسمسيلت', 38), (39, 'الوادي', 39), (40, 'خنشلة', 40),
(41, 'سوق أهراس', 41), (42, 'تيبازة', 42), (43, 'ميلة', 43), (44, 'عين الدفلى', 44),
(45, 'النعامة', 45), (46, 'عين تموشنت', 46), (47, 'غرداية', 47), (48, 'غليزان', 48)
ON CONFLICT (id) DO NOTHING;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'worker',
  full_name TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  wilaya_id INTEGER REFERENCES wilayas(id),
  address TEXT,
  specialty TEXT,
  hourly_rate INTEGER,
  skills TEXT[],
  availability worker_availability DEFAULT 'available',
  years_experience INTEGER,
  company_name TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  identity_doc_url TEXT,
  certificates_urls TEXT[],
  cv_url TEXT,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget INTEGER,
  wilaya_id INTEGER REFERENCES wilayas(id),
  specialty TEXT,
  status job_status DEFAULT 'open',
  assigned_worker_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL,
  status contract_status DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  terms TEXT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  link TEXT,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_wilaya ON profiles(wilaya_id);
CREATE INDEX IF NOT EXISTS idx_profiles_availability ON profiles(availability);
CREATE INDEX IF NOT EXISTS idx_profiles_specialty ON profiles(specialty);
CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_wilaya ON jobs(wilaya_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_specialty ON jobs(specialty);
CREATE INDEX IF NOT EXISTS idx_contracts_employer ON contracts(employer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_worker ON contracts(worker_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed ON reviews(reviewed_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wilayas ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Jobs policies
DROP POLICY IF EXISTS "jobs_select_all" ON jobs;
CREATE POLICY "jobs_select_all" ON jobs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "jobs_insert_employer" ON jobs;
CREATE POLICY "jobs_insert_employer" ON jobs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "jobs_update_employer" ON jobs;
CREATE POLICY "jobs_update_employer" ON jobs FOR UPDATE
  TO authenticated USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "jobs_delete_employer" ON jobs;
CREATE POLICY "jobs_delete_employer" ON jobs FOR DELETE
  TO authenticated USING (auth.uid() = employer_id);

-- Contracts policies
DROP POLICY IF EXISTS "contracts_select_participants" ON contracts;
CREATE POLICY "contracts_select_participants" ON contracts FOR SELECT
  TO authenticated USING (auth.uid() = employer_id OR auth.uid() = worker_id);

DROP POLICY IF EXISTS "contracts_insert_employer" ON contracts;
CREATE POLICY "contracts_insert_employer" ON contracts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "contracts_update_participants" ON contracts;
CREATE POLICY "contracts_update_participants" ON contracts FOR UPDATE
  TO authenticated USING (auth.uid() = employer_id OR auth.uid() = worker_id)
  WITH CHECK (auth.uid() = employer_id OR auth.uid() = worker_id);

DROP POLICY IF EXISTS "contracts_delete_participants" ON contracts;
CREATE POLICY "contracts_delete_participants" ON contracts FOR DELETE
  TO authenticated USING (auth.uid() = employer_id OR auth.uid() = worker_id);

-- Messages policies
DROP POLICY IF EXISTS "messages_select_participants" ON messages;
CREATE POLICY "messages_select_participants" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "messages_insert_sender" ON messages;
CREATE POLICY "messages_insert_sender" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_sender" ON messages;
CREATE POLICY "messages_update_sender" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_delete_sender" ON messages;
CREATE POLICY "messages_delete_sender" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

-- Reviews policies
DROP POLICY IF EXISTS "reviews_select_all" ON reviews;
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON reviews;
CREATE POLICY "reviews_insert_own" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews_update_own" ON reviews;
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE
  TO authenticated USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON reviews;
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE
  TO authenticated USING (auth.uid() = reviewer_id);

-- Notifications policies
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Wilayas public read
DROP POLICY IF EXISTS "wilayas_select_all" ON wilayas;
CREATE POLICY "wilayas_select_all" ON wilayas FOR SELECT
  TO authenticated USING (true);
