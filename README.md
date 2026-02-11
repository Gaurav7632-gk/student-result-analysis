# UniResult — Result Sheet Generator

A full-stack web application for generating, managing, and saving student result sheets. Built with React + TypeScript (frontend), Flask + PostgreSQL (backend).

## Features

✅ **Generate Result Sheets** — Fill student details, add subjects & marks  
✅ **Live Summary** — Real-time percentage & status calculation  
✅ **Download PDF** — Export result sheet as PDF  
✅ **Save to Database** — Auto-save results to PostgreSQL via backend API  
✅ **Local History** — View previously saved results  
✅ **Responsive UI** — Works on desktop & mobile (Tailwind CSS + shadcn)  

---

## Project Structure

```
my-result-sheet/
├── src/                    # Frontend (React + TypeScript)
│   ├── components/         # UI components (form inputs, cards, etc.)
│   ├── pages/             # Page routes (Index, Preview, History)
│   ├── lib/               # Utilities (storage, PDF generation, API calls)
│   ├── types/             # TypeScript interfaces
│   └── App.tsx            # Main app component
├── backend/               # Backend (Flask + PostgreSQL)
│   ├── app.py            # Flask API (POST /submit endpoint)
│   ├── init_db.py        # Database initialization helper
│   ├── requirements.txt   # Python dependencies
│   ├── .env.example       # Environment variable template
│   └── README.md          # Backend setup guide
├── package.json           # Frontend dependencies
├── .env                   # Frontend config (VITE_API_URL)
├── vite.config.ts        # Vite config
└── README.md             # This file
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn UI |
| **Backend** | Python 3, Flask, Flask-CORS |
| **Database** | PostgreSQL (psycopg2) |
| **Optional** | Supabase (server-side auth with supabase-py) |

---

## Installation & Setup

### Prerequisites
- **Node.js 18+** & npm — [Download](https://nodejs.org/)
- **Python 3.8+** — [Download](https://python.org/)
- **PostgreSQL 12+** — [Download](https://postgresql.org/)

### Step 1: Clone & Install Dependencies

```bash
# Clone the repo
git clone <YOUR_REPO_URL>
cd my-result-sheet

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
python -m pip install -r requirements.txt
cd ..
```

### Step 2: Configure Environment Variables

**Frontend** — Create `.env` in project root:
```env
VITE_API_URL=http://localhost:5000
```

**Backend** — Create `backend/.env`:
```env
# Option A: Direct Postgres (recommended for local dev)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mydb?sslmode=disable

# OR Option B: Supabase (server-side with service role key)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=sb_secret_...
```

See `backend/.env.example` for more options.

### Step 3: Initialize Database

```bash
cd backend
python init_db.py
cd ..
```

This creates the `submissions` table in PostgreSQL.

---

## Running the Project

### Start Both Servers (Recommended)

**Option A: Two Terminals**

Terminal 1 — Backend:
```bash
cd backend
python app.py
```
You'll see: `Running on http://0.0.0.0:5000`

Terminal 2 — Frontend:
```bash
npm run dev
```
You'll see: `Local: http://localhost:8080`

Then open **http://localhost:8080** in your browser.

**Option B: Single Command (PowerShell)**

```powershell
# Create start-dev.ps1 in project root, then run:
.\start-dev.ps1
```

---

## API Endpoints

### POST `/submit`
Save a result to the database.

**Request:**
```json
{
  "student": {
    "name": "John Doe",
    "rollNumber": "2024001",
    "registrationNumber": "REG-2024-001",
    "universityName": "State University",
    "courseName": "B.Tech CSE",
    "semester": 1,
    "academicYear": "2025-26"
  },
  "subjects": [
    {
      "id": "unique-id",
      "name": "Mathematics",
      "maxMarks": 100,
      "marksObtained": 85
    }
  ]
}
```

**Response:**
```json
{
  "id": 1,
  "created_at": "2026-02-11T13:51:06.123556+05:30"
}
```

### GET `/`
Health check.

**Response:**
```json
{
  "status": "ok"
}
```

---

## Usage Guide

1. **Fill Student Details** — Name, roll number, university, course, semester, academic year
2. **Add Subjects** — Add subject names, max marks, obtained marks
3. **View Summary** — See live percentage & pass/fail status
4. **Generate Sheet** — Click "Generate Result Sheet" to see the preview
5. **Save** — Click "Save" to send data to backend + PostgreSQL
6. **Download** — Click "Download PDF" to export as PDF file
7. **View History** — Click "History" to see all saved results

---

## Database Schema

**submissions** table:
```sql
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Troubleshooting

### "Connection Refused" when saving
- Ensure backend is running: `python backend/app.py`
- Check that `VITE_API_URL=http://localhost:5000` is set in `.env`

### "Database Connection Failed"
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `backend/.env` matches your actual DB credentials
- Password with special chars must be URL-encoded (e.g., `@` → `%40`)

### Port Already in Use
```bash
# Find & kill process on port 5000 (Flask)
lsof -i:5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or on Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

---

## Next Steps

- **Deploy** — Push to production (Heroku, Railway, Vercel, etc.)
- **Add Auth** — Implement user signup/login
- **Improve History** — Fetch saved results from DB instead of localStorage
- **Email Export** — Send result sheets via email
- **Admin Panel** — View all submissions

---

## License

MIT

---

## Support

For issues or questions, open an issue on GitHub or contact the maintainer.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

Deployment instructions for various platforms:

**Frontend (Vercel, Netlify, GitHub Pages, etc.)**
```bash
npm run build
# Host the `dist/` folder on your preferred platform
```

**Backend (Heroku, Railway, Render, etc.)**
- Deploy the `backend/` folder
- Set environment variables: `DATABASE_URL` or `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`
- Ensure Flask runs on port `5000`

**Example: Railway**
```bash
git push railway main
```
