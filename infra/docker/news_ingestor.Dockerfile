FROM node:20-alpine
WORKDIR /app
COPY services/workers/news_ingestor/package*.json ./
RUN npm install
COPY services/workers/news_ingestor/ .
CMD ["npm", "start"]
