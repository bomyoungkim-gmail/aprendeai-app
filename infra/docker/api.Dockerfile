FROM node:20-alpine AS builder
WORKDIR /app
COPY services/api/package*.json ./
COPY db/schema.prisma ./prisma/schema.prisma
RUN npm install
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY services/api/ .
EXPOSE 4000
CMD ["npm", "run", "start:dev"]
