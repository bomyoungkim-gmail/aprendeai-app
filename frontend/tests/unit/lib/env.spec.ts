/**
 * Env Configuration Tests
 * 
 * Verifies environment variable validation logic
 */

import { z } from 'zod';

describe('Env Configuration', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should validate correct environment variables', () => {
    // Setup valid env
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
    (process.env as any).NODE_ENV = 'test';

    // Re-import file
    const { env } = require('@/lib/config/env');

    expect(env.NEXT_PUBLIC_API_URL).toBe('http://localhost:4000');
    expect(env.NODE_ENV).toBe('test');
  });

  it('should throw error for invalid API URL', () => {
    process.env.NEXT_PUBLIC_API_URL = 'invalid-url';
    (process.env as any).NODE_ENV = 'test';

    // suppress console.error for expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      require('@/lib/config/env');
    }).toThrow();

    spy.mockRestore();
  });

  // Note: We can't easily test "missing" required vars if they default or are optional.
  // API URL is required.

  it('should use default NODE_ENV if missing', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000';
    delete (process.env as any).NODE_ENV;

    const { env } = require('@/lib/config/env');

    // Default is 'development'
    expect(env.NODE_ENV).toBe('development');
  });
});
