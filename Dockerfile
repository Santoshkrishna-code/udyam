# ============================================================
# UDYAM ERP — Production Dockerfile
# Multi-stage build: Build client → Run server (serves built SPA)
# ============================================================

# --- Stage 1: Build the React production bundle ---
FROM node:18-alpine AS builder

WORKDIR /app

# Install server dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --production=false

# Install client dependencies
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Generate Prisma Client
RUN cd server && npx prisma generate

# Build React production bundle
RUN cd client && NODE_ENV=production npx webpack --mode production

# --- Stage 2: Production runtime ---
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy server dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --production

# Copy server source + Prisma schema
COPY server/src/ ./server/src/
COPY server/prisma/ ./server/prisma/

# Generate Prisma client in production image
RUN cd server && npx prisma generate

# Copy built React assets from builder stage
COPY --from=builder /app/client/dist/ ./client/dist/

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose the single production port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Run with dumb-init for signal handling (PID 1 issues)
CMD ["dumb-init", "node", "server/src/server.js"]
