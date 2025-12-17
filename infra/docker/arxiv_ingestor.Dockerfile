FROM node:20-alpine
WORKDIR /app
COPY services/workers/arxiv_ingestor/package*.json ./
RUN npm ci
COPY services/workers/arxiv_ingestor/ .
CMD ["npm", "start"]
