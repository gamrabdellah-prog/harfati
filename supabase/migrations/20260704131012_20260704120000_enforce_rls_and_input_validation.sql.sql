/*
# Enforce RLS and add input validation constraints

## Summary
This migration hardens database security by (1) forcing Row Level Security on all
public tables so that even the table owner (postgres) is subject to RLS policies,
and (2) adding CHECK constraints that validate and sanitize user-supplied text and
numeric inputs at the database layer — the last line of defense against malformed,
empty, or oversized payloads.

## Security changes (RLS)
1. `ALTER TABLE ... FORCE ROW LEVEL SECURITY` applied to every public table:
   - profiles, messages, contracts, reviews, notifications, jobs, wilayas
   - With FORCE enabled, even the postgres / service-role owner must satisfy the
     existing RLS policies to read or modify rows. (The service role bypasses RLS
     by default; FORCE does not change that. It does ensure the table owner cannot
     accidentally bypass policies when connecting as a non-bypass role.)
   - Existing per-table policies (owner / participant scoped) remain unchanged and
     continue to enforce that users can only see their own data.

## Input validation (CHECK constraints)
Adds the following constraints to reject invalid input at the DB layer:

### profiles
- `profiles_full_name_length`: full_name must be between 2 and 100 characters
- `profiles_role_valid`: role must be one of 'worker', 'employer'

### messages
- `messages_content_length`: content must be between 1 and 2000 characters
  (prevents empty messages and oversized payloads)

### contracts
- `contracts_title_length`: title must be between 3 and 200 characters
- `contracts_amount_positive`: amount must be a positive integer (>= 0)

### reviews
- `reviews_comment_length`: comment (when provided) must be at most 1000 characters
  (rating is already constrained 1..5 by the existing reviews_rating_check)

### notifications
- `notifications_title_length`: title must be between 1 and 200 characters

### jobs
- `jobs_title_length`: title must be between 3 and 200 characters
- `jobs_description_length`: description must be between 10 and 5000 characters
- `jobs_budget_positive`: budget (when provided) must be positive (>= 0)

## Important notes
1. All constraints use `ALTER TABLE ... ADD CONSTRAINT` wrapped in a DO block with
   `IF NOT EXISTS` checks so the migration is idempotent and safe to re-run.
2. No columns are dropped, renamed, or retyped — no data loss risk.
3. Existing policies are NOT modified; only FORCE is added on top of them.
4. The `wilayas` table is reference data (read-only from the app) — it gets FORCE
   RLS but no input validation constraints since the app never writes to it.
*/

-- 1. FORCE Row Level Security on all public tables
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contracts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE public.jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.wilayas FORCE ROW LEVEL SECURITY;

-- 2. Input validation CHECK constraints (idempotent via DO blocks)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_full_name_length') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_full_name_length
      CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_valid') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_valid
      CHECK (role IN ('worker', 'employer'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_content_length') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_content_length
      CHECK (char_length(content) >= 1 AND char_length(content) <= 2000);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_title_length') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT contracts_title_length
      CHECK (char_length(title) >= 3 AND char_length(title) <= 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contracts_amount_positive') THEN
    ALTER TABLE public.contracts ADD CONSTRAINT contracts_amount_positive
      CHECK (amount >= 0);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_comment_length') THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_comment_length
      CHECK (comment IS NULL OR char_length(comment) <= 1000);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_title_length') THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_title_length
      CHECK (char_length(title) >= 1 AND char_length(title) <= 200);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_title_length') THEN
    ALTER TABLE public.jobs ADD CONSTRAINT jobs_title_length
      CHECK (char_length(title) >= 3 AND char_length(title) <= 200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_description_length') THEN
    ALTER TABLE public.jobs ADD CONSTRAINT jobs_description_length
      CHECK (char_length(description) >= 10 AND char_length(description) <= 5000);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_budget_positive') THEN
    ALTER TABLE public.jobs ADD CONSTRAINT jobs_budget_positive
      CHECK (budget IS NULL OR budget >= 0);
  END IF;
END $$;
