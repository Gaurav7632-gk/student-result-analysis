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
