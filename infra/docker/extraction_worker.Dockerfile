FROM node:20

WORKDIR /app

# Copy package files
COPY services/workers/extraction_worker/package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY services/api/prisma ./prisma

# Install Prisma CLI and generate client (using stable 5.x)
RUN npm install prisma@5 @prisma/client@5 && \
  npx prisma generate --schema=./prisma/schema.prisma

# Copy application code
COPY services/workers/extraction_worker/ ./

# Start the worker with runtime regeneration of Prisma Client to fix volume mounting issues
CMD ["sh", "-c", "npx prisma generate --schema=./prisma/schema.prisma && npm start"]
