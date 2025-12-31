module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '..',
  testRegex: 'test/integration/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/main.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  
  // Setup file to run before each test file
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  // Integration test specific settings
  testTimeout: 30000,  // 30 seconds for DB operations
  maxWorkers: 1,  // Run integration tests sequentially
  
  // Exclude Playwright e2e tests from Jest
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/test/e2e/',  // Playwright tests should use 'npx playwright test'
  ],
  
  // Force exit after tests complete to prevent hanging on unclosed resources
  forceExit: true,
  detectOpenHandles: false,
};
