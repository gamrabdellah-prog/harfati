-- Allow unauthenticated users to read open jobs (for homepage/search)
DROP POLICY IF EXISTS "jobs_select_all" ON jobs;
CREATE POLICY "jobs_select_all" ON jobs FOR SELECT
  TO anon, authenticated USING (true);
