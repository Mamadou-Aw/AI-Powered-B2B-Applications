# AI-Powered B2B Application

# Links
live demo : https://lavish-imagination-production-2dc1.up.railway.app  
Github : https://github.com/Mamadou-Aw/AI-Powered-B2B-Applications  
Write-up : AI-Powered-B2B-Application.pdf  


## Application summary

This project is a small AI-powered B2B CRM copilot built for a technical assessment. It helps a sales or marketing team spot high-interest customers, suggest the most relevant campaign, and generate a personalized outreach message that can be reviewed, edited, and sent by email.

The main workflow is:

1. add customers, campaigns, and customer behaviors;
2. detect high-intent customers from repeated strong signals;
3. surface those customers in the Notifications page;
4. use OpenAI to suggest the best campaign fit;
5. generate a natural marketing message draft;
6. edit the message if needed;
7. send it by email.

This project includes:

- a React frontend;
- a Flask REST API backend;
- a PostgreSQL relational database;
- OpenAI integration for campaign suggestion and message generation.

---

## Features

- dashboard with CRM activity summary;
- admin page to add customers, campaigns, and behaviors;
- notification system for high-intent customers;
- AI campaign fit analysis;
- AI-generated marketing message drafts;
- message editing before send;
- email sending through SMTP;
- frontend validation, loading states, and error handling;
- backend validation, proper status codes, and database-backed API.

---

## Tech stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- React Hot Toast
- Motion

### Backend
- Flask
- Flask-CORS
- Psycopg
- OpenAI Python SDK

### Database
- PostgreSQL

---

## Project structure

```text
AI-Powered-B2B-Application/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env
│   ├── db/
│   │   ├── schema.sql
│   │   └── seed.sql
│   └── crm_api/
│       ├── __init__.py
│       ├── db.py
│       ├── utils.py
│       ├── validators.py
│       ├── routes/
│       │   └── api.py
│       └── services/
│           ├── ai_service.py
│           ├── mailer.py
│           └── notifications.py
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── api.js
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       ├── components/
│       └── pages/
│
├── AI-Powered-B2B-Application.pdf
├── README.md
└── .gitignore
```

---

## What each folder is for

### `backend/`
Contains the Flask API, business logic, database access, validation, and AI/email integrations.

#### `backend/app.py`
Backend entry point. It creates the Flask app, registers the API blueprint, enables CORS, and handles application-level errors.

#### `backend/requirements.txt`
Python dependencies required to run the backend.

#### `backend/.env`
Environment variables used by the backend. This file is local to your machine and should not be committed with real secrets.

#### `backend/db/`
Contains the PostgreSQL SQL scripts.

- `schema.sql`: creates the database tables
- `seed.sql`: inserts demo data

#### `backend/crm_api/db.py`
Database connection and helper functions for querying PostgreSQL.

#### `backend/crm_api/utils.py`
Shared constants, custom API error class, time helpers, JSON helpers, and local environment loader.

#### `backend/crm_api/validators.py`
Validation logic for incoming API payloads such as customers, campaigns, behaviors, and generated messages.

#### `backend/crm_api/routes/api.py`
Main REST API routes used by the frontend.

#### `backend/crm_api/services/ai_service.py`
OpenAI-powered logic for:
- selecting the most relevant campaign;
- generating a natural outreach message;
- falling back to a deterministic message if AI output cannot be safely used.

#### `backend/crm_api/services/notifications.py`
High-intent detection logic. It groups repeated customer behaviors and builds the alert list shown in the Notifications page.

#### `backend/crm_api/services/mailer.py`
Email sending service using SMTP.

---

### `frontend/`
Contains the React application used by the end user.

#### `frontend/src/App.jsx`
Main application shell, router, navbar/footer integration, and route definitions.

#### `frontend/src/api.js`
Frontend API client used to call the Flask backend.

#### `frontend/src/components/`
Reusable UI components such as layout containers, navbar, footer, cards, error states, and loading states.

#### `frontend/src/pages/`
The main pages of the application:

- `DashboardPage.jsx`: KPI overview, recent behaviors, recent messages
- `AdminPage.jsx`: add and review customers, campaigns, and behaviors
- `NotificationsPage.jsx`: high-intent customers, campaign suggestion, message generation
- `MessagesPage.jsx`: generated message list and send actions
- `EditMessagePage.jsx`: review and edit a generated message before sending
- `CustomerDetailPage.jsx`: customer profile, behaviors, and related messages

#### `frontend/src/assets/`
Images, icons, and visual assets used by the UI.

#### `frontend/public/`
Static public assets served directly by Vite.

---

## Database schema

The application uses four main PostgreSQL tables:

### `customers`
Stores customer information.

Main fields:
- `id`
- `full_name`
- `email`
- `company`
- `job_title`
- `industry`
- `created_at`

### `campaigns`
Stores marketing campaigns available in the CRM.

Main fields:
- `id`
- `name`
- `goal`
- `channel`
- `created_at`

### `customer_behaviors`
Stores customer signals such as website visits, downloads, social interactions, or search interest.

Main fields:
- `id`
- `customer_id`
- `source`
- `behavior_type`
- `details`
- `score`
- `created_at`

### `generated_messages`
Stores AI-generated outreach drafts linked to both a customer and a campaign.

Main fields:
- `id`
- `customer_id`
- `campaign_id`
- `subject`
- `message_body`
- `ai_reason`
- `status`
- `created_at`
- `sent_at`

### Table relationships
- one customer can have many behaviors;
- one customer can have many generated messages;
- one campaign can have many generated messages.

Important: the application does **not** create the tables automatically. You must run the SQL scripts yourself.

---

## Prerequisites

Before starting the project, make sure you have:

- Python 3.10 or newer;
- Node.js 18 or newer;
- PostgreSQL installed and running;
- an OpenAI API key;
- SMTP credentials if you want to send real emails.

---

## Environment variables

Create or update `backend/.env` with values like these:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/crm_ai
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5.4-mini

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_app_password
SMTP_SENDER=your_email@example.com
```

### What these variables mean

- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: API key used for campaign analysis and message generation
- `OPENAI_MODEL`: OpenAI model name used by the backend
- `SMTP_HOST`: outgoing mail server
- `SMTP_PORT`: outgoing mail server port
- `SMTP_USER`: email account used to send messages
- `SMTP_PASSWORD`: password or app password for the email account
- `SMTP_SENDER`: sender address shown in outgoing emails

---

## Database setup

### 1. Create the PostgreSQL database

Example:

```sql
CREATE DATABASE crm_ai;
```

### 2. Run the schema script

```bash
psql -U postgres -h localhost -p 5432 -d crm_ai -f backend/db/schema.sql
```

### 3. Seed demo data

```bash
psql -U postgres -h localhost -p 5432 -d crm_ai -f backend/db/seed.sql
```

You can also use a `DATABASE_URL` based command if `psql` is available in your environment:

```bash
psql "$DATABASE_URL" -f backend/db/schema.sql
psql "$DATABASE_URL" -f backend/db/seed.sql
```

---

## How to run the application

### Run the backend

```bash
cd backend
python -m venv .venv
```

#### Windows PowerShell

```bash
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The backend runs on:

```text
http://127.0.0.1:5000
```

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend usually runs on:

```text
http://127.0.0.1:5173
```

If your backend is not running on the default URL, set this before running the frontend:

```env
VITE_API_BASE=http://127.0.0.1:5000
```

---

## How to use the application

### 1. Open the dashboard
The dashboard gives a high-level summary of:
- total customers;
- total campaigns;
- total behaviors;
- total generated messages;
- active notifications;
- recent behaviors and recent messages.

### 2. Add your data from the Admin page
Use the Admin page to add:
- customers;
- campaigns;
- customer behaviors.

This is the easiest way to simulate realistic CRM activity for the demo.

### 3. Trigger a notification
A customer appears in the Notifications page when they have:
- at least 3 similar behaviors;
- the same `source` and `behavior_type`;
- a score greater than or equal to the high-interest threshold.

In this project, the threshold is handled in the backend utilities and the minimum count is currently 3.

### 4. Analyze campaign fit
On the Notifications page, click **Analyze campaign fit**.

This sends the alert context to the backend, which uses OpenAI to choose the best campaign from the campaigns table.

### 5. Generate an AI message
From the same alert card, click **Generate AI Message**.

At that moment, the backend:
- loads the customer record;
- loads the most relevant recent behaviors;
- loads available campaigns;
- calls OpenAI;
- selects the best campaign;
- generates a natural outreach draft;
- stores the draft in `generated_messages`.

The app then redirects you to the edit page for that message.

### 6. Review and edit the message
On the edit page, you can:
- change the subject;
- rewrite the message body;
- update the internal AI reason;
- save the draft.

### 7. Send the message
If the linked campaign channel is `Email` and SMTP is configured, click **Send email**.

The backend will:
- send the message through SMTP;
- update the message status to `sent`;
- set `sent_at` in the database.

---

## When messages are generated

Messages are **not** generated automatically when a behavior is inserted.

They are generated only when the user explicitly clicks **Generate AI Message** from the Notifications page.

This is intentional. The workflow is designed as a human-in-the-loop process:
- the system detects an opportunity;
- the user decides whether to generate a message;
- the user can still review and edit the message before sending.

That makes the AI feature feel like a useful assistant rather than an uncontrolled automation.

---

## API overview

Main endpoints used by the frontend:

- `GET /health`
- `GET /api/dashboard`
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/<customer_id>`
- `GET /api/campaigns`
- `POST /api/campaigns`
- `GET /api/behaviors`
- `POST /api/behaviors`
- `GET /api/notifications`
- `POST /api/customers/<customer_id>/suggest-campaign`
- `POST /api/customers/<customer_id>/generate-message`
- `GET /api/messages`
- `GET /api/messages/<message_id>`
- `POST /api/messages`
- `PUT /api/messages/<message_id>`
- `POST /api/messages/<message_id>/send`

---

## Validation and error handling

### Backend
The backend includes:
- JSON payload validation;
- field validation for customers, campaigns, behaviors, and messages;
- proper status codes such as `201`, `400`, `404`, `409`, `422`, and `503`;
- helpful errors for missing database tables, missing environment variables, OpenAI issues, and SMTP issues.

### Frontend
The frontend includes:
- form validation feedback;
- loading states such as `Saving...`, `Sending...`, `Generating...`, and `Analyzing...`;
- toast notifications for success and failure;
- visible error and empty states on key pages.

---

## AI behavior

The OpenAI integration is used in two places:

### 1. Campaign suggestion
The backend analyzes a customer's repeated signals and chooses the most relevant campaign from the campaigns stored in PostgreSQL.

### 2. Message generation
The backend asks OpenAI to produce a short, natural, business-friendly outreach email.

The prompt explicitly tells the model to avoid technical phrases such as:
- `page_view`
- `behavior_type`
- `score`
- `high-intent signals`

If the model response cannot be safely used, the backend falls back to a deterministic message template so the app still works.

---

## Notes

- only the `Email` channel is functional for sending in this version;
- `LinkedIn` and `SMS` exist in the campaign schema but are not implemented as active sending channels;
- notifications are computed live from behavior data;
- the current project keeps the frontend polished while focusing the backend on assessment-friendly API and AI logic.

---

## Future improvements

Given more time, useful next steps would be:

- add notification lifecycle states such as open, resolved, and dismissed;
- support LinkedIn and SMS sending;
- add authentication and role-based access;
- track delivery history and campaign performance;
- improve behavior similarity detection beyond simple source + type grouping;
- deploy the frontend and backend for a live demo.

---

## License

This project was created for assessment and portfolio purposes.
