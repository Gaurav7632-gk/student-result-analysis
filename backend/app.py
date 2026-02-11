import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

load_dotenv()

# Support either a direct Postgres URL or Supabase URL + service role key
DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

use_supabase = False
supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        use_supabase = True
    except Exception:
        use_supabase = False

if not use_supabase and not DATABASE_URL:
    raise RuntimeError("Please set DATABASE_URL or SUPABASE_URL + SUPABASE_SERVICE_KEY environment variables (see .env.example)")

app = Flask(__name__)
CORS(app)

def get_conn():
    return psycopg2.connect(DATABASE_URL)

@app.route("/", methods=["GET"])
def index():
    return jsonify({"status":"ok"})

@app.route("/submit", methods=["POST"])
def submit():
    try:
        payload = request.get_json(force=True)
        if payload is None:
            return jsonify({"error":"invalid json"}), 400

        # If Supabase client available, insert using Supabase (server-side key)
        if use_supabase and supabase is not None:
            # Insert as a JSON object into `submissions` table's `data` column
            insert_obj = {"data": payload}
            resp = supabase.table("submissions").insert(insert_obj).execute()
            # resp returns a tuple-like object in some versions
            if hasattr(resp, "error") and resp.error:
                return jsonify({"error": str(resp.error)}), 500
            # Try to extract inserted id and created_at if present
            data = None
            try:
                data = resp.data or resp["data"]
            except Exception:
                data = None
            return jsonify({"ok": True, "data": data}), 201

        # Fallback: direct Postgres
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("INSERT INTO submissions (data) VALUES (%s) RETURNING id, created_at;", (Json(payload),))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"id": row[0], "created_at": row[1].isoformat()}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
