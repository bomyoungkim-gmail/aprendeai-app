FROM node:20-alpine
WORKDIR /app
COPY services/workers/content_processor/package*.json ./
RUN npm install
COPY services/workers/content_processor/ .
CMD ["npm", "start"]
