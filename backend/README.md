Quick Flask backend to accept form data and save to PostgreSQL.

Steps:

1. Create and activate a virtualenv:

   python -m venv .venv
   .venv\Scripts\activate

2. Install dependencies:

   pip install -r requirements.txt

3. Set `DATABASE_URL` environment variable to your Postgres connection string, e.g.:

   postgres://user:password@localhost:5432/your_db

4. Initialize DB (optional):

   psql "postgres://user:password@localhost:5432/your_db" -f db_init.sql

5. Run the app:

   flask run --host=0.0.0.0 --port=5000

API:
- POST /submit  -> accepts JSON body, saves into `submissions` table under `data` (jsonb).
