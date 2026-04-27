# HimalayaB — Tools and Technologies Used

This document lists and briefly explains the main tools and technologies used to build the HimalayaB Basketball Portal. It is suitable for a project report or thesis section.

---

## 1. Backend

| Technology | Version / note | Purpose |
|------------|----------------|---------|
| **Python** | 3.x | Programming language for the server-side application. |
| **Django** | 5.2 | Web framework: URL routing, request handling, ORM, admin site, security (e.g. CSRF, sessions). |
| **Django REST Framework (DRF)** | 3.16 | Builds REST APIs: serializers, view sets, permissions, throttling, and browsable API. |
| **Django REST Framework Simple JWT** | 5.3 | JWT authentication: access and refresh tokens, token blacklist for logout. |
| **MySQL** | — | Relational database for users, events, enrollments, players, payments. |
| **mysqlclient** | 2.2 | Python driver to connect Django to MySQL. |
| **django-cors-headers** | 4.7 | Adds CORS headers so the frontend (different origin) can call the API. |
| **python-dotenv / django-environ** | — | Load environment variables from `.env` for configuration and secrets. |

**Summary:** The backend is a **Django** application that exposes a **REST API** using **Django REST Framework**, secures it with **JWT (Simple JWT)**, and stores data in **MySQL**. CORS is enabled for the frontend.

---

## 2. Frontend

| Technology | Version / note | Purpose |
|------------|----------------|---------|
| **Next.js** | 15.x | React framework: file-based routing (App Router), server and client components, API routes if used. |
| **React** | 19.x | UI library: components, state, and rendering the user interface. |
| **Tailwind CSS** | 4.x | Utility-first CSS for layout, styling, and responsiveness. |
| **Axios** | 1.x | HTTP client to call the backend API; used with interceptors to attach the JWT. |
| **Khalti Checkout (Web)** | 2.x | Khalti’s frontend SDK for payment UI and redirect flow. |
| **Lucide React / Heroicons** | — | Icon libraries for buttons, menus, and dashboards. |
| **React Slick / Swiper** | — | Carousels and sliders (e.g. homepage or event lists). |

**Summary:** The frontend is a **Next.js** application using **React** and **Tailwind CSS**. It talks to the backend via **Axios** (with JWT in headers) and uses **Khalti Checkout** for the payment step.

---

## 3. Database

| Technology | Purpose |
|------------|---------|
| **MySQL** | Primary database: stores users, events, team enrollments, players, payments, and related data. Django ORM is used for queries and migrations. |

---

## 4. Authentication and Security

| Technology | Purpose |
|------------|---------|
| **Simple JWT** | Issues access and refresh tokens; backend validates the access token on protected endpoints. |
| **Django password hashing** | User passwords are hashed (e.g. PBKDF2) and never stored in plain text. |
| **Email verification / password reset** | Custom tokens (e.g. UUID) sent by email; used for account verification and password reset links. |

---

## 5. Payment

| Technology | Purpose |
|------------|---------|
| **Khalti** | Payment gateway used for paid events. Backend calls Khalti APIs (initiate, verify); frontend uses Khalti Checkout for the payment page and redirect. Sandbox is used for testing; production uses live keys and production Khalti URL. |

---

## 6. Email

| Technology | Purpose |
|------------|---------|
| **SMTP (e.g. Gmail)** | Sending verification emails, password-reset links, and event rejection notices. Configured in Django (EMAIL_HOST, etc.). |

---

## 7. Development and Deployment (optional to mention)

| Tool | Purpose |
|------|---------|
| **Git** | Version control for backend and frontend code. |
| **Node.js / npm** | Run and build the Next.js frontend. |
| **VS Code / Cursor** | Code editor. |
| **Draw.io / diagrams.net** | UML and diagrams (e.g. use case, sequence, component). |

---

## 8. Summary Table (for report/thesis)

| Category | Tools and technologies |
|----------|-------------------------|
| **Backend** | Python, Django 5, Django REST Framework, Simple JWT, MySQL, mysqlclient, django-cors-headers, python-dotenv/django-environ |
| **Frontend** | Next.js 15, React 19, Tailwind CSS 4, Axios, Khalti Checkout (Web), Lucide React / Heroicons, React Slick / Swiper |
| **Database** | MySQL |
| **Authentication** | JWT (Simple JWT), Django password hashing, email verification and password-reset tokens |
| **Payment** | Khalti (API + Checkout Web SDK) |
| **Email** | SMTP (e.g. Gmail) |
| **Development** | Git, Node.js/npm, code editor, Draw.io |

---

Use this document as the **“Tools and Technologies Used”** section in your project documentation or thesis. You can shorten it to the summary table plus one short paragraph per category if space is limited.
