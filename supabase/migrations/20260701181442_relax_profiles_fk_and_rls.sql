-- Drop the FK constraint linking profiles.id to auth.users so we can seed demo profiles
-- with random UUIDs (no corresponding auth.users row needed for demo data).
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Update RLS policies to allow anon (unauthenticated) read access to profiles and wilayas
-- so the public search page can display results without requiring login.
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "wilayas_select_all" ON wilayas;
CREATE POLICY "wilayas_select_all" ON wilayas FOR SELECT
  TO anon, authenticated USING (true);
