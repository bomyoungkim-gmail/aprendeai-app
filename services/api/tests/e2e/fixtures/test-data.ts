/**
 * Test fixtures - User credentials and test data
 */

export const TEST_USERS = {
  facilitator: {
    email: "facilitator@e2e-test.com",
    password: "Test123!@#",
    name: "Test Facilitator",
    role: "COMMON_USER",
  },
  member1: {
    email: "member1@e2e-test.com",
    password: "Test123!@#",
    name: "Test Member 1",
    role: "COMMON_USER",
  },
  member2: {
    email: "member2@e2e-test.com",
    password: "Test123!@#",
    name: "Test Member 2",
    role: "COMMON_USER",
  },
} as const;

export const TEST_CONTENT = {
  pdf: {
    path: "./tests/e2e/fixtures/test-document.pdf",
    title: "Test PDF Document",
    type: "PDF",
  },
  docx: {
    path: "./tests/e2e/fixtures/test-document.docx",
    title: "Test DOCX Document",
    type: "DOCX",
  },
  txt: {
    path: "./tests/e2e/fixtures/test-document.txt",
    title: "Test Text Document",
    type: "TXT",
  },
} as const;

export const TEST_GROUP = {
  name: "E2E Test Study Group",
  description: "Automated test group",
} as const;

export const TEST_SESSION = {
  mode: "PI_SPRINT",
  layer: "L1",
  roundsCount: 2,
} as const;
