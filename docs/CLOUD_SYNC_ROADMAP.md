# Cloud Sync & Multi-User Roadmap

> PT EMR Simulator - Production Readiness Plan
> Created: December 8, 2025

## Overview

This roadmap addresses faculty and student concerns for a production-ready shared case database using Azure Static Web Apps + Cosmos DB + Microsoft Entra ID (Azure AD) authentication.

---

## Phase 0: Authentication Foundation 🔴 PRIORITY

**Goal:** Enable Microsoft 365 SSO so users can log in with school accounts.

| ID  | Feature                                                   | Effort | Status |
| --- | --------------------------------------------------------- | ------ | ------ |
| A1  | Enable Azure SWA built-in auth (Microsoft/Entra ID)       | 1 hr   | ⬜     |
| A2  | Create login/logout UI in header                          | 2 hrs  | ⬜     |
| A3  | `getCurrentUser()` utility via `/.auth/me`                | 1 hr   | ✅     |
| A4  | Role-based route protection (student vs faculty vs admin) | 2 hrs  | ✅     |
| A5  | Store `userId` with cases and drafts                      | 2 hrs  | ✅     |
| A6  | Role assignment strategy (manual or domain-based)         | 1 hr   | ✅     |
| A7  | User database (Cosmos DB `users` collection)              | 2 hrs  | ✅     |
| A8  | Faculty request flow (self-service)                       | 2 hrs  | ✅     |
| A9  | Admin user management UI                                  | 3 hrs  | ✅     |

**Auth Providers:**

- Primary: Microsoft Entra ID (Azure AD) - school accounts
- Roles: `anonymous`, `student`, `faculty`, `admin`
- Role management: Self-service request + admin approval via `/api/admin/users`

---

## Phase 1: Data Safety & Ownership 🔴 CRITICAL

**Goal:** Prevent accidental data loss and protect faculty work.

| ID  | Feature                                          | Effort | Status | Notes                     |
| --- | ------------------------------------------------ | ------ | ------ | ------------------------- |
| F1  | `createdBy` uses auth `userId`                   | -      | ✅     | Covered by A5             |
| F2  | Owner-only delete for cloud cases                | 2 hrs  | ✅     | API checks userId match   |
| F3  | Delete confirmation modal                        | 1 hr   | ⬜     | Type case name to confirm |
| F4  | Source badges in case list (📦☁️✏️💾)            | 2 hrs  | ⬜     | Visual distinction        |
| F5  | Author name display                              | 1 hr   | ⬜     | "Created by Dr. Smith"    |
| S1  | Student snapshot (work persists if case removed) | 3 hrs  | ⬜     | Copy-on-start             |

---

## Phase 2: Discovery & Navigation 🟡 HIGH

**Goal:** Make it easy to find and share cases.

| ID  | Feature                                              | Effort | Status | Notes                            |
| --- | ---------------------------------------------------- | ------ | ------ | -------------------------------- |
| F6  | Filter dropdown (My Cases / Shared / Built-in / All) | 2 hrs  | ⬜     |                                  |
| S2  | Shareable direct links to cases                      | 1 hr   | ⬜     | Already have routing             |
| S3  | Search by title/author/body region                   | 3 hrs  | ⬜     |                                  |
| S6  | Progress status indicators                           | 2 hrs  | ⬜     | Not Started / In Progress / Done |

---

## Phase 3: Draft/Publish Flow 🟡 HIGH

**Goal:** Give faculty control over when cases are shared.

| ID  | Feature                                          | Effort | Status | Notes             |
| --- | ------------------------------------------------ | ------ | ------ | ----------------- |
| F7  | New cases start as local draft (no auto-publish) | 3 hrs  | ⬜     |                   |
| F8  | "📤 Publish to Share" button                     | 2 hrs  | ⬜     | Explicit action   |
| F9  | "Unpublished changes" indicator                  | 2 hrs  | ⬜     | Dot/badge         |
| F10 | "🔒 Unpublish" option for shared cases           | 1 hr   | ⬜     |                   |
| S4  | "🔄 Start Over" button for students              | 1 hr   | ⬜     | Clear their draft |

---

## Phase 4: Save Confidence 🟡 HIGH

**Goal:** Students and faculty trust their work is saved.

| ID  | Feature                                                     | Effort | Status | Notes             |
| --- | ----------------------------------------------------------- | ------ | ------ | ----------------- |
| S3b | Persistent "✅ Saved" indicator + timestamp                 | 2 hrs  | ⬜     | Not just toast    |
| S5  | Student draft cloud backup (per user)                       | 4 hrs  | ⬜     | Cross-device sync |
| S8  | Unsaved changes warning on ALL navigation                   | 1 hr   | ⬜     | In-app links too  |
| F11 | Sync status in header (☁️ Synced / ⏳ Syncing / ⚠️ Offline) | 2 hrs  | ⬜     |                   |

---

## Phase 5: Collaboration Polish 🟠 MEDIUM

**Goal:** Enable safe collaboration between faculty.

| ID  | Feature                          | Effort | Status | Notes                       |
| --- | -------------------------------- | ------ | ------ | --------------------------- |
| F12 | "📋 Duplicate" / Fork button     | 2 hrs  | ⬜     | Copy someone's case         |
| F13 | Conflict detection warning       | 4 hrs  | ⬜     | "Modified by X, overwrite?" |
| F14 | Trash / soft-delete with restore | 4 hrs  | ⬜     | 30-day retention            |
| F15 | Admin: view/manage all cases     | 3 hrs  | ⬜     |                             |

---

## Phase 6: Mobile & Polish 🟢 LOW

**Goal:** Ensure good experience on all devices.

| ID  | Feature                           | Effort | Status | Notes                |
| --- | --------------------------------- | ------ | ------ | -------------------- |
| S7  | Mobile responsive audit           | 4 hrs  | ⬜     |                      |
| F16 | Assignment codes for easy sharing | 3 hrs  | ⬜     | "SMITH-SHOULDER-01"  |
| S9  | Attempt history for students      | 4 hrs  | ⬜     | Track multiple tries |

---

## Role Permissions Matrix

| Action               | Anonymous | Student | Faculty | Admin |
| -------------------- | --------- | ------- | ------- | ----- |
| View case list       | ✅        | ✅      | ✅      | ✅    |
| Start/complete cases | ❌        | ✅      | ✅      | ✅    |
| Create new case      | ❌        | ❌      | ✅      | ✅    |
| Edit own case        | ❌        | ❌      | ✅      | ✅    |
| Delete own case      | ❌        | ❌      | ✅      | ✅    |
| Edit any case        | ❌        | ❌      | ❌      | ✅    |
| Delete any case      | ❌        | ❌      | ❌      | ✅    |
| Manage users/roles   | ❌        | ❌      | ❌      | ✅    |

---

## Technical Architecture

### Authentication Flow

```
User visits site
    → Not logged in? Show "Login with School Account" button
    → Click login → /.auth/login/aad → Microsoft login page
    → Success → Redirect back with auth cookie
    → Frontend calls /.auth/me to get user info
    → Store user in app state, show appropriate UI
```

### Data Model Updates

```javascript
// Case object with ownership
{
  id: "case_123",
  title: "Cervical Radiculopathy",
  createdBy: "user-guid-from-azure-ad",    // NEW
  createdByName: "Dr. Smith",               // NEW
  createdAt: "2025-12-08T00:00:00Z",        // NEW
  updatedAt: "2025-12-08T00:00:00Z",        // NEW
  isPublished: true,                         // NEW - draft vs shared
  category: "cervical",
  caseObj: { ... }
}

// Student draft (separate collection or keyed storage)
{
  id: "draft_user123_case456_encounter1",
  userId: "student-user-guid",
  caseId: "case_456",
  encounter: "encounter1",
  data: { ... },
  savedAt: "2025-12-08T00:00:00Z"
}
```

### API Endpoints (Updated)

| Method | Endpoint          | Auth           | Description                       |
| ------ | ----------------- | -------------- | --------------------------------- |
| GET    | `/api/cases`      | Any            | List published cases + own drafts |
| POST   | `/api/cases`      | Faculty+       | Create/update case                |
| DELETE | `/api/cases?id=X` | Owner or Admin | Delete case                       |
| GET    | `/api/drafts`     | Student+       | Get own drafts                    |
| POST   | `/api/drafts`     | Student+       | Save draft                        |

---

## Setup Instructions (Phase 0)

### 1. Register App in Azure AD

1. Go to Azure Portal → Entra ID → App Registrations
2. New Registration:
   - Name: "PT EMR Simulator"
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: `https://<your-swa>.azurestaticapps.net/.auth/login/aad/callback`
3. Note the **Application (client) ID** and **Directory (tenant) ID**
4. Create a client secret under Certificates & Secrets

### 2. Configure SWA

Add to Azure Portal → Static Web App → Configuration → Application settings:

- `AAD_CLIENT_ID` = your client ID
- `AAD_CLIENT_SECRET` = your client secret

### 3. Update staticwebapp.config.json

See implementation in codebase.

---

## Changelog

- 2025-12-08: Initial roadmap created
