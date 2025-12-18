FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY services/workers/extraction_worker/package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema
COPY services/api/prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy application code
COPY services/workers/extraction_worker/ ./

# Start the worker
CMD ["npm", "start"]
