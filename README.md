# Full-stack CRM Demo (exact frontend preserved)

This version keeps the original React/Vite frontend style, assets, icons, and animations from the provided project, while connecting it to a Flask API backed by PostgreSQL.

## Structure
- `frontend/` React + Vite + original assets/styles
- `backend/` Flask API + PostgreSQL
- `backend/db/schema.sql` PostgreSQL schema to run manually
- `backend/db/seed.sql` optional seed data to run manually

## 1) Create the PostgreSQL tables yourself

Run these files against your PostgreSQL database:

```bash
psql "$DATABASE_URL" -f backend/db/schema.sql
psql "$DATABASE_URL" -f backend/db/seed.sql
```

The Flask app does **not** create tables automatically.

## 2) Backend

Copy `backend/.env.example` values into your environment, then run:

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Runs on `http://127.0.0.1:5000`

## 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://127.0.0.1:5173`

If your backend URL differs, set:

```bash
VITE_API_BASE=http://127.0.0.1:5000
```

## Main pages
- `/dashboard`
- `/admin`
- `/notifications`
- `/generated-messages`
- `/customers/:customerId`

## AI behavior
- The notification list is driven by repeated high-intent behaviors.
- The backend uses the OpenAI Responses API to analyze recent behaviors, suggest the best campaign from your campaign table, and generate a tailored email draft.
- If the model output cannot be used safely, the backend falls back to a deterministic template so the app still works.
