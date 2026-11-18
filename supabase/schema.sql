-- =========================================================================
-- University Class Representative (EC) Treasury Database Schema
-- Material 3 Expressive & Simplified Architecture
-- Multi-Tenant & User-Isolated (Sign in with Google / Email)
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard
-- =========================================================================

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Settings Table (Per user KBZPay EC Details & Preferences)
CREATE TABLE IF NOT EXISTS settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ec_kbzpay_name TEXT DEFAULT '',
    ec_kbzpay_phone TEXT DEFAULT '',
    theme_color_id TEXT DEFAULT 'indigo',
    language TEXT DEFAULT 'my',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Table (Clean roster: name required, phone & roll_number optional)
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    phone TEXT,
    roll_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subjects Table (Academic subjects for fines)
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Events Table (Replaces categories: donation vs fixed_fee)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('donation', 'fixed_fee')),
    fixed_amount INTEGER,
    due_date TEXT,
    extra_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Event Records Table (Contributions / Payments per Event)
CREATE TABLE IF NOT EXISTS event_records (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL DEFAULT 0,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Fines Table (Subject-based fines with simple 1-tap paid status)
CREATE TABLE IF NOT EXISTS fines (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    date TEXT NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe column additions for pre-existing tables if upgrading from v1
ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- Drop previous policies to avoid collision
DROP POLICY IF EXISTS "Allow user isolation for settings" ON settings;
DROP POLICY IF EXISTS "Allow user isolation for students" ON students;
DROP POLICY IF EXISTS "Allow user isolation for subjects" ON subjects;
DROP POLICY IF EXISTS "Allow user isolation for events" ON events;
DROP POLICY IF EXISTS "Allow user isolation for event_records" ON event_records;
DROP POLICY IF EXISTS "Allow user isolation for fines" ON fines;

-- User Isolation Policies: Users can only see and modify their own class data
CREATE POLICY "Allow user isolation for settings" ON settings
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user isolation for students" ON students
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user isolation for subjects" ON subjects
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user isolation for events" ON events
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user isolation for event_records" ON event_records
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow user isolation for fines" ON fines
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Enable Realtime replication for all tables safely (idempotent)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE settings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE students;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE subjects;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_records;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE fines;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
