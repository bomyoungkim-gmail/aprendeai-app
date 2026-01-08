# ==========================================
# Stage 1: Builder - Install and compile dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (bcrypt needs Python, make, g++)
RUN apk add --no-cache python3 make g++ libc6-compat openssl

# Copy package files
COPY services/api/package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy Prisma schema
RUN mkdir -p /app/prisma
COPY services/api/prisma/schema.prisma /app/prisma/schema.prisma

# Generate Prisma Client
RUN npx prisma generate --schema=/app/prisma/schema.prisma

# Copy ONLY source code (not node_modules thanks to .dockerignore)
COPY services/api/src ./src
COPY services/api/tests ./tests
COPY services/api/tsconfig*.json ./
COPY services/api/nest-cli.json ./

# ==========================================
# Stage 2: Production - Clean runtime image
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY services/api/package*.json ./

# Copy compiled node_modules from builder (with Linux-compiled bcrypt)
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma client
COPY --from=builder /app/prisma ./prisma

# Copy application source
COPY --from=builder /app/src ./src
COPY --from=builder /app/tests ./tests
COPY --from=builder /app/tsconfig*.json ./
COPY --from=builder /app/nest-cli.json ./

# Expose port
EXPOSE 4000

# Start development server
CMD ["npm", "run", "start:dev"]
