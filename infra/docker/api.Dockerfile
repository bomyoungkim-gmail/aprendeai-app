FROM node:20-alpine As development
WORKDIR /app
COPY services/api/package*.json ./
RUN npm ci
COPY services/api/ .
RUN npx prisma generate
EXPOSE 4000
