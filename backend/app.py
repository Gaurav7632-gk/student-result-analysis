import os
import json
import jwt
import io
import base64
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask import send_from_directory, abort
from flask_cors import CORS
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

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

# JWT secret
JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("SECRET_KEY") or "dev-secret"

def _create_token(user_id: int):
    payload = {
        "user_id": int(user_id),
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def _decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        return None

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
        # try to resolve user from Authorization header
        user_id = None
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1].strip()
            decoded = _decode_token(token)
            if decoded and decoded.get("user_id"):
                user_id = int(decoded.get("user_id"))

        # If Supabase client available, insert using Supabase (server-side key)
        if use_supabase and supabase is not None:
            # Insert as a JSON object into `submissions` table's `data` column
            insert_obj = {"data": payload}
            if user_id:
                insert_obj["user_id"] = user_id
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
        if user_id:
            cur.execute("INSERT INTO submissions (data, user_id) VALUES (%s, %s) RETURNING id, created_at;", (Json(payload), user_id))
        else:
            cur.execute("INSERT INTO submissions (data) VALUES (%s) RETURNING id, created_at;", (Json(payload),))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"id": row[0], "created_at": row[1].isoformat()}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _fetch_rows(filters=None, limit=None, offset=None):
    """Return list of tuples (id, data_dict, created_at).
    Supports either direct Postgres (psycopg2) or Supabase client.
    """
    if use_supabase and supabase is not None:
        # Supabase: fetch and return the raw rows
        try:
            resp = supabase.table("submissions").select("id,data,created_at").order("created_at", desc=True).execute()
            rows = resp.data if hasattr(resp, "data") else resp
            normalized = []
            for r in rows:
                normalized.append((r.get("id"), r.get("data"), r.get("created_at")))
            return normalized
        except Exception:
            return []

    conn = get_conn()
    cur = conn.cursor()
    where_clauses = []
    params = []
    if filters:
        q = filters.get("q")
        course = filters.get("course")
        semester = filters.get("semester")
        user_only = filters.get("user_only")
        user_id = filters.get("user_id")
        if q:
            where_clauses.append("(data->'student'->>'name' ILIKE %s OR data->'student'->>'rollNumber' ILIKE %s OR data->'student'->>'registrationNumber' ILIKE %s)")
            params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
        if course:
            where_clauses.append("data->'student'->>'courseName' ILIKE %s")
            params.append(course)
        if semester:
            where_clauses.append("data->'student'->>'semester' = %s")
            params.append(str(semester))
        if user_only and user_id:
            where_clauses.append("user_id = %s")
            params.append(int(user_id))

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""
    limit_sql = f"LIMIT {int(limit)}" if limit else "LIMIT 100"
    offset_sql = f"OFFSET {int(offset)}" if offset else ""
    sql = f"SELECT id, data, created_at FROM submissions {where_sql} ORDER BY created_at DESC {limit_sql} {offset_sql};"

    cur.execute(sql, tuple(params))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    normalized = []
    for row in rows:
        rid, data, created = row
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except Exception:
                pass
        normalized.append((rid, data, created))
    return normalized


def _get_submission_by_id(sid):
    """Return tuple (id, data_dict, created_at) or None"""
    if use_supabase and supabase is not None:
        try:
            resp = supabase.table("submissions").select("id,data,created_at").eq("id", sid).execute()
            rows = resp.data if hasattr(resp, "data") else resp
            if not rows:
                return None
            r = rows[0]
            return (r.get("id"), r.get("data"), r.get("created_at"))
        except Exception:
            return None

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, data, created_at FROM submissions WHERE id=%s", (sid,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return None
    rid, data, created = row
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except Exception:
            pass
    return (rid, data, created)


def _generate_pdf_bytes(submission_data: dict) -> bytes:
    """Generate a highly professional PDF (bytes) from submission JSON using reportlab + matplotlib."""
    try:
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors as rl_colors
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
    except Exception as e:
        raise RuntimeError(f"PDF generation libraries missing: {e}")

    try:
        import matplotlib
        matplotlib.use('Agg')  # Forces non-GUI thread-safe backend
        import matplotlib.pyplot as plt
        from PIL import Image as PILImage
    except Exception as e:
        raise RuntimeError(f"Chart/image libraries missing: {e}")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=30)
    styles = getSampleStyleSheet()
    
    # Custom Styles for Modern Look
    title_style = ParagraphStyle('ModernTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=24, spaceAfter=20, textColor=rl_colors.HexColor('#111827'), alignment=TA_CENTER)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=rl_colors.HexColor('#6B7280'), alignment=TA_CENTER, spaceAfter=20)
    section_title = ParagraphStyle('SectionTitle', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, textColor=rl_colors.HexColor('#374151'), spaceBefore=15, spaceAfter=10, borderPadding=5)
    normal_text = ParagraphStyle('NormalText', parent=styles['Normal'], fontName='Helvetica', fontSize=10, textColor=rl_colors.HexColor('#4B5563'), leading=14)
    bold_text = ParagraphStyle('BoldText', parent=normal_text, fontName='Helvetica-Bold', textColor=rl_colors.HexColor('#111827'))
    
    elements = []

    student = submission_data.get("student", {}) or {}
    subjects = submission_data.get("subjects", []) or []

    # 1. Header Section (Logo + University Name)
    uni_name = student.get("universityName") or submission_data.get("universityName") or "University Transcript"
    logo_path = os.path.join(os.getcwd(), "public", "cimage-logo.webp")
    header_table_data = []
    
    if os.path.exists(logo_path):
        try:
            pil = PILImage.open(logo_path).convert("RGB")
            logo_buf = io.BytesIO()
            pil.save(logo_buf, format="PNG")
            logo_buf.seek(0)
            logo_img = RLImage(logo_buf, width=65, height=65)
            header_table_data = [[logo_img]]
        except Exception:
            pass
            
    header_table_data.append([Paragraph(str(uni_name).upper(), title_style)])
    header_table_data.append([Paragraph("OFFICIAL RECORD OF ACADEMIC PERFORMANCE", subtitle_style)])
    
    header_tbl = Table(header_table_data, colWidths=[doc.width])
    header_tbl.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    elements.append(header_tbl)
    elements.append(HRFlowable(width="100%", thickness=1, color=rl_colors.HexColor('#E5E7EB'), spaceBefore=5, spaceAfter=20))

    # 2. Student Details Section (2-Column Grid)
    student_data = [
        [Paragraph("<b>Student Name:</b>", bold_text), Paragraph(f"{student.get('name','')}", normal_text),
         Paragraph("<b>Roll Number:</b>", bold_text), Paragraph(f"{student.get('rollNumber','') or 'N/A'}", normal_text)],
        [Paragraph("<b>Degree Program:</b>", bold_text), Paragraph(f"{student.get('courseName','')}", normal_text),
         Paragraph("<b>Registration Number:</b>", bold_text), Paragraph(f"{student.get('registrationNumber','') or 'N/A'}", normal_text)],
        [Paragraph("<b>Academic Session:</b>", bold_text), Paragraph(f"{student.get('academicYear','') or 'N/A'}", normal_text),
         Paragraph("<b>Semester/Term:</b>", bold_text), Paragraph(f"{student.get('semester','')}", normal_text)]
    ]
    
    details_tbl = Table(student_data, colWidths=[100, 150, 120, 130])
    details_tbl.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(details_tbl)
    elements.append(Spacer(1, 15))

    # 3. Academic Record (Subjects Table)
    elements.append(Paragraph("ACADEMIC RECORD", section_title))
    
    table_data = [["Course Title", "Maximum Marks", "Marks Obtained", "Status"]]
    total_max = 0.0
    total_obt = 0.0
    
    for i, s in enumerate(subjects):
        maxm = float(s.get('maxMarks') or 0)
        marks = float(s.get('marksObtained') or 0)
        total_max += maxm
        total_obt += marks
        status = "PASS" if marks >= (0.4 * maxm if maxm else 0) else "FAIL"
        
        table_data.append([
            str(s.get('name') or ''), 
            str(int(maxm)), 
            str(int(marks)), 
            status
        ])

    table_data.append(["AGGREGATE TOTAL", str(int(total_max)), str(int(total_obt)), ""])

    t = Table(table_data, hAlign='LEFT', colWidths=[240, 90, 90, 80])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), rl_colors.HexColor('#F3F4F6')), # Light Gray Header
        ('TEXTCOLOR', (0,0), (-1,0), rl_colors.HexColor('#111827')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'), # Center align numbers
        ('ALIGN', (0,0), (0,-1), 'LEFT'),   # Left align subjects
        ('FONTNAME', (0,1), (-1,-2), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 9),
        ('TEXTCOLOR', (0,1), (-1,-1), rl_colors.HexColor('#374151')),
        ('GRID', (0,0), (-1,-2), 0.5, rl_colors.HexColor('#E5E7EB')), # Subtle borders
        ('LINEABOVE', (0,-1), (-1,-1), 1.5, rl_colors.HexColor('#111827')), # Thick line for total
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'), # Bold total row
        ('BOTTOMPADDING', (0,-1), (-1,-1), 8),
        ('TOPPADDING', (0,-1), (-1,-1), 8),
    ]))
    
    # Color code 'PASS' / 'FAIL'
    for row_idx in range(1, len(table_data) - 1):
        status_val = table_data[row_idx][3]
        color = rl_colors.HexColor('#059669') if status_val == "PASS" else rl_colors.HexColor('#DC2626')
        t.setStyle(TableStyle([('TEXTCOLOR', (3, row_idx), (3, row_idx), color), ('FONTNAME', (3, row_idx), (3, row_idx), 'Helvetica-Bold')]))

    elements.append(t)
    elements.append(Spacer(1, 20))

    # 4. Final Verdict & Summary
    perc = (total_obt / total_max * 100) if total_max else 0.0
    status_text = "PASS" if perc >= 40 else "FAIL"
    status_color = "#059669" if status_text == "PASS" else "#DC2626"
    
    summary_data = [
        [Paragraph(f"<b>FINAL PERCENTAGE:</b> {perc:.2f}%", bold_text), 
         Paragraph(f"<b>OVERALL VERDICT:</b> <font color='{status_color}'>{status_text}</font>", bold_text)]
    ]
    summary_tbl = Table(summary_data, colWidths=[250, 250])
    summary_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), rl_colors.HexColor('#F9FAFB')),
        ('BOX', (0,0), (-1,-1), 1, rl_colors.HexColor('#D1D5DB')),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (1,0), (1,0), 'RIGHT')
    ]))
    elements.append(summary_tbl)
    elements.append(Spacer(1, 25))

    # 5. Charts: subject-wise bar chart (Cleaned up)
    names = [str(s.get('name','')) for s in subjects]
    marks = [float(s.get('marksObtained') or 0) for s in subjects]
    maxs = [float(s.get('maxMarks') or 0) for s in subjects]
    
    if names and any(marks):
        try:
            fig, ax = plt.subplots(figsize=(6.5, 2.5))
            ax.bar(names, marks, label='Obtained', color='#111827', width=0.4)
            ax.plot(names, maxs, label='Maximum marks', color='#9CA3AF', marker='o', linestyle='--')
            
            # Remove top and right spines for a modern clean look
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.spines['left'].set_color('#E5E7EB')
            ax.spines['bottom'].set_color('#E5E7EB')
            
            ax.set_ylabel('Score', color='#6B7280', fontsize=9)
            ax.tick_params(axis='both', colors='#6B7280', labelsize=8)
            ax.set_xticks(range(len(names)))
            ax.set_xticklabels(names, rotation=15, ha='right')
            ax.legend(frameon=False, fontsize=8)
            
            plt.tight_layout()
            imgbuf = io.BytesIO()
            fig.savefig(imgbuf, format='png', dpi=200, transparent=True)
            plt.close(fig)
            imgbuf.seek(0)
            
            elements.append(Paragraph("PERFORMANCE VISUALIZATION", section_title))
            elements.append(RLImage(imgbuf, width=450, height=160))
        except Exception:
            pass

    # Footer note
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=rl_colors.HexColor('#E5E7EB')))
    elements.append(Paragraph("This is an electronically generated academic record and does not require a physical signature.", ParagraphStyle('Footer', parent=subtitle_style, fontSize=8, spaceBefore=5)))

    doc.build(elements)
    buf.seek(0)
    return buf.read()


def _send_via_sendgrid(pdf_bytes: bytes, filename: str, to_email: str, subject: str, from_email: str) -> (bool, str):
    """Send bytes via SendGrid API. Returns (ok, message)."""
    key = os.getenv('SENDGRID_API_KEY') or os.getenv('SENDGRID_KEY')
    if not key:
        return False, 'no-sendgrid-key'
    try:
        import requests
        import base64
        b64 = base64.b64encode(pdf_bytes).decode('ascii')
        payload = {
            "personalizations": [{"to": [{"email": to_email}], "subject": subject}],
            "from": {"email": from_email},
            "content": [{"type": "text/plain", "value": f"Please find attached the result PDF for {filename}."}],
            "attachments": [{"content": b64, "type": "application/pdf", "filename": filename}],
        }
        headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        resp = requests.post("https://api.sendgrid.com/v3/mail/send", json=payload, headers=headers, timeout=30)
        if not resp.ok:
            return False, f'sendgrid:{resp.status_code}:{resp.text}'
        return True, 'sent-via-sendgrid'
    except Exception as e:
        return False, f'sendgrid-exception:{str(e)}'


def _send_via_mailgun(pdf_bytes: bytes, filename: str, to_email: str, subject: str, from_email: str) -> (bool, str):
    """Send bytes via Mailgun API. Requires MAILGUN_API_KEY and MAILGUN_DOMAIN env vars."""
    key = os.getenv('MAILGUN_API_KEY') or os.getenv('MAILGUN_KEY') or os.getenv('MAILGUN_API')
    domain = os.getenv('MAILGUN_DOMAIN')
    if not key or not domain:
        return False, 'no-mailgun-config'
    try:
        import requests
        url = f'https://api.mailgun.net/v3/{domain}/messages'
        data = {
            'from': from_email,
            'to': to_email,
            'subject': subject,
            'text': f'Please find attached the result PDF for {filename}.'
        }
        files = {
            'attachment': (filename, io.BytesIO(pdf_bytes), 'application/pdf')
        }
        resp = requests.post(url, auth=('api', key), data=data, files=files, timeout=30)
        if not resp.ok:
            return False, f'mailgun:{resp.status_code}:{resp.text}'
        return True, 'sent-via-mailgun'
    except Exception as e:
        return False, f'mailgun-exception:{str(e)}'


def _send_via_mailtrap(pdf_bytes: bytes, filename: str, to_email: str, subject: str,
                       from_email: str, from_name: str = '', html_body: str = '', text_body: str = '') -> tuple:
    """Send bytes via Mailtrap Send API using API token."""
    token = os.getenv('MAILTRAP_API_TOKEN') or os.getenv('MAILTRAP_TOKEN')
    inbox_id = os.getenv('MAILTRAP_INBOX_ID')
    if not token:
        return False, 'no-mailtrap-token'
    if not inbox_id:
        return False, 'no-mailtrap-inbox'
    try:
        import requests
        import base64
        b64 = base64.b64encode(pdf_bytes).decode('ascii')
        payload = {
            "from": {"email": from_email, "name": from_name} if from_name else {"email": from_email},
            "to": [{"email": to_email}],
            "subject": subject,
            "html": html_body,
            "text": text_body or f"Please find attached the result PDF for {filename}.",
            "attachments": [{"content": b64, "filename": filename, "type": "application/pdf"}]
        }
        # Prefer sandbox endpoint with inbox id (as used in test_mailtrap.py)
        url = os.getenv('MAILTRAP_API_URL') or f'https://sandbox.api.mailtrap.io/api/send/{inbox_id}'
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        if resp.ok:
            return True, 'sent-via-mailtrap'
        # fallback: try an alternative header name
        headers2 = {"Api-Token": token, "Content-Type": "application/json"}
        resp2 = requests.post(url, json=payload, headers=headers2, timeout=30)
        if resp2.ok:
            return True, 'sent-via-mailtrap'
        return False, f'mailtrap:{resp.status_code}:{resp.text} | {resp2.status_code}:{resp2.text}'
    except Exception as e:
        return False, f'mailtrap-exception:{str(e)}'


def _send_via_smtp(pdf_bytes: bytes, filename: str, to_email: str, subject: str,
                   from_email: str, from_name: str = '', html_body: str = '', text_body: str = '') -> tuple:
    """Send via SMTP — reliable for large PDF attachments.
    Uses SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD from env.
    Builds a full multipart/mixed MIME message with HTML body + PDF attachment.
    """
    smtp_host = os.getenv('SMTP_HOST')
    smtp_port = int(os.getenv('SMTP_PORT') or 0)
    smtp_user = os.getenv('SMTP_USER') or os.getenv('SMTP_USERNAME')
    smtp_pass = os.getenv('SMTP_PASSWORD') or os.getenv('SMTP_PASS')

    if not smtp_host or not smtp_port:
        return False, 'no-smtp-config'

    try:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText
        from email.mime.base import MIMEBase
        from email import encoders
        from email.utils import formataddr

        # Build MIME message
        msg = MIMEMultipart('mixed')
        msg['Subject'] = subject
        msg['From']    = formataddr((from_name, from_email)) if from_name else from_email
        msg['To']      = to_email

        # Body (HTML preferred, plain text fallback)
        body_alt = MIMEMultipart('alternative')
        plain = text_body or f'Please find the attached academic result PDF: {filename}'
        body_alt.attach(MIMEText(plain, 'plain', 'utf-8'))
        if html_body:
            body_alt.attach(MIMEText(html_body, 'html', 'utf-8'))
        msg.attach(body_alt)

        # PDF attachment
        part = MIMEBase('application', 'pdf')
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        part.add_header('Content-Disposition', 'attachment', filename=filename)
        msg.attach(part)

        # Send
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=60) as server:
                if smtp_user and smtp_pass:
                    server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [to_email], msg.as_bytes())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=60) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                if smtp_user and smtp_pass:
                    server.login(smtp_user, smtp_pass)
                server.sendmail(from_email, [to_email], msg.as_bytes())

        return True, 'sent-via-smtp'

    except Exception as exc:
        return False, f'smtp-exception: {exc}'


def _send_bytes_via_providers(pdf_bytes: bytes, filename: str, to_email: str, subject: str,
                               data: dict = None) -> tuple:
    """Send email with PDF attachment.
    Strategy: SMTP first (most reliable for attachments), REST API fallback.
    """
    from_email = os.getenv('SMTP_FROM') or os.getenv('MAILTRAP_FROM') or 'mailtrap@demomailtrap.com'
    from_name  = os.getenv('SMTP_FROM_NAME') or os.getenv('MAILTRAP_FROM_NAME') or 'UniResult Portal'

    html_body = _build_result_html(data) if data else ''
    text_body = 'Your academic result PDF is attached to this email.' if html_body else ''

    # 1. Try SMTP (primary - handles large PDFs reliably)
    ok, msg = _send_via_smtp(
        pdf_bytes, filename, to_email, subject,
        from_email, from_name, html_body, text_body
    )
    if ok:
        return True, msg

    smtp_err = msg  # save for consolidated error

    # 2. Fallback: Mailtrap REST API
    ok2, msg2 = _send_via_mailtrap(
        pdf_bytes, filename, to_email, subject,
        from_email, from_name, html_body, text_body
    )
    if ok2:
        return True, msg2

    return False, f'Both transports failed | SMTP: {smtp_err} | REST: {msg2}'


def _save_failed_pdf(pdf_bytes: bytes, filename: str, to_email: str) -> str:
    """Save failed pdf to backend/failed_emails and return relative filename."""
    try:
        folder = os.path.join(os.getcwd(), 'failed_emails')
        os.makedirs(folder, exist_ok=True)
        safe_name = filename.replace(' ', '_').replace('/', '_')
        ts = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
        out_name = f"{ts}_{to_email.replace('@', '_at_')}_{safe_name}"
        out_path = os.path.join(folder, out_name)
        with open(out_path, 'wb') as f:
            f.write(pdf_bytes)
        return out_name
    except Exception:
        return ''


@app.route('/email-submission', methods=['POST'])
def email_submission():
    """Generate PDF server-side for a stored submission and email it to student or provided address.
    Accepts JSON: { "id": <submission_id>, "email": <optional override>, "subject": <optional> }
    """
    try:
        payload = request.get_json(force=True)
        sid = payload.get('id') or payload.get('submission_id')
        if not sid:
            return jsonify({'error': 'missing submission id'}), 400

        row = _get_submission_by_id(sid)
        if not row:
            return jsonify({'error': 'submission not found'}), 404
        _, data, created = row

        to_email = (payload.get('email') or (data.get('student') or {}).get('email'))
        if not to_email:
            return jsonify({'error': 'no recipient email found in submission; provide email in body'}), 400

        pdf_bytes = _generate_pdf_bytes(data)

        filename = f"{(data.get('student') or {}).get('name','result').replace(' ','_')}_Sem{(data.get('student') or {}).get('semester','')}_Result.pdf"
        sendgrid_key = os.getenv('SENDGRID_API_KEY') or os.getenv('SENDGRID_KEY')
        sendgrid_from = os.getenv('SENDGRID_FROM') or os.getenv('SMTP_FROM') or os.getenv('EMAIL_FROM') or 'no-reply@example.com'
        subject = payload.get('subject') or f"Result — {(data.get('student') or {}).get('name','Student')}"

        # Try providers in order (SendGrid, Mailgun, SMTP)
        ok, msg = _send_bytes_via_providers(pdf_bytes, filename, to_email, subject)
        if not ok:
            # save PDF locally for manual sending
            saved = _save_failed_pdf(pdf_bytes, filename, to_email)
            details = {'error': msg}
            if saved:
                details['saved'] = f"/failed-emails/{saved}"
            return jsonify(details), 500
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/email-now', methods=['POST'])
def email_now():
    """Generate PDF from provided JSON payload and send it to the given email.
    Request JSON: { "result": <submission-json>, "email": "to@example.com", "subject": "optional" }
    """
    try:
        payload = request.get_json(force=True)
        if not payload:
            return jsonify({'error': 'missing json payload'}), 400
        data = payload.get('result') or payload.get('data') or payload
        to_email = payload.get('email') or (data.get('student') or {}).get('email')
        subject = payload.get('subject') or f"Result — {(data.get('student') or {}).get('name','Student')}"
        if not to_email:
            return jsonify({'error': 'recipient email not provided in payload or student record'}), 400

        pdf_bytes = _generate_pdf_bytes(data)
        filename = f"{(data.get('student') or {}).get('name','result').replace(' ','_')}_Sem{(data.get('student') or {}).get('semester','')}_Result.pdf"

        ok, msg = _send_bytes_via_providers(pdf_bytes, filename, to_email, subject)
        if not ok:
            saved = _save_failed_pdf(pdf_bytes, filename, to_email)
            details = {'error': msg}
            if saved:
                details['saved'] = f"/failed-emails/{saved}"
            return jsonify(details), 500
        return jsonify({'ok': True, 'message': msg})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/submissions", methods=["GET"])
def list_submissions():
    try:
        q = request.args.get("q")
        course = request.args.get("course")
        semester = request.args.get("semester")
        limit = request.args.get("limit")
        offset = request.args.get("offset")
        user_only = request.args.get("user_only")

        # if user_only requested and Authorization provided, decode user
        user_id = None
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            decoded = _decode_token(auth.split(" ", 1)[1].strip())
            if decoded:
                user_id = decoded.get("user_id")

        rows = _fetch_rows(filters={"q": q, "course": course, "semester": semester, "user_only": user_only, "user_id": user_id}, limit=limit, offset=offset)
        out = []
        for rid, data, created in rows:
            created_iso = created.isoformat() if hasattr(created, "isoformat") else created
            out.append({"id": rid, "data": data, "created_at": created_iso})
        return jsonify(out)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analytics", methods=["GET"])
def analytics():
    try:
        course = request.args.get("course")
        semester = request.args.get("semester")
        rows = _fetch_rows(filters={"course": course, "semester": semester}, limit=10000)

        subject_stats = {}
        totals = 0.0
        count = 0
        pass_count = 0
        semester_stats = {}

        for rid, data, created in rows:
            if not isinstance(data, dict):
                continue
            subjects = data.get("subjects", []) or []
            total_marks = 0.0
            total_max = 0.0
            passed = True
            for s in subjects:
                name = str(s.get("name", "")).strip()
                marks = float(s.get("marksObtained") or 0)
                maxm = float(s.get("maxMarks") or 100)
                total_marks += marks
                total_max += maxm
                if marks < maxm * 0.4:
                    passed = False
                if name:
                    st = subject_stats.setdefault(name, {"sum": 0.0, "count": 0})
                    st["sum"] += marks
                    st["count"] += 1
            if total_max > 0:
                perc = (total_marks / total_max) * 100
                totals += perc
                count += 1
                if passed:
                    pass_count += 1
                sem = data.get("student", {}).get("semester")
                try:
                    sem_k = str(int(sem)) if sem is not None else "0"
                except Exception:
                    sem_k = str(sem or "0")
                se = semester_stats.setdefault(sem_k, {"sum": 0.0, "count": 0})
                se["sum"] += perc
                se["count"] += 1

        overall_avg = (totals / count) if count else 0
        pass_rate = (pass_count / count * 100) if count else 0
        subject_averages = {k: (v["sum"] / v["count"]) for k, v in subject_stats.items()}
        semester_averages = {k: (v["sum"] / v["count"]) for k, v in semester_stats.items()}

        return jsonify({
            "overallAverage": overall_avg,
            "passRate": pass_rate,
            "subjectAverages": subject_averages,
            "semesterAverages": semester_averages,
            "count": count,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/toppers", methods=["GET"])
def toppers():
    try:
        limit = int(request.args.get("limit") or 10)
        course = request.args.get("course")
        semester = request.args.get("semester")

        rows = _fetch_rows(filters={"course": course, "semester": semester}, limit=10000)
        entries = []
        for rid, data, created in rows:
            if not isinstance(data, dict):
                continue
            subjects = data.get("subjects", []) or []
            total_marks = 0.0
            total_max = 0.0
            for s in subjects:
                marks = float(s.get("marksObtained") or 0)
                maxm = float(s.get("maxMarks") or 100)
                total_marks += marks
                total_max += maxm
            perc = (total_marks / total_max * 100) if total_max > 0 else 0
            entries.append({
                "id": rid,
                "student": data.get("student", {}),
                "percentage": perc,
                "totalObtained": total_marks,
                "totalMax": total_max,
                "created_at": created.isoformat() if hasattr(created, "isoformat") else created,
            })

        entries.sort(key=lambda x: (-x["percentage"], x.get("created_at", "")))
        ranked = []
        prev_perc = None
        rank = 0
        for i, e in enumerate(entries):
            if prev_perc is None or e["percentage"] != prev_perc:
                rank = i + 1
                prev_perc = e["percentage"]
            e["rank"] = rank
            ranked.append(e)

        return jsonify(ranked[:limit])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/auth/register", methods=["POST"])
def auth_register():
    try:
        payload = request.get_json(force=True)
        name = payload.get("name")
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password")
        if not email or not password:
            return jsonify({"error": "email and password required"}), 400

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "user exists"}), 400

        pwd_hash = generate_password_hash(password)
        cur.execute("INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id, name, email", (name, email, pwd_hash))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        user_id = row[0]
        token = _create_token(user_id)
        return jsonify({"token": token, "user": {"id": user_id, "name": row[1], "email": row[2]}}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/auth/login", methods=["POST"])
def auth_login():
    try:
        payload = request.get_json(force=True)
        email = (payload.get("email") or "").strip().lower()
        password = payload.get("password")
        if not email or not password:
            return jsonify({"error": "email and password required"}), 400

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, password_hash FROM users WHERE email=%s", (email,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return jsonify({"error": "invalid credentials"}), 401
        user_id, name, email, pwd_hash = row[0], row[1], row[2], row[3]
        if not check_password_hash(pwd_hash, password):
            return jsonify({"error": "invalid credentials"}), 401
        token = _create_token(user_id)
        return jsonify({"token": token, "user": {"id": user_id, "name": name, "email": email}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/auth/me", methods=["GET"])
def auth_me():
    try:
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return jsonify({"error": "missing token"}), 401
        decoded = _decode_token(auth.split(" ", 1)[1].strip())
        if not decoded or not decoded.get("user_id"):
            return jsonify({"error": "invalid token"}), 401
        user_id = int(decoded.get("user_id"))
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SELECT id, name, email, created_at FROM users WHERE id=%s", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return jsonify({"error": "user not found"}), 404
        return jsonify({"id": row[0], "name": row[1], "email": row[2], "created_at": row[3].isoformat() if row[3] else None})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/send-email", methods=["POST"])
def send_email():
    try:
        # Expect multipart/form-data with 'file' and form field 'email'
        to_email = request.form.get('email') or None
        subject = request.form.get('subject') or 'Your Result PDF'
        file = request.files.get('file')
        if not to_email or not file:
            return jsonify({'error': 'missing email or file'}), 400

        file_bytes = file.read()
        filename = file.filename or 'result.pdf'

        ok, msg = _send_bytes_via_providers(file_bytes, filename, to_email, subject)
        if not ok:
            # save PDF locally for manual sending
            saved = _save_failed_pdf(file_bytes, filename, to_email)
            details = {'error': msg}
            if saved:
                details['saved'] = f"/failed-emails/{saved}"
            return jsonify(details), 500
        return jsonify({'ok': True, 'message': msg})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


@app.route('/failed-emails/<path:filename>', methods=['GET'])
def failed_email_download(filename):
    folder = os.path.join(os.getcwd(), 'failed_emails')
    if not os.path.exists(os.path.join(folder, filename)):
        return abort(404)
    return send_from_directory(folder, filename, as_attachment=True)
