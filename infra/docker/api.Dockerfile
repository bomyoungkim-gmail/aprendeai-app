FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY services/api/package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema to expected location
RUN mkdir -p /app/prisma
COPY db/schema.prisma /app/prisma/schema.prisma

# Generate Prisma Client
RUN npx prisma generate --schema=/app/prisma/schema.prisma

# Copy application code
COPY services/api/ .

# Expose port
EXPOSE 4000

# Start development server
CMD ["npm", "run", "start:dev"]
