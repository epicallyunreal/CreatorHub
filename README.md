# CreatorHub

CreatorHub is a multi-tenant SaaS platform for creator agencies and influencer marketing teams.

Built with Django REST Framework and React/Vite, it is designed to help teams manage brands, creators, campaign lifecycles, briefs, deliverables, payouts, collaboration, and reporting in one workflow. The product is tailored to the operational needs of creator agencies, with tenant-aware authentication, role-based permissions, campaign stage tracking, threaded conversations, and dashboards that support the full journey from discovery and negotiation to approvals, publishing, and payout operations.

- Super admin mode for managing client companies, plans, subscriptions, and platform-level stats
- Client workspace mode for managing brands, creators, campaigns, payouts, teams, reports, notes, and configuration data

The backend API lives under `/api/v1`, and the frontend is a single-page app that talks to that API with JWT authentication.

## How this was built

Directed by [@epicallyunreal](https://github.com/epicallyunreal) — product direction, data
model, and feature scope.

The application itself — the Django REST API and the React frontend — was implemented with
GitHub Copilot in VS Code.

Later contributions, including the `CLAUDE.md` contributor guide and the permission
registry fixes, were implemented with Claude Code.

## License

This repository is source-available under the custom non-commercial license in `LICENSE`.

- commercial use is not permitted
- modified or derivative versions also may not be used commercially
- this is not an open-source license

## Current Stack

### Backend

- Django 6
- Django REST Framework
- SimpleJWT
- django-filter
- SQLite by default, with configurable database settings
- Celery and Redis settings are present in the project configuration

### Frontend

- React 19
- Vite 6
- React Router
- TanStack React Query
- Zustand
- Axios

## Application Model

### Multi-tenant behavior

- Platform routes support super admin operations
- Client routes are tenant-aware and scoped by the current client
- Authentication is domain-aware:
  - super admins authenticate against the platform user model
  - client employees authenticate against the employee model

### Authentication

- JWT access and refresh tokens
- frontend auto-attaches bearer tokens to API requests
- frontend attempts token refresh automatically on `401`
- login redirects:
  - super admin users go to `/admin`
  - client employees go to `/dashboard`

## Current Functional Areas

### 1. Client onboarding and platform admin

Implemented in the backend and exposed in the frontend login flow.

- Public client onboarding flow
- Creates a client company
- Seeds default roles
- Creates the first admin employee
- Optionally seeds initial brands and creators
- Super admin client management APIs
- Subscription plan and client subscription APIs
- Platform-wide aggregate stats

### 2. Roles and permissions

- Global permission registry
- Client-scoped roles
- Default roles seeded on onboarding
- Assign permissions to roles
- Employee-level permission overrides with grant and deny behavior
- Permission-protected APIs across modules

Default seeded roles include:

- Admin
- Brand Manager
- Creator Manager
- Campaign Manager
- Viewer

### 3. Employee management

- Create, list, update, delete employees
- Employee self profile endpoint
- Change password endpoint
- Manager reporting hierarchy
- Direct report lookup
- Effective permission inspection per employee
- Per-employee permission overrides
- Employee tag management
- Soft delete and restore support

### 4. Brand management

- Create, list, update, delete brands
- Brand metadata such as contact details, business type, industry, website, social links, logo, and budget range
- Brand contact management through nested routes

### 5. Creator management

- Create, list, update, delete creators
- Creator profile details including contact, bio, languages, demographics, and banking/KYC details
- Creator platform profiles with follower and engagement data
- Creator domains and niches
- Creator pricing by platform and ad format
- Creator follower history snapshots
- Creator document upload and verification
- Creator media kit configuration and external links
- Filtering by platform, domain, language, follower count, ad format, and pricing
- Soft delete and restore support

### 6. Campaign management

Campaigns are one of the richest areas of the product.

- Create, list, update, delete campaigns
- Campaign stage workflow with forward-only transitions
- Campaign timeline endpoint and audit trail of stage changes
- Campaign to creator assignments
- Campaign requirements by platform and ad format
- Campaign content tracking
- Campaign metrics tracking
- Campaign brief templates and campaign templates
- Campaign briefs per campaign
- Deliverable checklist management
- Campaign expense tracking and expense categories
- Campaign deadlines and completion workflow
- Calendar view API
- Creator availability management
- Brand exclusivity tracking
- Creator brand preference tracking

#### Campaign stages currently implemented

1. Initiation
2. Requirement Discussion
3. Creator Discovery
4. Creator Selection & Confirmation
5. Agreement
6. Content Creation
7. Review & Approval
8. Publishing
9. Performance Tracking
10. Payout Processing
11. Campaign Close

#### Current campaign edit experience in the frontend

The campaign edit screen currently includes:

- Details tab
- Briefs tab with brief creation and approval
- Deliverables tab
- Expenses tab
- Deadlines tab
- Conversations tab for campaign notes and discussion threads
- Tags tab
- Stage timeline sidebar showing current stage and transition history

#### Campaign conversations and notes

Campaign discussions are backed by the notes system and support context types such as:

- general note
- brand said
- creator said
- agency pitch

This is intended to capture negotiation and internal pitch context in one threadable system.

### 7. Payouts and invoicing

- Payout types
- Payout configuration per campaign creator
- Milestone-based payout structure
- Payout records
- Payout approval flow
- Invoice read endpoints

### 8. Configurations

- Platforms
- Business types
- Domains
- Ad formats
- Approximate charges
- Generic team/entity tags
- Tag mappings by entity type and entity id

Some configuration entities support global plus client-specific records.

### 9. Notifications

Frontend routes and API endpoints are present for:

- notification listing
- unread count
- mark single notification read
- mark all as read
- notification templates

### 10. Reports and analytics

- Dashboard summary metrics
- Campaign reports
- Creator reports
- Brand reports
- Financial reports
- Brand performance reports
- Creator performance reports
- Saved reports

### 11. Audit and notes

- Audit module routes exist in the frontend and backend
- Notes/comments module supports entity-linked discussions
- Notes are tenant-scoped and can be attached to campaign and other entity flows

## Frontend Routes

The current frontend router includes these major areas:

- `/login`
- `/dashboard`
- `/brands`
- `/creators`
- `/campaigns`
- `/calendar`
- `/templates`
- `/payouts`
- `/invoices`
- `/employees`
- `/roles`
- `/domains`
- `/business-types`
- `/platforms`
- `/ad-formats`
- `/tags`
- `/notifications`
- `/notifications/templates`
- `/reports`
- `/audit`
- `/admin`
- `/admin/clients`
- `/admin/plans`

## API Areas

The backend currently exposes these top-level API groups under `/api/v1`:

- `/auth/`
- `/employees/`
- `/roles/`
- `/permissions/`
- `/brands/`
- `/creators/`
- `/campaigns/`
- `/payouts/`
- `/config/`
- `/notifications/`
- `/reports/`
- `/audit/`
- `/notes/`
- `/admin/clients/`
- `/admin/plans/`
- `/admin/subscriptions/`
- `/admin/platform-stats/`

## Example API Requests

These examples reflect the current API shape in the repository. Adjust hosts, tokens, ids, and payload fields for your environment.

### 1. Employee login

Request:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "StrongPassword123"
  }'
```

Example response:

```json
{
  "refresh": "<refresh-token>",
  "access": "<access-token>",
  "actor_type": "employee",
  "employee": {
    "id": 1,
    "email": "admin@acme.com",
    "username": "admin@acme.com",
    "full_name": "Jane Doe",
    "role": "Admin"
  },
  "client": {
    "id": 1,
    "company_name": "Acme Media",
    "slug": "acme-media"
  }
}
```

### 2. Super admin login

Request:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "password": "StrongPassword123"
  }'
```

Example response:

```json
{
  "refresh": "<refresh-token>",
  "access": "<access-token>",
  "actor_type": "user",
  "user": {
    "id": 1,
    "email": "superadmin@example.com",
    "full_name": "Platform Admin"
  }
}
```

### 3. Client onboarding

Request:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/auth/onboard/ \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Acme Media",
    "slug": "acme-media",
    "email": "hello@acme.com",
    "phone": "+91-9999999999",
    "address": "Mumbai, India",
    "industry": "Marketing",
    "accepted_terms": true,
    "admin": {
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "admin@acme.com",
      "password": "StrongPassword123",
      "designation": "Admin"
    },
    "brands": [
      {
        "name": "Acme Beauty",
        "contact_email": "brand@acme.com",
        "industry": "Beauty",
        "website": "https://acme.example.com",
        "description": "Primary brand account"
      }
    ],
    "creators": [
      {
        "name": "Riya Kapoor",
        "email": "riya@example.com",
        "phone": "+91-8888888888"
      }
    ]
  }'
```

Example response:

```json
{
  "access": "<access-token>",
  "refresh": "<refresh-token>",
  "actor_type": "employee",
  "client": {
    "id": 1,
    "company_name": "Acme Media",
    "slug": "acme-media"
  },
  "employee": {
    "id": 1,
    "email": "admin@acme.com",
    "full_name": "Jane Doe",
    "role": "Admin"
  },
  "brands_created": 1,
  "creators_created": 1
}
```

### 4. Create a campaign

```bash
curl -X POST http://127.0.0.1:8000/api/v1/campaigns/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": 1,
    "title": "Summer Launch 2026",
    "description": "Launch campaign for Q3",
    "objective": "Drive awareness and conversions",
    "budget": "250000.00",
    "start_date": "2026-06-01",
    "end_date": "2026-07-15"
  }'
```

### 5. Create a campaign brief

```bash
curl -X POST http://127.0.0.1:8000/api/v1/campaigns/12/briefs/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "overview": "Launch brief for shortlisted creators",
    "goals": "Awareness, CTR uplift, creator-led trust",
    "target_audience": "Women 18-34 in tier 1 and tier 2 cities",
    "key_messages": "Affordable luxury, dermatologist tested",
    "dos": "Show product texture and routine usage",
    "donts": "Do not compare directly against competitors"
  }'
```

### 6. Transition a campaign stage

```bash
curl -X POST http://127.0.0.1:8000/api/v1/campaigns/12/transition/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to_stage": "creator_discovery",
    "notes": "Requirements approved by brand and ready for shortlist"
  }'
```

### 7. Post a campaign conversation note

```bash
curl -X POST http://127.0.0.1:8000/api/v1/notes/ \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "campaign",
    "entity_id": 12,
    "text": "Brand wants a stronger skincare education angle in the first draft.",
    "context": "brand_said"
  }'
```

### 8. Get dashboard metrics

```bash
curl -X GET http://127.0.0.1:8000/api/v1/reports/dashboard/ \
  -H "Authorization: Bearer <access-token>"
```

## Default Roles And Permissions

The system seeds five default client roles during onboarding. These are defined in `apps/roles/services.py` and are the current built-in access model.

### Admin

- Description: full access to all modules
- Seeded permissions:
  - `brands.manage`
  - `creators.manage`
  - `campaigns.manage`
  - `payouts.manage`
  - `payouts.approve`
  - `reports.manage`
  - `config.manage`
  - `employees.manage`
  - `roles.manage`
  - `notifications.view`
  - `notifications.manage_preferences`
  - `audit.view`

### Brand Manager

- Description: manages brands and can view campaign and report surfaces
- Seeded permissions:
  - `brands.manage`
  - `campaigns.view`
  - `reports.view`
  - `reports.export`
  - `notifications.view`
  - `notifications.manage_preferences`

### Creator Manager

- Description: manages creators and can view campaign and report surfaces
- Seeded permissions:
  - `creators.manage`
  - `campaigns.view`
  - `reports.view`
  - `reports.export`
  - `notifications.view`
  - `notifications.manage_preferences`

### Campaign Manager

- Description: manages campaigns, assigns creators, and creates payouts
- Seeded permissions:
  - `campaigns.manage`
  - `brands.view`
  - `creators.view`
  - `payouts.create`
  - `payouts.view`
  - `reports.view`
  - `reports.export`
  - `notifications.view`
  - `notifications.manage_preferences`

### Viewer

- Description: read-only access across the main operational modules
- Seeded permissions:
  - `brands.view`
  - `creators.view`
  - `campaigns.view`
  - `payouts.view`
  - `reports.view`
  - `config.view`
  - `employees.view`
  - `roles.view`
  - `notifications.view`
  - `notifications.manage_preferences`

### Permission model notes

- Roles are client-scoped
- Permissions are global registry entries
- Employees inherit permissions from their role
- Per-employee overrides can grant or deny individual permissions
- Some actions use more specific permission checks beyond module-level access, such as `campaigns.transition_stage` and `payouts.approve`

## Local Development

### Requirements

- Python 3.14 compatible environment
- Node.js and npm
- virtual environment for Python dependencies

### Backend setup

From the project root:

```bash
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend default URL:

```text
http://127.0.0.1:8000/
```

Note: the backend root path may return `404` because the app is API-first. Use `/api/v1/...` endpoints instead.

### Frontend setup

From the frontend directory:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Frontend default URL:

```text
http://localhost:3000/
```

### Production-style frontend build

```bash
cd frontend
npm run build
```

## Configuration Notes

Important backend settings are read from environment variables when provided:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `ALLOWED_HOSTS`
- `BASE_DOMAIN`
- `DB_ENGINE`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `CORS_ALLOWED_ORIGINS`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`

Current defaults include:

- SQLite database at `db.sqlite3`
- wildcard hosts in development
- open CORS in debug mode

## SQLite Data Policy

This repository may track `db.sqlite3` for portable development and demo data.

- do not commit production data
- do not commit secrets, tokens, personal data, invoices, or customer-sensitive records
- remember that if this repository becomes public, the full git history is public too
- removing sensitive SQLite data later does not automatically remove it from git history

## How To Use The App

### Super admin flow

1. Open the frontend at `http://localhost:3000`
2. Sign in with a super admin account
3. Go to `/admin`
4. Manage clients, plans, and review platform stats

### New client onboarding flow

1. Open the login page
2. Click `Create Account`
3. Complete the onboarding wizard
4. The system creates:
   - the client
   - default roles
   - the initial admin employee
   - optional brands and creators
5. After onboarding, log in to the client workspace

### Client workspace flow

1. Sign in as an employee on the client workspace
2. Start with configuration data if needed:
   - platforms
   - ad formats
   - domains
   - business types
   - tags
3. Add brands
4. Add creators and enrich their platforms, domains, charges, and documents
5. Create campaigns and assign creators
6. Manage briefs, deliverables, expenses, deadlines, and conversations from the campaign edit page
7. Track payouts, invoices, notifications, reports, and audit activity

## Current Project Structure

```text
CreatorHub/
├── apps/
│   ├── accounts/
│   ├── audit/
│   ├── brands/
│   ├── campaigns/
│   ├── configurations/
│   ├── creators/
│   ├── employees/
│   ├── notes/
│   ├── notifications/
│   ├── payouts/
│   ├── reports/
│   └── roles/
├── config/
├── core/
├── frontend/
├── manage.py
├── requirements.txt
└── db.sqlite3
```

## Notes For Developers

- API auth is JWT-based and handled in the frontend Axios client
- Most APIs are permission-protected and tenant-scoped
- Routers currently use `SimpleRouter`
- Frontend API requests use `baseURL: /api/v1`
- The app is currently documented from implemented code, not roadmap items

## Status

This README documents the current functionality present in the repository as of May 2026.