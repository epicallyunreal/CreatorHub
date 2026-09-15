# CLAUDE.md

Guidance for working in this repository. `README.md` documents *what the product does*
(features, API groups, roles, example requests) — this file covers *how to work on it*.

## What this is

A multi-tenant SaaS for creator agencies and influencer marketing teams: a Django 6 +
DRF API at the repo root, and a separate Vite 6 + React 19 SPA in `frontend/`. Not a
monorepo — one `requirements.txt`, one `package.json`, no workspace tooling.

**Naming drift:** the code calls itself **CollabIQ** — `CollabIQJWTAuthentication`,
`Celery("collabiq")`, the `collabiq_user` table, `{slug}.collabiq.com` subdomains, the
sidebar label. Only the repo and README say CreatorHub. Both names refer to this project.

## Layout

```
apps/       12 Django apps: accounts, roles, employees, brands, creators, campaigns,
            payouts, configurations, notifications, reports, audit, notes
config/     settings.py, urls.py (all routes), celery.py, wsgi/asgi
core/       shared infrastructure — NOT in INSTALLED_APPS, imported by path
frontend/   Vite + React SPA (own package.json; run npm from inside this directory)
```

Every app follows the same shape: `models.py`, `serializers.py`, `views.py`, `urls.py`,
`admin.py`, `migrations/`. Some add `services.py`, `tasks.py` or `management/commands/`.

## Commands

Python **3.12+** is required (`Django==6.0.4` declares `Requires-Python >=3.12`). Django 6.0
supports 3.12, 3.13 and 3.14 alike, so any of those work.

```bash
# backend, from the repo root
python3.13 -m venv venv && source venv/bin/activate   # any 3.12+ interpreter
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver          # http://127.0.0.1:8000 — "/" 404s, the API is /api/v1/...
python manage.py check

# seed data (all idempotent)
python manage.py seed_permissions                     # the global permission registry
python manage.py seed_default_roles [--client-id N]
python manage.py seed_platforms

celery -A config worker -l info                       # needs Redis on 127.0.0.1:6379

# frontend, from frontend/
npm install
npm run dev -- --host 0.0.0.0       # http://localhost:3000
npm run lint
npm run build
```

**There are no tests.** All 12 `apps/*/tests.py` are the 3-line Django stub, so
`manage.py test` collects zero. The frontend has no test runner and no typecheck — it is
plain JSX with no `tsconfig.json`. `manage.py check`, `npm run lint` and `npm run build`
are the only automated checks that exist. Verify changes by exercising the API.

## Non-negotiable invariants

1. **Tenant scoping is manual.** There is no global tenant manager. Every `get_queryset()`
   must filter by `self.request.client`:
   ```python
   return Brand.objects.active().filter(client=self.request.client)
   ```
   Nested viewsets scope through the parent instead, reading the id from `self.kwargs`:
   ```python
   return CampaignCreator.objects.filter(
       campaign_id=self.kwargs["campaign_pk"],
       campaign__client=self.request.client,
   )
   ```
   Omitting the filter leaks one tenant's data to another.

2. **Soft delete, always.** `SoftDeleteMixin.delete()` is overridden to set
   `is_active=False`; nothing is hard-deleted. Read through `.objects.active()`.
   `.objects` is the soft-delete manager, `.all_objects` deliberately bypasses it.

3. **Guard every endpoint.** `permission_classes = [IsEmployee, RequirePermission("<module>")]`.
   `RequirePermission("brands")` maps the DRF action automatically (list/retrieve →
   `brands.view`, create → `.create`, update → `.edit`, destroy → `.void`); pass a dotted
   code like `RequirePermission("payouts.approve")` to check one exactly.

4. **Register new permission codes.** Add them to `PERMISSIONS` in
   `apps/roles/management/commands/seed_permissions.py`. A code that is referenced but not
   registered creates no `Permission` row, and `has_permission` then returns `False` for
   everyone — including Admin — with no error. This has bitten the codebase before.

5. **Campaign stages move forward one step at a time.** `can_transition_to` enforces
   `new_idx == current_idx + 1` across the 11 stages. Always go through
   `Campaign.transition_to()` so a `CampaignStatusLog` row is written.

6. **Mix in `AuditMixin`** on mutating viewsets so create/update/destroy write `AuditLog`
   rows via `apps/audit/utils.py::log_action`.

## How auth works

Two actor types share one JWT scheme, distinguished by the `actor_type` claim
(`core/authentication.py`):

- `"user"` → a Django `accounts.User`. Super admins only, on the naked domain.
- `"employee"` → an `apps.employees.Employee`, which is **not** a Django auth user: it has
  its own hashed `password` field. It gets wrapped in an `EmployeeUser` shim whose only job
  is to satisfy DRF's `IsAuthenticated`, and sets `request.employee` / `request.client`.

Tenancy comes from the Host header (`core/middleware.py`): naked domain → `tenant_type
="platform"`, subdomain → `Client` lookup by slug → `"client"`.

Authorization resolves in this order (`core/permissions.py`): employee override
(grant/deny) → role permission → `*.manage` shortcut expansion → **default deny**.

## Conventions

**Backend.** `SimpleRouter` everywhere, with nesting hand-rolled — no `drf-nested-routers`.
Sub-resources are separate routers mounted under a path converter; see
`apps/campaigns/urls.py` for the elaborate case. Register top-level routers *before* the
one registered at `""`, or it swallows their paths. Every model sets an explicit
`db_table`. DRF defaults are global: page size 25 (max 100), plus filter/search/ordering
backends — declare `filterset_fields`, `search_fields`, `ordering_fields` per viewset.

**Frontend.** Every API call is a named export in `src/api/endpoints.js` on the shared
axios client (`src/api/client.js`, `baseURL: "/api/v1"`, bearer token + one-shot 401
refresh). Never call axios inline from a component. Auth state is Zustand
(`src/stores/authStore.js`), server state is TanStack Query. **There is no CSS framework** —
no Tailwind, no CSS-in-JS. Styling is inline `style={{}}` objects with shared tokens in
`src/components/ui/formStyles.js`. There is no `hooks/`, `lib/`, `utils/` or `types/`
directory; shared UI lives in `src/components/ui/`.

## Local development

The Vite dev server proxies `/api` to **`http://dev.localhost:8000`**, not `127.0.0.1:8000`,
because `TenantMiddleware` resolves the tenant from the subdomain. Local dev therefore needs
a `Client` whose slug is `dev`; without one, every API call returns
`404 {"detail": "Invalid client domain."}`. To work against a different tenant, change the
proxy target in `frontend/vite.config.js` to match that client's slug.

Settings read environment variables with bare `os.environ.get` and there is no `.env`
loader installed — export them in the shell. Everything has a default, so the app boots
with no configuration at all.

## Known issues

- **Existing clients lack `config.*` permissions.** The `config.*` codes are now registered,
  but `seed_default_roles` only assigns permissions when it *creates* a role, so re-running
  it is a no-op for clients that already exist. Their Admin and Viewer roles need
  `config.manage` / `config.view` attached through the roles UI or a one-off shell.
- `db.sqlite3` is committed to git. Per the README's SQLite policy, keep production data,
  secrets and personal records out of it — history is permanent once pushed.
- `DJANGO_SECRET_KEY` has a hardcoded fallback in `config/settings.py`, `DEBUG` defaults to
  `True`, `ALLOWED_HOSTS` to `*`, and CORS is fully open whenever `DEBUG` is on. All must be
  set explicitly before any real deployment.
- Celery tasks are unimplemented stubs. `apps/notifications/tasks.py` (email/SMS/WhatsApp)
  and `apps/reports/tasks.py` (report generation) contain placeholders, and nothing ever
  calls them with `.delay()`. No third-party integration exists anywhere in the codebase.
- `frontend/index.html` still carries the stock `<title>Vite + React</title>`.
