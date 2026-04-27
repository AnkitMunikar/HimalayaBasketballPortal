# HimalayaB — Non-Functional Requirements

Non-functional requirements describe **how** the system should behave (quality, security, performance) rather than **what** it does. Below are typical NFRs for a system like HimalayaB, written in simple terms.

---

## 1. Performance

| Requirement | Description |
|-------------|-------------|
| **Response time** | The website and API should respond within a few seconds under normal use (e.g. page load, form submit, listing events). Users should not have to wait long for a screen or action to complete. |
| **Concurrent users** | The system should support multiple users at the same time (e.g. several coaches enrolling, organizers updating events, visitors browsing) without slowing down or failing. |
| **File uploads** | Uploading photos or documents (e.g. player photos, receipts) should complete within a reasonable time and not block the rest of the application. |

---

## 2. Security

| Requirement | Description |
|-------------|-------------|
| **Authentication** | Only logged-in users should access their own dashboards and actions; unauthenticated users should not see or change others’ data. |
| **Passwords** | Passwords must be stored in a secure way (hashed), not in plain text, and should follow basic strength rules (e.g. minimum length). |
| **Sensitive data** | Secrets (e.g. database password, API keys) must not be stored in the code or in files that are shared or committed to version control. |
| **Payment data** | Payment handling must follow the payment provider’s (e.g. Khalti) guidelines; card or sensitive payment details must not be stored unnecessarily in the application. |

---

## 3. Usability

| Requirement | Description |
|-------------|-------------|
| **Easy to use** | The interface should be clear so that organizers, coaches, and admins can perform their tasks without special training. Navigation and labels should be understandable. |
| **Error messages** | When something goes wrong (e.g. invalid input, server error), the user should see a clear message explaining what happened and what they can do next. |
| **Consistent experience** | Buttons, forms, and layout should behave in a similar way across the site (e.g. same style of forms, same way to save or cancel). |

---

## 4. Availability and Reliability

| Requirement | Description |
|-------------|-------------|
| **Uptime** | The system should be available when users need it (e.g. during registration periods or event days). Planned maintenance should be minimal and communicated if possible. |
| **Recovery** | If the server or database fails, the system should be recoverable from backups so that data (events, enrollments, users) is not lost. |
| **Data integrity** | Saving or updating data (e.g. enrollment, standings) should complete fully or not at all; users should not see half-updated or inconsistent data. |

---

## 5. Scalability and Maintainability

| Requirement | Description |
|-------------|-------------|
| **Growing usage** | The design should allow for more users, events, and enrollments over time without a full rewrite (e.g. database and code structured so that adding data does not break the system). |
| **Maintainable code** | The codebase should be organized (e.g. separate modules for auth, events, enrollment) so that developers can fix bugs or add changes without breaking unrelated parts. |
| **Documentation** | Important decisions, setup steps, and configuration (e.g. how to run the project, what environment variables are needed) should be documented for future developers or deployers. |

---

## 6. Compatibility and Accessibility

| Requirement | Description |
|-------------|-------------|
| **Browsers and devices** | The web application should work on common modern browsers (e.g. Chrome, Firefox, Edge, Safari) and on different screen sizes (desktop, tablet, mobile) so that most users can access it without issues. |
| **Standards** | Where applicable, the system should follow standard practices (e.g. secure HTTP in production, standard authentication mechanisms) so that it can integrate with other tools or be audited more easily. |

---

## 7. Legal and Compliance

| Requirement | Description |
|-------------|-------------|
| **Data handling** | Personal data (names, emails, phone numbers, photos) should be collected and used only for the purpose of running events and enrollments; handling should be consistent and transparent. |
| **Payment compliance** | Use of the payment gateway (e.g. Khalti) must follow its terms and any local rules for handling payment-related data. |

---

## Summary (for documentation)

**Non-functional requirements** for HimalayaB cover:

- **Performance:** Fast response and support for multiple users and file uploads.
- **Security:** Proper login, safe storage of passwords and secrets, and safe handling of payment-related flow.
- **Usability:** Clear, consistent interface and helpful error messages.
- **Availability and reliability:** System up when needed, recoverable from failures, and data kept consistent.
- **Scalability and maintainability:** Room to grow and code that is organized and documented.
- **Compatibility:** Works on common browsers and devices.
- **Legal/compliance:** Sensible and transparent handling of personal and payment-related data.

These can be refined or prioritized (e.g. “must have” vs “nice to have”) depending on your project report or thesis.
