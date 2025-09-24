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
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
EXPOSE 3000
CMD ["npm", "run", "start"]
