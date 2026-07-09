# Enterprise Tyre Management System

A modern, mobile-first Tyre Management System (TMS) for heavy equipment, mining trucks,
trailers, buses, and commercial vehicles — covering the full tyre lifecycle from
purchase through installation, inspection, rotation, repair, retread, and scrap.

## Tech Stack

- **Backend:** Laravel 12 (PHP 8.3+), PostgreSQL 16
- **Auth:** JWT (`php-open-source-saver/jwt-auth`) — short-lived access token +
  httpOnly-cookie refresh token, RBAC via `spatie/laravel-permission`
- **Frontend:** React 18 + TypeScript + Vite, Tailwind CSS, shadcn/ui, TanStack Query,
  React Hook Form + Zod, Recharts, dnd-kit (drag-and-drop tyre swap/rotation),
  html5-qrcode (barcode/RFID camera scanning)

## Repository Layout

```
backend/     Laravel 12 API
frontend/    React + TypeScript SPA
docker/      Dockerfiles for backend/frontend
docs/        ERD.md, API.md — architecture & design docs
```

## Getting Started (Docker Compose)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

- API: http://localhost:8000/api/v1
- Frontend: http://localhost:5173

Run migrations + demo seed data (first run):

```bash
docker compose exec backend php artisan migrate --seed
```

## Getting Started (Manual, no Docker)

**Backend**

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan jwt:secret
# create a PostgreSQL database + user matching backend/.env
php artisan migrate --seed
php artisan serve
```

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Documentation

- [`docs/ERD.md`](docs/ERD.md) — full entity-relationship design
- [`docs/API.md`](docs/API.md) — REST API design
