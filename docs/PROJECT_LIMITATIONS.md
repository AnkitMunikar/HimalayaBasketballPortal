# HimalayaB — Project Limitations

This document lists limitations of the HimalayaB Basketball Portal suitable for inclusion in project documentation, report, or thesis.

---

## 1. Security and Configuration

| Limitation | Description |
|------------|-------------|
| **Secrets and credentials** | Database password, email credentials, and API keys may be stored in configuration or environment; production deployment requires strict use of environment variables or a secrets manager with no defaults in code. |
| **Debug mode** | Application may run with `DEBUG=True` in development; production must use `DEBUG=False` to avoid information leakage. |
| **CORS** | Default configuration may allow all origins; production should restrict CORS to the actual frontend domain(s). |
| **Hardcoded API base URL** | Frontend uses hardcoded or scattered API base URLs (e.g. `localhost:8000`); production requires a single configurable base URL (e.g. via environment variable). |
| **JWT token lifetime** | Access token lifetime is long (e.g. 30 days); shorter lifetime with refresh flow is recommended for production. |

---

## 2. Authentication and Admin

| Limitation | Description |
|------------|-------------|
| **Single admin scenario** | When there is only one admin, password reset can only be done via self-service (forgot password) or server-side tools; there is no separate "superadmin" or second admin to reset the first admin's password. |
| **Admin creation** | Initial admin may be created via a script with a placeholder password or via `createsuperuser`; there is no in-app "invite admin" or role-based admin-creation flow. |
| **No two-factor authentication (2FA)** | Login relies only on username and password; no OTP or 2FA. |
| **No social login** | Login is username/password only; no Google or Facebook login (social auth URL may be present but not fully integrated). |

---

## 3. Functional Scope

| Limitation | Description |
|------------|-------------|
| **Payment gateway** | Only Khalti is supported; no alternative payment providers. |
| **Email** | Email is sent via a single SMTP backend (e.g. Gmail); no in-app notifications or push notifications. |
| **Reporting and analytics** | Reporting is limited; no built-in dashboards for revenue, participation trends, or advanced analytics. |
| **Search and filters** | Event and enrollment search/filtering may be basic; no full-text or advanced search. |
| **Localization** | Interface and content are primarily in English; no multi-language support. |
| **Mobile** | Web application only; no dedicated native mobile app. |

---

## 4. Technical and Scalability

| Limitation | Description |
|------------|-------------|
| **Caching** | Default in-memory cache is used; no distributed cache (e.g. Redis) for scaling or session storage. |
| **File storage** | Uploaded files (logos, receipts, photos) are stored on the server filesystem; production at scale would typically use object storage (e.g. S3). |
| **Database** | Single database (e.g. MySQL); no read replicas or dedicated scaling strategy. |
| **Automated tests** | Test coverage may be limited; unit and integration tests are not fully implemented across all modules. |

---

## 5. User Experience and Frontend

| Limitation | Description |
|------------|-------------|
| **Role-based UI** | Admin dashboard may not expose "Create event" or "Enroll team" even though the API allows it; flows are optimized for organizer and coach. |
| **Error handling** | Some API errors may not be translated into user-friendly messages on the frontend. |
| **Offline support** | Application requires an active internet connection; no offline or PWA support. |
| **Browser support** | Tested on modern browsers; older browsers may not be fully supported. |

---

## 6. Operational and Deployment

| Limitation | Description |
|------------|-------------|
| **Deployment** | Deployment and hosting (e.g. production URL, SSL, environment variables) are not fully documented or automated. |
| **Logging** | Use of `print()` and `console.log` for debugging; production should use structured logging and avoid logging sensitive data. |
| **Monitoring** | No built-in health checks, APM, or alerting for production. |
| **Backup and recovery** | No documented automated backup or disaster-recovery procedure for database and media files. |

---

## 7. Summary for Documentation

**Short version (for report/thesis):**

- **Security:** Configuration and secrets must be externalized for production; CORS and DEBUG must be tightened.
- **Auth:** Single admin has no alternate recovery path; no 2FA or social login.
- **Scope:** Single payment provider (Khalti), single SMTP, limited reporting and localization, web-only.
- **Technical:** In-memory cache, local file storage, single DB, limited automated testing.
- **Operational:** No full deployment, monitoring, or backup documentation.

These limitations are acceptable for an academic or prototype scope; addressing them would be part of a production-ready release.
