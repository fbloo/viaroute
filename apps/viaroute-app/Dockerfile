# Multi-stage build for React frontend + NestJS backend

# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY apps/viaroute-app/frontend/package*.json ./
RUN npm ci
COPY apps/viaroute-app/frontend/ .
RUN npm run build

# Stage 2: Build NestJS backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY apps/viaroute-app/backend/package*.json ./
RUN npm ci
COPY apps/viaroute-app/backend/ .
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app

# Install production dependencies only
COPY apps/viaroute-app/backend/package*.json ./
RUN npm ci --only=production

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules

# Copy built frontend to public directory
COPY --from=frontend-builder /app/frontend/dist ./dist/public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]
