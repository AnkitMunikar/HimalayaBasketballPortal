# HimalayaB — Integration Test Cases (Including Failed / Negative)

This document lists **integration test** cases for the API layer: requests that exercise **backend + database + external services** (e.g. Khalti, email) together. It focuses on **failed** (negative) scenarios: cases where the API should return an error status (4xx/5xx) or validation errors, not success.

Integration tests call real endpoints (e.g. with Django REST framework’s `APIClient` or `requests`) and assert on HTTP status codes and response bodies.

---

## 1. Authentication API — Failed Integration Test Cases

| ID | Scenario | Steps (API) | Expected Result (Failure) | Priority |
|----|----------|-------------|---------------------------|----------|
| INT-AUTH-01 | Login with wrong password | `POST /api/token/` with valid email and **wrong password** | 401 Unauthorized; no access/refresh token in response | High |
| INT-AUTH-02 | Login with non-existent email | `POST /api/token/` with **unregistered email** | 401 Unauthorized; error message | High |
| INT-AUTH-03 | Login with invalid payload (missing email/password) | `POST /api/token/` with **empty or missing email/password** | 400 Bad Request; validation errors in response | Medium |
| INT-AUTH-04 | Register with duplicate email | `POST /api/register/` with **email already in DB** | 400 Bad Request; serializer error (e.g. "This email is already registered") | High |
| INT-AUTH-05 | Register with duplicate username | `POST /api/register/` with **username already in DB** | 400 Bad Request; serializer error (e.g. "This username is already taken") | High |
| INT-AUTH-06 | Register with invalid role | `POST /api/register/` with **role** not in [admin, event_organizer, coach, player] | 400 Bad Request; validation error on role | Medium |
| INT-AUTH-07 | Register with non-matching email or password confirmation | `POST /api/register/` with **confirm_email** or **confirm_password** not matching | 400 Bad Request; validation error on confirm_email/confirm_password | Medium |
| INT-AUTH-08 | Verify email with invalid/missing token | `GET/POST /api/verify-email/?token=invalid` or no token | 400 Bad Request; error (e.g. "Verification token is required" or "Invalid token") | High |
| INT-AUTH-09 | Verify email with expired token | `GET /api/verify-email/?token=<expired_token>` | 400 Bad Request; appropriate error message | Medium |
| INT-AUTH-10 | Refresh with invalid/expired refresh token | `POST /api/token/refresh/` with **invalid or blacklisted** refresh token | 401 Unauthorized or 400 Bad Request; no new access token | High |
| INT-AUTH-11 | Protected endpoint without Authorization header | `GET /api/user/` (or any protected URL) **without** `Authorization: Bearer <token>` | 401 Unauthorized; no user data returned | High |
| INT-AUTH-12 | Protected endpoint with malformed/invalid JWT | `GET /api/user/` with `Authorization: Bearer invalid.jwt.here` | 401 Unauthorized | High |
| INT-AUTH-13 | Forgot password with non-existent email | `POST /api/forgot-password/` with **unregistered email** | 400 or 404; no email sent; safe error message | Medium |
| INT-AUTH-14 | Reset password with invalid/expired token | `POST /api/reset-password/` with **invalid or expired** reset token | 400 Bad Request; validation error (e.g. "Invalid password reset link") | High |

---

## 2. Authorization (Role-Based) API — Failed Integration Test Cases

| ID | Scenario | Steps (API) | Expected Result (Failure) | Priority |
|----|----------|-------------|---------------------------|----------|
| INT-ROLE-01 | Create event as player | As **player** (JWT): `POST /api/events/` with valid event payload | 403 Forbidden; event not created (permission or serializer "Only event organizers can create events") | High |
| INT-ROLE-02 | Create event as coach | As **coach** (JWT): `POST /api/events/` with valid event payload | 403 Forbidden or 400 (serializer role check); event not created | High |
| INT-ROLE-03 | Admin list/approve events as non-admin | As **event_organizer** or **coach**: `GET /api/admin/events/` or `POST /api/admin/events/<id>/approve/` | 403 Forbidden; no admin data/action | High |
| INT-ROLE-04 | Update event as non-owner (player) | As **player** (JWT): `PUT /api/events/<id>/` for event owned by another user | 403 Forbidden or 404 (queryset returns none); event not updated | High |
| INT-ROLE-05 | Delete event as non-owner | As **coach** (JWT): `DELETE /api/events/<id>/` for event owned by organizer | 403 Forbidden or 404; event not deleted | High |
| INT-ROLE-06 | Create enrollment as player | As **player** (JWT): `POST /api/enroll/` (or enroll endpoint) with valid enrollment payload | 403 Forbidden; enrollment not created | High |
| INT-ROLE-07 | Admin users list as non-admin | As **coach** or **player**: `GET /api/admin/users/` | 403 Forbidden | High |
| INT-ROLE-08 | Update another user's enrollment as coach | As **coach** A: `PUT /api/enroll/<id>/` for enrollment owned by **coach** B | 403 Forbidden or 404; enrollment not updated | Medium |

---

## 3. Events API — Failed Integration Test Cases

| ID | Scenario | Steps (API) | Expected Result (Failure) | Priority |
|----|----------|-------------|---------------------------|----------|
| INT-EVT-01 | Create event with missing required fields | As organizer: `POST /api/events/` with **name** or other required field missing | 400 Bad Request; serializer errors listing invalid/missing fields | High |
| INT-EVT-02 | Create event with invalid payment type | As organizer: `POST /api/events/` with **payment_type** not "Free" or numeric | 400 Bad Request; validation error (e.g. "Payment must be 'Free' or a valid number") | Medium |
| INT-EVT-03 | Create event with negative max_teams | As organizer: `POST /api/events/` with **max_teams** < 0 | 400 Bad Request; validation error (e.g. "Max teams cannot be negative") | Medium |
| INT-EVT-04 | Create event with max_teams > 100 | As organizer: `POST /api/events/` with **max_teams** > 100 | 400 Bad Request; validation error (e.g. "Max teams cannot exceed 100") | Low |
| INT-EVT-05 | Create event with organizer_id not matching authenticated user | As organizer: `POST /api/events/` with **organizer** set to another user's ID | 400 Bad Request; validation error (e.g. "Organizer ID must match the authenticated user") | High |
| INT-EVT-06 | Update non-existent event | As organizer: `PUT /api/events/99999/` (ID not in DB) | 404 Not Found | Medium |
| INT-EVT-07 | Get event detail for non-approved event (public list) | `GET /api/events/` — event with **approval_status = pending** | Event not in list (filter is approved only) | Medium |
| INT-EVT-08 | Submit standings with invalid team_enrollment_id | As organizer/admin: `POST /api/events/<id>/standings/` with **team_enrollment_id** not enrolled in event | 400 Bad Request; error (e.g. "team_enrollment_id X is not enrolled") | High |
| INT-EVT-09 | Submit standings with non-list body | `POST /api/events/<id>/standings/` with body **not a list** | 400 Bad Request; error (e.g. "standings must be a list") | Medium |

---

## 4. Enrollment API — Failed Integration Test Cases

| ID | Scenario | Steps (API) | Expected Result (Failure) | Priority |
|----|----------|-------------|---------------------------|----------|
| INT-ENR-01 | Enroll without event in payload | As coach: `POST /api/enroll/` with **event** missing or null | 400 Bad Request; error (e.g. "event is required") or "Event not found" | High |
| INT-ENR-02 | Enroll for non-existent event | As coach: `POST /api/enroll/` with **event** = invalid ID | 404 Not Found or 400; error (e.g. "Event not found") | High |
| INT-ENR-03 | Enroll when event is full | As coach: `POST /api/enroll/` for event where **enrollment count >= max_teams** | 400 Bad Request; error (e.g. "Event is full"); enrollment not created | High |
| INT-ENR-04 | Enroll when event not open for enrollment | As coach: `POST /api/enroll/` for event with **approval_status != approved** or **end_date** in past / **can_enroll()** false | 400 Bad Request or 402; error message; enrollment not created | High |
| INT-ENR-05 | Enroll with duplicate team name in same event | As coach: `POST /api/enroll/` with **team_name** already used for same **event** | 400 Bad Request; serializer/DB unique constraint error (e.g. "Team with this name already enrolled") | High |
| INT-ENR-06 | Enroll with player over max age for event | As coach: `POST /api/enroll/` with player **dob** such that age > event's max age (e.g. U18) | 400 Bad Request; validation error (e.g. "Player exceeds maximum age") | High |
| INT-ENR-07 | Enroll with too few players | As coach: `POST /api/enroll/` with **players** list length < 8 | 400 Bad Request; validation error (e.g. "At least 8 players are required") | High |
| INT-ENR-08 | Enroll with too many players | As coach: `POST /api/enroll/` with **players** list length > 15 | 400 Bad Request; validation error (e.g. "Maximum 15 players allowed") | Medium |
| INT-ENR-09 | Enroll with invalid player (missing DOB, name, position) | As coach: `POST /api/enroll/` with a player missing **player_name**, **dob**, or **position** | 400 Bad Request; validation errors on player fields | High |
| INT-ENR-10 | Enroll with player DOB in future | As coach: `POST /api/enroll/` with player **dob** > today | 400 Bad Request; validation error (e.g. "Date of birth cannot be in the future") | Medium |
| INT-ENR-11 | Enroll with player under 5 years old | As coach: `POST /api/enroll/` with player **dob** implying age < 5 | 400 Bad Request; validation error (e.g. "Player must be at least 5 years old") | Medium |
| INT-ENR-12 | Paid event enrollment without payment (direct POST) | As coach: `POST /api/enroll/` for **paid** event without completing Khalti flow | 402 Payment Required or 400; enrollment not confirmed | High |
| INT-ENR-13 | Update enrollment of another coach | As coach A: `PUT /api/enroll/<id>/` for enrollment belonging to **coach** B | 403 Forbidden or 404; enrollment not updated | Medium |
| INT-ENR-14 | Get enrollment for non-existent ID | `GET /api/enroll/99999/` (authenticated) | 404 Not Found | Medium |
| INT-ENR-15 | Upload player photo with invalid file type | As coach: `PATCH/PUT` player with **player_photo** = non-image (e.g. .exe) | 400 Bad Request; file validator error (e.g. "Only JPG and PNG allowed") | Low |
| INT-ENR-16 | Upload id_proof with non-PDF | As coach: upload **id_proof** with non-PDF file | 400 Bad Request; validator error (e.g. "Only PDF files are allowed") | Low |

---

## 5. Payment (Khalti) API — Failed Integration Test Cases

| ID | Scenario | Steps (API) | Expected Result (Failure) | Priority |
|----|----------|-------------|---------------------------|----------|
| INT-PAY-01 | Khalti initiate with invalid/missing event or amount | `POST /api/khalti/initiate/` (or equivalent) with **invalid event_id** or wrong amount | 400 Bad Request or 404; no successful initiation | High |
| INT-PAY-02 | Khalti verify with invalid pidx | `POST /api/khalti/verify/` with **pidx** not from Khalti or fake | 400 Bad Request or 502; verification fails; payment not confirmed | High |
| INT-PAY-03 | Khalti verify with already-used pidx | `POST /api/khalti/verify/` with **pidx** that was already successfully verified | 400 or idempotent no-op; no duplicate enrollment/payment | High |
| INT-PAY-04 | Khalti API timeout | Mock or real: Khalti server does not respond in time | 504 Gateway Timeout or 502 Bad Gateway; appropriate error in response | Medium |
| INT-PAY-05 | Khalti API returns error (e.g. 400/403) | Mock Khalti response with error status | 502 Bad Gateway or 400; error message; enrollment not confirmed | Medium |
| INT-PAY-06 | Verify payment for non-existent enrollment | `POST /api/khalti/verify/` with reference to **non-existent** enrollment | 404 Not Found or 400; error message | Medium |
| INT-PAY-07 | Admin update payment as non-admin | As coach/player: `PATCH /api/admin/payments/<id>/` | 403 Forbidden | Medium |

---

## 6. Database & Serializer Constraints — Failed Integration Test Cases

| ID | Scenario | Steps (API) | Expected Result (Failure) | Priority |
|----|----------|-------------|---------------------------|----------|
| INT-DB-01 | Unique (team_name, event) violation at DB level | Force enrollment with same **team_name** + **event** (e.g. race or direct serializer save) | 400 Bad Request; IntegrityError caught or serializer validation; no duplicate row | High |
| INT-DB-02 | Invalid foreign key (event_id) | As coach: `POST /api/enroll/` with **event** = ID that does not exist | 404 or 400; "Event not found" or FK validation error | High |
| INT-DB-03 | Invalid foreign key (organizer_id) on event | As organizer: create event with **organizer** = deleted or non-existent user ID | 400; validation or DB constraint error | Medium |
| INT-DB-04 | Retrieve event by invalid PK | `GET /api/events/99999/` (no such event or not in allowed queryset) | 404 Not Found | Medium |
| INT-DB-05 | Event model clean: end_date before date | Create event (API or model) with **end_date** < **date** | 400 Bad Request or model ValidationError; event not saved | Medium |

---

## 7. File Upload & Validation — Failed Integration Test Cases

| ID | Scenario | Steps (API) | Expected Result (Failure) | Priority |
|----|----------|-------------|---------------------------|----------|
| INT-FILE-01 | Event logo: disallowed extension | `POST /api/events/` with **logo** = file with extension not in allowed list | 400 Bad Request; validator error (e.g. "Unsupported file extension") | Low |
| INT-FILE-02 | Venue receipt: non-PDF | Upload **venue_receipt** with non-PDF file | 400 Bad Request; "Only PDF files are allowed for venue receipts" | Low |
| INT-FILE-03 | Player photo: file too large | Upload **player_photo** exceeding max size (e.g. 5MB) | 400 Bad Request; "Image file too large" (or equivalent) | Low |
| INT-FILE-04 | ID proof: file too large | Upload **id_proof** PDF exceeding max size (e.g. 10MB) | 400 Bad Request; "PDF file too large" (or equivalent) | Low |

---

## 8. Summary

- **Failed integration test cases** verify that the **API + DB + external services** correctly **reject** invalid inputs, wrong auth, wrong roles, and business-rule violations (event full, duplicate team, age, payment failure, etc.).
- **Expected results** are: **4xx** (400, 401, 403, 404, 402) or **5xx** (500, 502, 504) where appropriate, with error messages or serializer `errors` in the response body—**not** success or data corruption.
- These can be automated with **Django REST framework’s `APIClient`** (or `requests`), using real or test DB and optionally mocked Khalti/email for stability.

For **passed** (positive) integration scenarios (e.g. successful register, login, event create, enrollment, Khalti verify), add a separate section or document with the same flow and "expected: 2xx + correct response body".
