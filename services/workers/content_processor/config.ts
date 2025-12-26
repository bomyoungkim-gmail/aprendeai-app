/**
 * Centralized Configuration for Content Processor Worker
 * Follows pattern from services/api/src/config/urls.config.ts
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

export const WORKER_CONFIG = {
  // Service URLs
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://ai:8001',
  apiUrl: process.env.API_URL || 'http://api:4000/api/v1',
  
  // AI Service Endpoints
  aiEndpoints: {
    simplify: '/simplify',
    assessment: '/generate-assessment',
    pedagogicalEnrich: '/api/pedagogical/enrich',
  },
  
  // API Endpoints (relative to API_URL)
  apiEndpoints: {
    contentVersions: (contentId: string) => `/content/${contentId}/versions`,
    assessment: '/assessment',
    pedagogicalData: (contentId: string) => `/cornell/contents/${contentId}/pedagogical`,
  },
  
  // Queue
  queue: {
    name: 'content.process',
  },
  
  // RabbitMQ
  rabbitUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
} as const;

// Export convenience constants
export const AI_SERVICE_URL = WORKER_CONFIG.aiServiceUrl;
export const API_URL = WORKER_CONFIG.apiUrl;
export const AI_ENDPOINTS = WORKER_CONFIG.aiEndpoints;
export const API_ENDPOINTS = WORKER_CONFIG.apiEndpoints;
