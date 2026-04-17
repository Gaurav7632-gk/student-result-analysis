import os
import sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

SQL = """
-- Create submissions table to store arbitrary form data as JSON
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Indexes to speed JSONB queries and common student lookups
CREATE INDEX IF NOT EXISTS idx_submissions_data ON submissions USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_submissions_student_name_lower ON submissions (lower((data->'student'->>'name')));
CREATE INDEX IF NOT EXISTS idx_submissions_student_roll ON submissions ((data->'student'->>'rollNumber'));
-- Users table for basic authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Associate submissions with users (nullable for existing records)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_id INTEGER;
-- Note: adding a foreign key constraint via ALTER TABLE IF NOT EXISTS is not portable across all Postgres versions,
-- so we only create an index on user_id to support queries.
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions (user_id);
"""

if DATABASE_URL:
    try:
        import psycopg2
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute(SQL)
        conn.commit()
        cur.close()
        conn.close()
        print("Created/verified 'submissions' table using DATABASE_URL")
    except Exception as e:
        print("Failed to initialize DB:", e)
        sys.exit(1)
elif SUPABASE_URL and SUPABASE_SERVICE_KEY:
    print("SUPABASE credentials detected. Please run the SQL below in Supabase SQL editor:")
    print(SQL)
else:
    print("No DATABASE_URL or SUPABASE credentials found. Please set them in .env (see .env.example).")
