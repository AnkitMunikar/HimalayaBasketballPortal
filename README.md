# HimalayaB (Basketball Portal)

HimalayaB is a web application for organizing and participating in basketball events and tournaments. It provides role-based dashboards for **organizers**, **coaches**, **players**, and **admins**.

- **Frontend**: Next.js + React
- **Backend**: Django + Django REST Framework (JWT authentication)
- **Database**: MySQL
- **Payments**: Khalti (for paid event enrollments)

---

## Features

- User authentication (JWT) with email verification and password reset
- Role-based access control (organizer/coach/player/admin)
- Event creation and management by organizers
- Team enrollment and player submission by coaches
- Admin approvals and management
- Payments for paid events via Khalti
- File uploads (event logos, receipts, player photos, id proof)

---

## Repository Structure

- `backend/` — Django backend (API + business logic)
- `frontend/` — Next.js frontend (UI)
- `docs/` — project documentation and supporting notes
- `postmancollections/` — Postman collection(s) for API testing

---

## Prerequisites

### Backend
- Python 3.x
- MySQL
- An email provider (SMTP) for verification/reset emails
- Khalti credentials (if testing payments)

### Frontend
- Node.js + npm

---

## Setup (Development)

### 1) Backend

1. Navigate to `backend/`
2. Create and activate a virtual environment
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Configure environment variables (create a `.env` file; required secrets should be set there). Consult:
- `backend/SECURITY_RECOMMENDATIONS.md`
- `backend/himalaya_backend/settings.py`

5. Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

6. Start the server:

```bash
python manage.py runserver
```

Backend typically runs on `http://127.0.0.1:8000`.

### 2) Frontend

1. Navigate to `frontend/`
2. Install dependencies:

```bash
npm install
```

3. Run the dev server:

```bash
npm run dev
```

Frontend typically runs on `http://localhost:3000`.

---


## Security Notes

A dedicated document exists for production hardening:
- `backend/SECURITY_RECOMMENDATIONS.md`

It includes guidance such as moving secrets to environment variables, tightening JWT lifetime, fixing CORS, adding security headers, rate limiting, and preventing username enumeration.

---

## Documentation

Helpful docs in this repo:

- `docs/PROJECT_BACKGROUND.md`
- `docs/FRONTEND_BACKEND_DATABASE.md`
- `docs/TOOLS_AND_TECHNOLOGIES.md`
- `docs/NON_FUNCTIONAL_REQUIREMENTS.md`
- `docs/HIGHLIGHT_IMPLEMENTATIONS.md`
- `docs/IMPLEMENTATION_DETAIL_MODULES.md`
- `docs/FUTURE_RECOMMENDATIONS.md`

---

## Author
Ankit Munikar
