# HimalayaB — Important Implementations (Highlights)

These are **key implementations** that highlight the project. Each is explained in short form for documentation or discussion (e.g. with an examiner).

---

## 1. Login only after email verification (JWT + custom check)

**What it is:** Users must verify their email before they can log in. The login endpoint does not issue tokens until the account is verified.

**Why it stands out:** It combines **JWT authentication** with a **custom security rule**. The backend extends Simple JWT’s login view: it looks up the user, checks `is_email_verified`, and if not verified returns 403 with a clear message and does not issue access/refresh tokens. On success, the response includes both tokens and full user data (including role) in one call, so the frontend can redirect by role immediately. This shows awareness of **security (verified users only)** and **API design (single login response with user + tokens)**.

---

## 2. Event enrollment rules: free vs paid and “can enroll”

**What it is:** The system enforces clear business rules before creating a team enrollment: event must be approved, not full, and within the registration window (e.g. registration closes 3 days before the event). For **paid** events, direct enrollment is blocked and the client is told to use the payment flow (402 + payment_required). For **free** events, enrollment is created directly after these checks.

**Why it stands out:** The logic is **centralized in the backend** (e.g. `Event.can_enroll()` and a check on `event.payment`). The same enrollment API handles both free and paid cases: it either creates the enrollment (free) or returns a structured “use payment” response (paid). This shows **domain logic** (sports event rules) and **clear separation** between free and paid flows without duplicating validation.

---

## 3. Role-based access (backend permissions + frontend redirect)

**What it is:** Backend uses **custom permission classes** (IsAdmin, IsEventOrganizer, IsCoach, IsPlayer) so each endpoint is restricted by role. The frontend stores the user’s role with the JWT, and after login **redirects** to the right dashboard (e.g. /Admin, /Organizer, /Coach, /Player) so each user type sees only the relevant UI.

**Why it stands out:** It shows **end-to-end authorization**: the same role is enforced on the API (who can create events, approve events, enroll teams, etc.) and used on the client for navigation and visibility. There is no “one role for everyone”; each role has a defined set of actions and screens. This is a core part of the project’s design and is easy to explain as a highlight.

---

## 4. Age validation from event “level” (Under 14, Under 20, Open)

**What it is:** Events have a **level** field (e.g. “Under 14”, “Under 20”, “Open”). The system parses this to get a maximum allowed age, computes each player’s age as of the event date from their date of birth, and **validates** that all players in an enrollment are within the limit. If any player is over age, enrollment is rejected with a message listing who exceeded the limit.

**Why it stands out:** It implements **real sports rules** (age groups) in code: parsing text like “Under 14” or “U14”, computing age from DOB, and validating per event. The logic is in a dedicated module (`age_validation.py`) with clear functions (e.g. `parse_max_age_from_level`, `validate_players_age_for_event`). This shows **domain logic** and **reusable validation**, not just CRUD.

---

## 5. Khalti payment: initiate → pay → verify → create enrollment

**What it is:** For **paid** events, enrollment is not created on the first request. The backend **initiates** payment with Khalti (sends amount, return URL, etc.), stores the pending enrollment data (e.g. in session or similar), and returns the payment URL to the frontend. The user pays on Khalti’s page. After payment, the frontend calls a **verify** endpoint with the transaction id (e.g. pidx). The backend verifies with Khalti, then **creates** the TeamEnroll, Players, and Payment records in one go. So “enrollment” for paid events is created only after successful payment.

**Why it stands out:** It is a **real integration** with an external payment gateway and a **two-step flow** (initiate vs verify). It shows handling of **async** user flow (redirect and callback), **idempotency/security** (no enrollment before payment success), and **data consistency** (enrollment + payment created together). This is one of the strongest technical highlights of the project.

---

## 6. Event approval workflow (organizer creates, admin approves/rejects)

**What it is:** Organizers **create** events that are stored as **pending**. Only **admins** can **approve** or **reject** them. Approved events appear on the public list and can accept enrollments; rejected events do not, and the organizer can be notified (e.g. by email) with an optional reason.

**Why it stands out:** It implements a **workflow** and **separation of duties**: the person who creates the event is not the one who publishes it. The backend stores approval status and approver (e.g. `approved_by`), and the frontend shows different lists (e.g. admin sees all statuses, public sees only approved). This is a clear **business rule** and a good example of **role-based workflow** in the project.

---

## Summary (for your documentation)

You can present these as **“Important implementations”** or **“Implementation highlights”**:

1. **Login only after email verification** — Security and single-response login (user + JWT + role).
2. **Event enrollment rules (free vs paid, can_enroll)** — Centralized domain logic for events and enrollments.
3. **Role-based access** — Backend permissions plus frontend role-based redirect and UI.
4. **Age validation from event level** — Parsing “Under 14”/“Open” and validating player ages.
5. **Khalti payment flow** — Initiate → verify → create enrollment and payment (external API integration).
6. **Event approval workflow** — Organizer creates (pending), admin approves/rejects; public sees only approved.

These six points give you **more than four** strong, explainable highlights that show security, business logic, authorization, domain rules, external integration, and workflow design.
