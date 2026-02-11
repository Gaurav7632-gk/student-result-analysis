-- Create submissions table to store arbitrary form data as JSON
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
