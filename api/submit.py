import os
import json
from http.server import HTTPStatus
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def handler(request):
    """Vercel serverless function to handle POST /api/submit"""
    
    # CORS headers
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    }
    
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }
    
    # Only allow POST
    if request.method != "POST":
        return {
            "statusCode": 405,
            "headers": headers,
            "body": json.dumps({"error": "Method not allowed"})
        }
    
    try:
        # Parse JSON body
        if isinstance(request.body, bytes):
            payload = json.loads(request.body.decode('utf-8'))
        else:
            payload = json.loads(request.body)
        
        if not payload:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "invalid json"})
            }
        
        # Check DATABASE_URL
        if not DATABASE_URL:
            return {
                "statusCode": 500,
                "headers": headers,
                "body": json.dumps({"error": "DATABASE_URL not configured"})
            }
        
        # Insert into database
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO submissions (data) VALUES (%s) RETURNING id, created_at;",
            (Json(payload),)
        )
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            "statusCode": 201,
            "headers": headers,
            "body": json.dumps({
                "id": row[0],
                "created_at": row[1].isoformat()
            })
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
