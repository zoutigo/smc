# ---- deps ----
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Copy package manifests and Prisma schema so @prisma/client can generate correctly
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

# ---- builder ----
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ensure Prisma client is present (safety)
RUN npx prisma generate
# Avoid hitting DB during build (pages guard on SKIP_DB_ON_BUILD)
ENV SKIP_DB_ON_BUILD=1
RUN npm run build

# ---- runner ----
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
