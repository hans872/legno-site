-- ============================================================
-- Legno — initial schema
-- Run this in your Supabase dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension (usually already on)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- Extended user info beyond auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name    TEXT,
  last_name     TEXT,
  company       TEXT NOT NULL DEFAULT '',
  website       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, first_name, last_name, company)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE(NEW.raw_user_meta_data->>'company', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- GMAIL CREDENTIALS
-- OAuth tokens for each user's Gmail
-- ============================================================
CREATE TABLE IF NOT EXISTS gmail_credentials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gmail_address TEXT NOT NULL,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date   BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE gmail_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own gmail creds"
  ON gmail_credentials FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own gmail creds"
  ON gmail_credentials FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- VOICE PROFILES
-- Tone, writing sample, signature
-- ============================================================
CREATE TABLE IF NOT EXISTS voice_profiles (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tone           TEXT NOT NULL DEFAULT 'warm' CHECK (tone IN ('warm', 'direct', 'formal')),
  writing_sample TEXT,
  signature      TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own voice profile"
  ON voice_profiles FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- PERMITS
-- LADBS permits ingested daily
-- ============================================================
CREATE TABLE IF NOT EXISTS permits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_number   TEXT NOT NULL UNIQUE,
  address         TEXT NOT NULL,
  description     TEXT,
  work_type       TEXT,
  valuation       NUMERIC,
  sqft            NUMERIC,
  applicant_name  TEXT,
  contractor_name TEXT,
  contractor_lic  TEXT,
  status          TEXT,
  filed_at        TIMESTAMPTZ,
  raw             JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permits are readable by all authenticated users (no RLS filter needed on user_id)
ALTER TABLE permits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read permits"
  ON permits FOR SELECT USING (auth.role() = 'authenticated');

-- Service role only for insert/update (done by cron job)
CREATE POLICY "Service role can manage permits"
  ON permits FOR ALL USING (auth.role() = 'service_role');

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS permits_filed_at_idx ON permits (filed_at DESC);

-- ============================================================
-- OUTREACH
-- Every email drafted and/or sent
-- ============================================================
CREATE TABLE IF NOT EXISTS outreach (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permit_id       UUID REFERENCES permits(id) ON DELETE SET NULL,
  to_address      TEXT NOT NULL,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  gmail_message_id TEXT,
  gmail_thread_id TEXT,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sent', 'skipped', 'error')),
  sent_at         TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own outreach"
  ON outreach FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS outreach_user_id_idx ON outreach (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_thread_idx ON outreach (gmail_thread_id);

-- ============================================================
-- REPLIES
-- Replies to outreach, classified by Claude
-- ============================================================
CREATE TABLE IF NOT EXISTS replies (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outreach_id      UUID NOT NULL REFERENCES outreach(id) ON DELETE CASCADE,
  gmail_message_id TEXT NOT NULL UNIQUE,
  from_address     TEXT NOT NULL,
  from_name        TEXT,
  subject          TEXT,
  body             TEXT,
  classification   TEXT CHECK (classification IN ('qualified', 'question', 'not_now', 'auto_reply', 'unclassified')),
  classified_at    TIMESTAMPTZ,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own replies"
  ON replies FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage replies"
  ON replies FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS replies_user_id_idx ON replies (user_id, received_at DESC);

-- ============================================================
-- BILLED EVENTS
-- One record per $50 charge
-- ============================================================
CREATE TABLE IF NOT EXISTS billed_events (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_id             UUID NOT NULL UNIQUE REFERENCES replies(id) ON DELETE CASCADE,
  stripe_payment_id    TEXT,
  amount_cents         INTEGER NOT NULL DEFAULT 5000,
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'paid', 'disputed', 'refunded', 'waived')),
  is_free_first_reply  BOOLEAN NOT NULL DEFAULT FALSE,
  dispute_reason       TEXT,
  disputed_at          TIMESTAMPTZ,
  credited_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE billed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own billed events"
  ON billed_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage billed events"
  ON billed_events FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- STRIPE CUSTOMERS
-- Map Supabase user → Stripe customer
-- ============================================================
CREATE TABLE IF NOT EXISTS stripe_customers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_pm_id       TEXT,
  pm_last4           TEXT,
  pm_brand           TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own stripe customer"
  ON stripe_customers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage stripe customers"
  ON stripe_customers FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- REALTIME
-- Enable on tables that need live updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE permits;
ALTER PUBLICATION supabase_realtime ADD TABLE replies;
ALTER PUBLICATION supabase_realtime ADD TABLE outreach;
