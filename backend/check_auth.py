from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print('No DATABASE_URL found in environment or .env')
    raise SystemExit(1)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

print('\n=== Users (most recent first) ===')
cur.execute("SELECT id, name, email, created_at FROM users ORDER BY id DESC;")
rows = cur.fetchall()
for r in rows:
    print({'id': r[0], 'name': r[1], 'email': r[2], 'created_at': str(r[3])})

print('\n=== Recent Submissions (showing user_id) ===')
cur.execute("SELECT id, data->'student'->>'name' AS student_name, data->'student'->>'rollNumber' AS rollNumber, user_id, created_at FROM submissions ORDER BY created_at DESC LIMIT 50;")
rows = cur.fetchall()
for r in rows:
    print({'id': r[0], 'student_name': r[1], 'rollNumber': r[2], 'user_id': r[3], 'created_at': str(r[4])})

cur.close()
conn.close()
print('\nDone')
