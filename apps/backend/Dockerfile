# Backend Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY ../../package.json ../../package-lock.json* /app/
RUN npm ci --ignore-scripts || npm install --no-audit --no-fund

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build backend
RUN npm run build
# Try to seed DB during build (optional) and copy to /app/seed for runtime init
RUN npm run db:setup || true
RUN mkdir -p /app/seed && cp -f data/app.db /app/seed/app.db || true

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/seed ./seed
COPY package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
EXPOSE 3000
# Entrypoint: if DB missing or empty, try to copy seed; if no seed, generate via db:setup (expects /app/homework_data.json mounted)
CMD ["sh", "-c", "if [ ! -s /app/data/app.db ] || ! sqlite3 /app/data/app.db '.tables' 2>/dev/null | grep -q users; then mkdir -p /app/data; if [ -f /app/seed/app.db ] && [ -s /app/seed/app.db ]; then cp /app/seed/app.db /app/data/app.db; else npm run db:setup; fi; fi; node dist/server.js"]
