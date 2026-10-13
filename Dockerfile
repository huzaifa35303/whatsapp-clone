# Multi-stage Docker build for WhatsApp Clone
FROM node:22-alpine AS builder

WORKDIR /app

# 1. Build Client
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client ./client
RUN cd client && npm run build

# 2. Build Backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend ./backend
RUN cd backend && npm run build

# Final Production Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy backend dependencies and compiled files
COPY backend/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/client/dist /app/client/dist

# Expose API and WebSocket port
EXPOSE 5000

VOLUME ["/app/uploads", "/app/data"]

CMD ["node", "--experimental-sqlite", "dist/server.js"]
