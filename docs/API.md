# API Design

Base URL: `http://localhost:8000/api/v1` (native dev) or as set by `VITE_API_URL`.
All responses are JSON. Successful single/collection responses are wrapped in a
`data` envelope: `{ "data": ... }`. Paginated list endpoints return Laravel's
paginator shape: `{ "data": [...], "meta": { current_page, last_page, per_page, total } }`.
Validation errors return HTTP 422 with `{ "message": ..., "errors": { field: [msg] } }`.

## Authentication

JWT access token (`php-open-source-saver/jwt-auth`) + a separate long-lived refresh
token stored in an httpOnly, secure, `SameSite=Lax` cookie. The access token is never
persisted client-side (kept in memory only); the frontend's axios interceptor retries
once on a 401 by calling `/auth/refresh`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | none | `{ email, password }` → `{ access_token, token_type, expires_in, user }`; sets refresh cookie |
| POST | `/auth/refresh` | refresh cookie | Issues a new access token from the refresh cookie |
| POST | `/auth/logout` | `auth:api` | Revokes the refresh token, clears the cookie |
| GET | `/auth/me` | `auth:api` | Current user + role + flattened permission list |

All routes below require `auth:api` (`Authorization: Bearer <access_token>`) plus the
listed permission gate, enforced via `permission:<name>` route middleware
(`spatie/laravel-permission`). Permissions follow a `module.action` pattern; most
modules expose a `.view` and a `.manage` permission (manage implies view).

## Master Data — generic CRUD (21 resources)

One `CrudController` subclass per resource, all exposing the same five routes.
Resource slugs: `vehicle-categories`, `vehicle-models`, `axle-configurations`,
`tyre-positions`, `tyre-brands`, `tyre-patterns`, `tyre-sizes`, `tyre-types`, `sites`,
`warehouses`, `customers`, `projects`, `suppliers`, `failure-codes`, `damage-types`,
`removal-reasons`, `scrap-reasons`, `repair-types`, `retread-vendors`,
`inspection-checklists`.

| Method | Path | Permission |
|---|---|---|
| GET | `/master-data/{resource}?search=&status=&page=&per_page=` | `master.view`\|`master.manage` |
| GET | `/master-data/{resource}/{id}` | `master.view`\|`master.manage` |
| POST | `/master-data/{resource}` | `master.manage` |
| PUT | `/master-data/{resource}/{id}` | `master.manage` |
| DELETE | `/master-data/{resource}/{id}` | `master.manage` (soft delete) |
| POST | `/master-data/{resource}/{id}/restore` | `master.manage` |

Bespoke master data (richer relations/behavior than the generic engine):

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/master-data/tyres` | `master.view`\|`master.manage` | filterable list |
| GET | `/master-data/tyres/lookup?code=` | `master.view`\|`master.manage` | barcode/RFID/serial lookup |
| GET/PUT | `/master-data/tyres/{id}` | `master.view`\|`master.manage` / `master.manage` | |
| POST | `/master-data/tyres/{id}/generate-barcode` | `master.manage` | |
| GET/POST/PUT/DELETE | `/master-data/vehicles[/{id}]` | `master.view`\|`master.manage` / `master.manage` | |

## Transactions

### Procurement
| Method | Path | Permission |
|---|---|---|
| GET | `/transactions/purchase-orders` , `/{id}` | `transaction.procurement.view`\|`.manage` |
| POST | `/transactions/purchase-orders` | `transaction.procurement.manage` |
| PUT | `/transactions/purchase-orders/{id}` | `transaction.procurement.manage` |
| PATCH | `/transactions/purchase-orders/{id}/status` | `transaction.procurement.manage` |
| DELETE | `/transactions/purchase-orders/{id}` | `transaction.procurement.manage` |
| GET/POST | `/transactions/goods-receipts[/{id}]` | view\|manage / manage |
| GET/POST | `/transactions/initial-stock-entries` | view\|manage / manage |

### Warehouse / Stock
| Method | Path | Permission |
|---|---|---|
| GET | `/transactions/stock-inventory`, `/summary` | `transaction.warehouse.view`\|`.manage` |
| GET | `/transactions/stock-movements` | `transaction.warehouse.view`\|`.manage` |
| GET/POST | `/transactions/stock-transfers[/{id}]` | view\|manage / manage |
| GET/POST | `/transactions/stock-adjustments` | view\|manage / manage |

### Tyre Installation — the flagship lifecycle engine
| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/transactions/vehicles/{vehicleId}/axle-view` | `transaction.installation.view`\|`.manage` | axle layout + mounted tyres + computed health status per position |
| GET | `/transactions/tyres/{tyreId}/history` | same | full tyre record with every relation eager-loaded |
| GET | `/transactions/tyres/{tyreId}/timeline` | same | `tyre_events` feed, newest first |
| POST | `/transactions/tyre-installations/install` | `transaction.installation.manage` | `{ tyre_id, vehicle_id, tyre_position_id, odometer_km, engine_hours }` |
| POST | `/transactions/tyre-installations/remove` | `transaction.installation.manage` | `{ tyre_id, removal_reason_id, odometer_km, engine_hours, notes }` |
| POST | `/transactions/tyre-installations/rotate` | `transaction.installation.manage` | `{ moves: [{ tyre_id, vehicle_id, tyre_position_id }], notes }` — atomic batch swap |

### Inspection / Maintenance / Disposal
| Method | Path | Permission |
|---|---|---|
| GET/POST/PUT/DELETE | `/transactions/inspections[/{id}]` | `transaction.inspection.view`\|`.manage` / `.manage` |
| GET/POST | `/transactions/repairs[/{id}]` | `transaction.maintenance.view`\|`.manage` / `.manage` |
| GET/POST | `/transactions/retreads[/{id}]` | same |
| GET/POST/PUT | `/transactions/warranty-claims[/{id}]` | same |
| GET/POST | `/transactions/scraps[/{id}]` | `transaction.disposal.view`\|`.manage` / `.manage` |
| GET/POST/PUT | `/transactions/lost-tyres[/{id}]` | same |

## Dashboard + Analytics

All under `analytics.view`. Every endpoint returns `{ data: ... }`; shapes vary per
endpoint (see `frontend/src/config/analytics.ts` for the exact contract each screen
consumes).

| Path | Returns |
|---|---|
| `GET /dashboard/kpis` | Executive Dashboard: top-line KPIs + 5 chart datasets + top-cost vehicles |
| `GET /dashboard/fleet-overview` | Vehicle composition by category/status/site, utilization |
| `GET /dashboard/tyre-health` | Installed-tyre health distribution + at-risk list |
| `GET /dashboard/upcoming-activities` | Unified feed: replacements/rotations/inspections due + pending POs |
| `GET /analytics/cost-per-km` , `/cost-per-hour` | `{ summary, by_vehicle }` |
| `GET /analytics/cost-per-vehicle` | flat array, sorted by cost desc |
| `GET /analytics/cost-per-fleet` | single fleet cost summary |
| `GET /analytics/cost-per-site` , `/cost-per-project` | array of `{ group, ...fleet summary }` |
| `GET /analytics/brand-performance` , `/pattern-performance` | array of `{ brand\|pattern, tyre_count, avg_cost, scrapped_count }` |
| `GET /analytics/tyre-lifetime` | sample size + avg/min/max lifetime km & hours |
| `GET /analytics/tyre-utilization` | tyre pool by status + utilization rate |
| `GET /analytics/failure-analysis` , `/damage-analysis` , `/scrap-analysis` | array of `{ label, total[, cost] }` |

## Reports

14 report keys behind one generic controller: `inventory`, `purchase`, `installation`,
`removal`, `rotation`, `inspection`, `repair`, `retread`, `scrap`, `lifecycle`,
`cost-per-km`, `cost-per-hour`, `cost-per-vehicle`, `brand-comparison`.

| Method | Path | Permission | Returns |
|---|---|---|---|
| GET | `/reports/{key}` | `reports.view` | `{ title, headings: string[], rows: object[] }` |
| GET | `/reports/{key}/export?format=xlsx\|pdf` | `reports.export` | file download (`maatwebsite/excel` or `barryvdh/laravel-dompdf`) |

## Settings

| Method | Path | Permission |
|---|---|---|
| GET/POST/GET/PUT/PATCH/DELETE | `/settings/users[/{id}]` (apiResource) | `users.manage` |
| GET/POST/PUT/DELETE | `/settings/roles[/{id}]`, `GET /settings/roles/permissions` | `users.manage` |
| GET/PUT | `/settings/company-profile` | `settings.view`\|`.manage` / `.manage` |
| GET/PUT | `/settings/barcode-rfid-config` | same |
| GET/PUT | `/settings/system-configurations` | same |
| GET | `/settings/audit-logs` | `settings.view`\|`.manage` |
| GET/POST/PUT/DELETE | `/settings/approval-workflows[/{id}]` | view\|manage / manage |
| GET/PUT | `/settings/notification-preferences` | `auth:api` only (per-user, no extra gate) |

## Example: login

```
POST /api/v1/auth/login
{ "email": "admin@example.com", "password": "password" }

200 OK
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900,
  "user": { "id": 1, "name": "Super Admin", "email": "admin@example.com", "role": "super-admin" }
}
Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax
```

## Example: generic master-data list

```
GET /api/v1/master-data/tyre-brands?search=mich&page=1&per_page=15
Authorization: Bearer eyJ...

200 OK
{
  "data": [{ "id": 4, "code": "MICHELIN", "name": "Michelin", "status": "active", ... }],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 15, "total": 1 }
}
```
