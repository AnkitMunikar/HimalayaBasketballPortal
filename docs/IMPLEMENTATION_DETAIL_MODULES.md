# HimalayaB — Implementation Detail (Modules)

This document describes the implementation structure of HimalayaB by **modules**: what each module does, where it lives, and its main components. It is suitable for project documentation or a thesis implementation chapter.

---

## 1. Overview

| Layer | Technology | Role |
|-------|------------|------|
| **Backend** | Django 5.x, Django REST Framework, Simple JWT, MySQL | REST API, authentication, business logic, database |
| **Frontend** | Next.js (App Router), React, Tailwind CSS | User interface, dashboards, forms |
| **Database** | MySQL | Persistent storage (users, events, enrollments, payments) |
| **Payment** | Khalti (sandbox/production) | Online payment for paid events |

The backend is organized into **Django apps** (modules); the frontend is organized into **app routes** (by role and feature) and **shared components**.

---

## 2. Backend Modules

### 2.1 himalaya_backend (Configuration)

| Item | Description |
|------|-------------|
| **Purpose** | Project root: settings, main URL routing, WSGI/ASGI entry. |
| **Location** | `backend/himalaya_backend/` |
| **Key files** | `settings.py` — Django settings (DB, REST framework, JWT, CORS, email, Khalti, media). `urls.py` — Root URL config: mounts `api/events/`, `api/enroll/`, `api/` (accounts), admin, media in debug. `wsgi.py`, `asgi.py` — Server entry points. |
| **Dependencies** | All other backend apps; environment variables (e.g. `.env`) for secrets and config. |

---

### 2.2 accounts

| Item | Description |
|------|-------------|
| **Purpose** | User management, authentication, authorization, and role-based access. |
| **Location** | `backend/accounts/` |
| **Models** | `CustomUser` — extends Django AbstractUser; fields: username, email, password, role (admin, event_organizer, coach, player), name, phone, email verification and password-reset token fields. `Team` — optional team entity linked to coach. |
| **Views / endpoints** | Register, login (JWT + user in response), logout (refresh blacklist), token refresh; verify-email, resend-verification; forgot-password, verify-reset-token, reset-password; get user; organizer/coach/player list endpoints; admin: events list/create/update, approve/reject event, users list/detail/update. |
| **Key files** | `models.py` — CustomUser, Team; token validity helpers. `views.py` — All auth and admin event/user views. `serializers.py` — Register, user, password reset serializers. `permissions.py` — IsAdmin, IsEventOrganizer, IsCoach, IsPlayer. `urls.py` — URL patterns for all account and admin routes. `utils.py` — Email sending (verification, password reset, event rejection). |
| **Dependencies** | events (for event approval), enroll (conceptually for enrollment data); JWT (Simple JWT). |

---

### 2.3 events

| Item | Description |
|------|-------------|
| **Purpose** | Event lifecycle: create, list, detail, update, delete; approval workflow; standings. |
| **Location** | `backend/events/` |
| **Models** | `Event` — name, description, date, end_date, venue, city, organizer (FK to User), approval_status (pending/approved/rejected), approved_by, max_teams, payment type, logo, venue_receipt; methods: `can_enroll()`, `is_full`, `available_slots`, `clean()`. `EventTeamStanding` — per-event, per-team-enrollment: wins, losses, points_for, points_against; property `points_diff`. |
| **Views / endpoints** | Public: list (approved), list upcoming, event detail. Authenticated: create event (organizer); update/delete (organizer or admin). Admin (in accounts URLs): list all, create, update, approve, reject. Standings: public read; organizer/admin create/update. |
| **Key files** | `models.py` — Event, EventTeamStanding; file validators. `views.py` — EventCreateView, EventListView, EventDetailView, EventStandingsView, organizer views; admin event views live in accounts. `serializers.py` — EventSerializer, StandingSerializer. `urls.py` — Event and standings routes under `api/events/`. |
| **Dependencies** | accounts (User, permissions); enroll (TeamEnroll for standings). |

---

### 2.4 enroll

| Item | Description |
|------|-------------|
| **Purpose** | Team enrollment (teams and players), free vs paid flow, Khalti payment integration, age validation. |
| **Location** | `backend/enroll/` |
| **Models** | `TeamEnroll` — team_name, gender, coach_name, contact_number, email, coach (FK), event (FK), team (FK); unique (team_name, event). `Player` — teamenroll (FK), player_name, position, jersey_no, dob, player_photo, id_proof; age derived. `Payment` — enrollment (one-to-one), amount, pidx, khalti_txn_id, reference_id, status. |
| **Views / endpoints** | EnrollViews (ViewSet): list/create/update/delete team enrollments; free-event validation (can_enroll), paid-event 402 and Khalti flow. Khalti: initiate, verify, payment status. Admin: payments list/detail/update. Event teams list/create/delete. Player file upload. |
| **Key files** | `models.py` — TeamEnroll, Player, Payment; file validators. `views.py` — EnrollViews, Khalti initiate/verify, admin payment views, event teams, normalization of multipart enrollment data. `serializers.py` — EnrollSerializer (nested players), payment serializers. `age_validation.py` — parse_max_age_from_level, get_age_as_of, validate_players_age_for_event. `urls.py` — Router for teams/players, Khalti and admin payment routes. |
| **Dependencies** | accounts (User, permissions); events (Event, EventTeamStanding); settings (Khalti config). |

---

### 2.5 blog

| Item | Description |
|------|-------------|
| **Purpose** | Simple blog/news listing (if used). |
| **Location** | `backend/blog/` |
| **Key files** | `views.py` — Blog or news list/detail views. |
| **Note** | May be minimal (e.g. placeholder or simple list); main content may live in events or static pages. |

---

## 3. Frontend Modules

### 3.1 App structure (by route / role)

| Module (route) | Purpose | Key files |
|----------------|---------|-----------|
| **Auth** | Login, signup, verify email, forgot/reset password. | `app/Login/page.js`, `app/Signup/page.js`, `app/verify-email/[token]/page.js`, `app/forgot-password/page.js`, `app/reset-password/page.js`. |
| **Admin** | Admin dashboard: events, enrollments, users, payments, players. | `app/Admin/layout.js`, `app/Admin/page.js`, `app/Admin/Dashboard/AdminDashboard.js`, EventsTab, EnrollmentsTab, UsersTab, PaymentsTab, PlayersTab; `app/Admin/events/[id]/page.js`, `app/Admin/enrollments/[id]/page.js`. |
| **Organizer** | Organizer dashboard: create/edit events, view own events, standings. | `app/Organizer/page.js`, `app/Organizer/Dashboard/Dashboards.js`, EventForm.js; `app/Organizer/events/[eventId]/page.js`; `app/Organizer/Register/page.js` (organizer signup if used). |
| **Coach** | Coach dashboard: view events, enroll team, view enrollments. | `app/Coach/page.js`, `app/Coach/Dashboard/CoachDashboard.js`, Teamenrollment.js, Eventregister.js; `app/Coach/enroll/[eventId]/page.js` (enrollment form). |
| **Player** | Player dashboard: view events and own info. | `app/Player/page.js`, `app/Player/Dashboard/page.js`. |
| **Shared / public** | Public event list, event detail, blog, about, payment callback. | `app/events/page.js`, `app/DisplayEvents/[eventId]/page.js`, `app/blog/page.js`, `app/Aboutus/page.js`, `app/payment/page.js`. |
| **Lib** | Shared API client or helpers. | `app/lib/api.js` (e.g. base URL, auth header). |

---

### 3.2 Shared components

| Component | Purpose |
|-----------|---------|
| **AuthContext.js** | Global auth state: login, signup, logout; stores access/refresh token and user in localStorage; role-based redirect. |
| **Header.js** | Navigation bar; links by role; logout. |
| **Footer.js** | Site footer. |
| **LoginForm.js** | Login form (calls AuthContext login). |
| **RegisterForm.js** | Signup form. |
| **EventCard.js** | Event summary card (list view). |
| **EventDetail.js** | Event detail view: info, standings, enroll/pay actions (by role). |
| **EventForm.js** | Create/edit event form (organizer/admin). |
| **OrganizerEventDetail.js** | Organizer view of own event (edit, standings). |
| **KhaltiPaymentModal.js** | Khalti payment flow (initiate, redirect, verify). |
| **ProtectedRoute.js** | Wraps routes that require login. |
| **EnrollmentSuccessModal.js** | Success message after enrollment. |
| **VerifyEmail.js** | Email verification UI. |
| **DisplayForm.js** | Reusable display/form helper if used. |
| **Sliders.js** | Homepage or listing carousel/slider. |

---

### 3.3 Utils and config

| Item | Purpose |
|------|---------|
| **utils/api.js** | Axios instance with base URL and Bearer token interceptor for API calls. |
| **utils/authUtils.js** | Token refresh or auth helpers. |
| **utils/khaltiConfig.js**, **config/khalti.js** | Khalti public key and API base for frontend payment. |
| **services/paymentService.js** | Payment-related API calls (e.g. initiate, verify). |

---

## 4. Module interaction (summary)

- **accounts** provides users and roles; **events** and **enroll** use the same user model and account permissions.
- **events** exposes events and standings; **enroll** references Event and creates TeamEnroll and Player per event.
- **enroll** uses **events** for event validation and **accounts** for coach/organizer/admin checks; Khalti is called from enroll views using **himalaya_backend** settings.
- **Frontend** calls backend via `api/` (accounts, events, enroll); auth is JWT from accounts; role determines which app routes (Admin, Organizer, Coach, Player) and components (e.g. EventForm, KhaltiPaymentModal) are used.

---

## 5. Table summary (for quick reference)

| Module | Type | Purpose in one line |
|--------|------|---------------------|
| himalaya_backend | Backend | Project config, URLs, settings. |
| accounts | Backend | Users, auth, JWT, email verification, password reset, admin events/users. |
| events | Backend | Events CRUD, approval, standings. |
| enroll | Backend | Team/player enrollment, Khalti payment, age validation. |
| blog | Backend | Blog/news (minimal). |
| app (Auth, Admin, Organizer, Coach, Player, shared) | Frontend | Role-based pages and flows. |
| components | Frontend | Reusable UI and auth/event/payment components. |
| utils / config | Frontend | API client, auth helpers, Khalti config. |

Use this document as the **implementation detail (modules)** section in your project documentation or thesis.
