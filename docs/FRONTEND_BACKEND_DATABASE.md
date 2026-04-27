# HimalayaB — Frontend, Backend, and Database

Short explanations of the three main parts of the system, for use in project documentation.

---

## Frontend

**What it is:** The part of the application that runs in the user’s browser. It is what organizers, coaches, players, and admins see and interact with: login and signup screens, dashboards, event lists, enrollment forms, payment screens, and so on.

**What it does:** The frontend collects input from the user (e.g. login credentials, event details, team and player data), sends it to the backend over the internet, and shows the results (e.g. list of events, success or error messages). It also decides which screens to show based on the user’s role (admin, organizer, coach, player) and keeps the user logged in using tokens received from the backend.

**In this project:** The frontend is built with **Next.js** and **React**, styled with **Tailwind CSS**. It runs as a separate application (e.g. on a port like 3000) and talks to the backend through **REST API** calls. It does not store events, users, or enrollments by itself; it only displays and sends data to the backend.

---

## Backend

**What it is:** The part of the application that runs on a server. Users do not see it directly; they only see the frontend. The backend receives requests from the frontend (e.g. “log in this user,” “create this event,” “save this enrollment”), does the work, and sends back responses (e.g. success, data, or an error).

**What it does:** The backend contains the **business logic**: it checks who is logged in, whether they are allowed to do an action (e.g. only admins approve events), and whether the data is valid (e.g. event not full, players within age limit). It creates, reads, updates, and deletes data in the database. It also talks to external services (e.g. Khalti for payments, email server for verification and password reset). It does not draw the screens; it only processes requests and returns data (often in JSON format).

**In this project:** The backend is built with **Django** and **Django REST Framework**. It exposes a **REST API** (URLs like `/api/login/`, `/api/events/`, `/api/enroll/teams/`). It uses **JWT** to know who is making each request and applies **permissions** (e.g. only coaches can enroll teams, only admins can approve events). It runs as a separate application (e.g. on a port like 8000).

---

## Database

**What it is:** A place where the application’s data is stored in a structured way so it can be saved, searched, and updated reliably. It runs on a server and is used by the backend; the frontend never talks to the database directly.

**What it does:** The database stores **users** (e.g. username, email, role, verification status), **events** (e.g. name, date, venue, approval status), **team enrollments** and **players**, **payments**, and similar information. When the backend needs to check or save something (e.g. “is this event full?”, “save this new enrollment”), it sends a query to the database. The database keeps data even when the server is restarted, so nothing is lost.

**In this project:** The database is **MySQL**. The backend uses Django’s **ORM** (Object-Relational Mapping) to define tables (e.g. User, Event, TeamEnroll, Player, Payment) and to read/write data without writing raw SQL by hand. All persistent data for HimalayaB lives in this database.

---

## How they work together

1. **User** uses the **frontend** (browser): clicks, fills forms, sees lists and messages.
2. **Frontend** sends **HTTP requests** to the **backend** (e.g. “POST /api/login/” with username and password).
3. **Backend** checks the request (e.g. validates login), reads or writes the **database** if needed, and sends a **response** back (e.g. tokens and user data, or an error).
4. **Frontend** receives the response and **updates the screen** (e.g. shows the dashboard or an error message).

So: the **frontend** is the interface; the **backend** is the logic and gatekeeper; the **database** is the permanent storage. The frontend and backend are separate programs that communicate over the network; the database is used only by the backend.

---

## One-paragraph version (for a short report)

The system has three main parts. The **frontend** is the web interface (Next.js/React) that users see and use in the browser; it sends user actions to the server and displays the results. The **backend** is the server-side application (Django REST API) that handles authentication, business rules, and validation, and reads or writes data as needed. The **database** (MySQL) stores all persistent data (users, events, enrollments, payments). The frontend talks only to the backend; the backend talks to the database and to external services (e.g. Khalti, email). Together they form a three-tier setup: presentation (frontend), logic (backend), and storage (database).
