## Dalia Sleep App (Monorepo)

Application web permettant à un médecin de visualiser et analyser les données de sommeil d’un patient: durée, heures de coucher/réveil, fréquence cardiaque moyenne et score de qualité. Le projet illustre une architecture monorepo TypeScript avec un frontend React et un backend Fastify, une base SQLite, la conteneurisation via Docker Compose et un déploiement sur Railway. Les données sources (JSON) sont transformées puis insérées en base, et l’interface propose une liste d’utilisateurs, un détail par utilisateur, des indicateurs moyens sur périodes et des comparaisons.

### Demo
- Online instance: [Dalia – Demo](https://dalia-production.up.railway.app/)

## Prerequisites
- Node.js 20+
- npm 9+
- Docker & Docker Compose (optional for containerized run)

## Structure
- `apps/frontend`: React + React Router v7 + Mantine (SSR via `@react-router/serve`)
- `apps/backend`: Fastify + TypeScript + SQLite
- `apps/backend/data`: data and database (`app.db`)
- `apps/backend/scripts`: data transformation and insertion
- `docker-compose.yml`: 2 services (frontend, backend)

## Data & Database Initialization
1) Verify the JSON data file exists:
   - Expected path: `apps/backend/data/homework_data.json`
   - If missing, add it there.

2) Initialize the database:
   - From the monorepo root:
     ```bash
     npm run db:setup
     ```
   - This script:
     - transforms the JSON (parses duration into minutes, generates ISO 8601 `bedtime_full`/`waketime_full`, handles AM/PM spans across days),
     - creates `users` and `sleeps` tables if needed,
     - inserts the transformed data into `apps/backend/data/app.db`.
   - Property: idempotent (no effect if the DB already exists with the expected tables).

## Local run (development)
1) Install dependencies (monorepo):
   ```bash
   npm install
   ```
2) Start backend (Fastify, port 3000):
   ```bash
   npm run dev:backend
   ```
   - HealthCheck: `http://localhost:3000/health`
3) Start frontend (React, port 5173):
   ```bash
   npm run dev:frontend
   ```
   - UI: `http://localhost:5173`
4) Frontend environment variables:
   - `apps/frontend/.env.development`
     ```
     VITE_PUBLIC_API_URL=http://localhost:3000
     SERVER_API_URL=http://localhost:3000
     ```

## Local run (preprod/production-like)
1) Build apps:
   ```bash
   npm run build
   ```
2) Start (backend + frontend):
   ```bash
   npm run start
   ```
   - Backend: `http://localhost:3000`
   - Frontend: `http://localhost:5173`

## Docker (production-like)
1) Build and start:
   ```bash
   docker compose up --build -d
   ```
2) Exposed ports:
   - Backend: `3000:3000` → `http://localhost:3000`
   - Frontend: `5173:3000` (frontend listens on 3000 inside the container, exposed as 5173 on the host) → `http://localhost:5173`
3) Environment variables (managed in `docker-compose.yml`):
   - Front SSR → `SERVER_API_URL=http://backend:3000`
   - Client (browser) → `VITE_PUBLIC_API_URL=http://localhost:3000`

## Railway deployment
- Create a Railway project and connect the repo.
- Set service environment variables:
  - `SERVER_API_URL=http://localhost:3000` (frontend SSR)
  - `VITE_PUBLIC_API_URL=http://localhost:3000` (browser)
- Start command: `npm run start` (from the repo root). Backend listens on `3000`. Frontend is served in parallel.
- HealthCheck: `GET /health` on the backend.

## Troubleshooting
- ENOTFOUND `backend` in the browser: ensure the client uses `VITE_PUBLIC_API_URL=http://localhost:3000` (not `http://backend:3000`).
- SSR hitting `backend`: ensure `SERVER_API_URL` is set (dev: `http://localhost:3000`, Docker/Railway: `http://backend:3000`).
- `ERR_EMPTY_RESPONSE` on `http://localhost:5173`: ensure the frontend listens on `PORT=3000` inside its container and the mapping `5173:3000` is active (`docker compose ps`, `docker compose logs -f frontend`).
- Empty DB: rerun initialization `npm run db:setup` after confirming `apps/backend/data/homework_data.json` exists.


