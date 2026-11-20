# Multi-stage Dockerfile for Quarter Note ♩
# Ultra-lightweight self-hosted local music streamer

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code
COPY shared ./shared
COPY server ./server
COPY client ./client

# Build shared types, client SPA, and server
RUN npm run build

# Stage 2: Production Runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV MUSIC_DIR=/music
ENV DATA_DIR=/data
ENV CLIENT_DIR=/app/client/dist

# Install production dependencies only
COPY package*.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Expose port for ZimaBlade
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server/dist/index.js"]
