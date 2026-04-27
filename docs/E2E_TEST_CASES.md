# HimalayaB — End-to-End Test Cases (Including Failed / Negative)

This document lists **end-to-end (E2E)** test cases for user-facing flows in the browser. It focuses on **failed** (negative) scenarios: cases where the system should reject the action and show an error or redirect, not succeed.

---

## 1. Authentication — Failed E2E Test Cases

| ID | Scenario | Steps | Expected Result (Failure) | Priority |
|----|----------|--------|---------------------------|----------|
| E2E-AUTH-01 | Login with wrong password | Open login page → enter valid email and **wrong password** → submit | Error message (e.g. “Invalid credentials”); no redirect to dashboard; user remains on login page | High |
| E2E-AUTH-02 | Login with non-existent email | Open login page → enter **unregistered email** and any password → submit | Error message; no redirect; no JWT issued | High |
| E2E-AUTH-03 | Login with invalid email format | Open login page → enter **invalid email** (e.g. “notanemail”) → submit | Validation error on email field; form not submitted | Medium |
| E2E-AUTH-04 | Signup with duplicate email | Open signup page → enter **email already registered** → submit | Validation error (e.g. “User with this email already exists”); account not created | High |
| E2E-AUTH-05 | Signup with invalid/weak password | Open signup page → enter valid email and **invalid/weak password** (e.g. “123”) → submit | Validation error; account not created | Medium |
| E2E-AUTH-06 | Access protected page with expired JWT | Log in → wait until token expires (or manually clear/expire token) → navigate to dashboard or enroll page | 401 response; redirect to login or “Session expired” message | High |
| E2E-AUTH-07 | Access protected page with invalid/missing token | Open app in new tab → go directly to dashboard or enroll URL **without logging in** | Redirect to login or 401; no dashboard/enroll content shown | High |

---

## 2. Authorization (Role-Based Access) — Failed E2E Test Cases

| ID | Scenario | Steps | Expected Result (Failure) | Priority |
|----|----------|--------|---------------------------|----------|
| E2E-ROLE-01 | Access admin-only page as player | Log in as **player** → navigate to admin URL (e.g. user list, event approval) | 403 Forbidden or redirect to appropriate dashboard; admin content not visible | High |
| E2E-ROLE-02 | Access admin-only page as coach | Log in as **coach** → navigate to admin URL | 403 or redirect; admin actions not allowed | High |
| E2E-ROLE-03 | Create event as player or coach | Log in as **player** or **coach** → try to open “Create event” or call create-event API | 403 or “Not allowed”; event not created | High |
| E2E-ROLE-04 | Approve/reject event as non-admin | Log in as **event_organizer** or **coach** → try to approve or reject an event | 403; approval status unchanged | High |
| E2E-ROLE-05 | Access organizer-only event management as player | Log in as **player** → try to edit or delete another user’s event | 403 or “Not found”; no update/delete | Medium |

---

## 3. Events — Failed E2E Test Cases

| ID | Scenario | Steps | Expected Result (Failure) | Priority |
|----|----------|--------|---------------------------|----------|
| E2E-EVT-01 | Enroll when event is full | Open event that has **max_teams** reached → as coach, try to enroll a new team | Error message (e.g. “Event is full”); enrollment not created | High |
| E2E-EVT-02 | Enroll when event is closed or past | Open event with **end_date** in the past or enrollment closed → try to enroll | Error message (e.g. “Enrollment closed” or “Event has ended”); enrollment rejected | High |
| E2E-EVT-03 | Enroll in non-approved event | Open event with **approval_status = pending** or **rejected** → try to enroll | Error or “Event not available for enrollment”; enrollment not created | High |
| E2E-EVT-04 | Create event with invalid dates | As organizer, open create event form → set **end_date before start date** → submit | Validation error; event not created | Medium |
| E2E-EVT-05 | Create event with missing required fields | As organizer, submit create event form with **empty name** or required field missing | Validation errors on form; event not created | Medium |

---

## 4. Enrollment & Players — Failed E2E Test Cases

| ID | Scenario | Steps | Expected Result (Failure) | Priority |
|----|----------|--------|---------------------------|----------|
| E2E-ENR-01 | Enroll with duplicate team name in same event | As coach, enroll team “Team A” in Event X → try to enroll another team with **same name “Team A”** in Event X | Validation error (e.g. “Team with this name already enrolled”); second enrollment rejected | High |
| E2E-ENR-02 | Add player over max age for event level | During enrollment, add a player whose **age exceeds event’s max age** (e.g. U18) → submit | Validation error (e.g. “Player exceeds maximum age”); enrollment or player not saved | High |
| E2E-ENR-03 | Submit enrollment with invalid player data | Add player with **invalid DOB**, missing required field, or invalid document → submit | Validation errors; enrollment not completed | Medium |
| E2E-ENR-04 | Enroll in paid event without completing payment | Start enrollment for **paid event** → skip or cancel Khalti payment → try to access “enrolled” state | No enrollment confirmed; payment required or error shown | High |
| E2E-ENR-05 | Enroll as non-coach (e.g. player) | Log in as **player** → try to create a team enrollment for an event | 403 or “Coaches only”; enrollment not created | High |

---

## 5. Payment (Khalti) — Failed E2E Test Cases

| ID | Scenario | Steps | Expected Result (Failure) | Priority |
|----|----------|--------|---------------------------|----------|
| E2E-PAY-01 | Payment initiation failure (e.g. invalid amount) | Start enrollment for paid event → trigger payment with **invalid amount or config** | Error message; no successful payment; enrollment not confirmed | High |
| E2E-PAY-02 | User cancels Khalti payment | Start paid enrollment → open Khalti → **cancel** payment | Return to app with error or “Payment cancelled”; enrollment not confirmed | High |
| E2E-PAY-03 | Khalti verification fails (invalid/expired pidx) | Complete Khalti flow but **verification fails** (e.g. wrong pidx, timeout) | Error message; payment status not “success”; enrollment not confirmed | High |
| E2E-PAY-04 | Double-confirm same payment | Complete one successful payment → **reuse same pidx** to verify again | Second verification rejected or idempotent no-op; no duplicate enrollment | Medium |
| E2E-PAY-05 | Payment timeout | Start payment → **do not complete** within timeout window → try to verify | Timeout or “Payment expired”; user must retry or re-initiate | Medium |

---

## 6. General / UI — Failed E2E Test Cases

| ID | Scenario | Steps | Expected Result (Failure) | Priority |
|----|----------|--------|---------------------------|----------|
| E2E-UI-01 | Submit form with empty required fields | On any form (login, signup, enroll) → leave **required fields empty** → submit | Validation errors; form not submitted | Medium |
| E2E-UI-02 | Direct URL to non-existent resource | Log in → open URL for **non-existent event or enrollment** (e.g. wrong ID) | 404 or “Not found”; no crash | Medium |
| E2E-UI-03 | Invalid file type for upload | During enrollment, upload **non-allowed file** (e.g. .exe) for photo or ID proof | Validation error; file rejected | Low |

---

## 7. Summary

- **Failed E2E test cases** verify that the system correctly **rejects** invalid inputs, unauthorized actions, and error conditions (wrong credentials, wrong role, full event, failed payment, etc.).
- **Expected results** are: error messages, validation feedback, 401/403/404 responses, or redirects to login/appropriate page—**not** success or data corruption.
- These can be automated with tools like Playwright or Cypress by asserting on error messages, HTTP status codes, and absence of success redirects.

For **passed** (positive) E2E scenarios (e.g. successful login, signup, enrollment, payment), you can add a separate section or document and reference the same flows with “expected: success” outcomes.
