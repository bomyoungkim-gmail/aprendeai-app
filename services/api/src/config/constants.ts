export const QUEUES = {
  CONTENT_PROCESS: 'content.process',
} as const;

export const DEFAULTS = {
  SCHOOL_LEVEL: {
    ELEMENTARY_5: '5_EF',
    HIGH_SCHOOL_1: '1_EM',
  },
  LANGUAGE: {
    PT_BR: 'PT_BR',
  },
} as const;

export const UPLOAD_LIMITS = {
  CONTENT_FILE_SIZE: 20 * 1024 * 1024, // 20MB
} as const;
