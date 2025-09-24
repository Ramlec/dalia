# Dalia Sleep App (Monorepo)

Monorepo TypeScript avec:
- Frontend: React + Vite
- Backend: Fastify (Node.js)
- Base de données: SQLite (à brancher ultérieurement)
- Conteneurs: 2 Dockerfiles (front/back) + docker-compose

## Prérequis
- Node.js 20+
- npm 9+
- Docker & Docker Compose

## Installation (développement)
```bash
npm install
npm run dev:backend
npm run dev:frontend
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000/health

## Docker (production-like)
```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/health

## Workspaces
Ce dépôt utilise npm workspaces:
- `apps/frontend`
- `apps/backend`

## Scripts racine utiles
```bash
npm run dev         # lance front & back en parallèle (dev)
npm run dev:frontend
npm run dev:backend
npm run build       # build front & back
npm run start       # démarre back compilé et front en preview
```
