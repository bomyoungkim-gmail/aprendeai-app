import { PrismaService } from "../../prisma/prisma.service";

/**
 * Simplified Test Helpers for E2E Decision Tests
 *
 * Provides minimal utility functions to create test data for
 * flow detection and scaffolding progression tests.
 *
 * NOTE: These are simplified helpers that use the actual Prisma schema.
 * Follow naming convention: Prisma uses snake_case (faithful to DB).
 */

export interface TestUser {
  id: string;
  email: string;
  name: string;
}

export interface TestContent {
  id: string;
  title: string;
  mode: string | null;
}

/**
 * Create a test user using actual Prisma schema
 */
export async function createTestUser(
  prisma: PrismaService,
  overrides?: Partial<TestUser>,
): Promise<TestUser> {
  const timestamp = Date.now();
  const user = await prisma.users.create({
    data: {
      email: overrides?.email || `test-${timestamp}@example.com`,
      name: overrides?.name || `Test User ${timestamp}`,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

/**
 * Create test content using actual Prisma schema
 */
export async function createTestContent(
  prisma: PrismaService,
  mode: "NARRATIVE" | "DIDACTIC" | "TECHNICAL" | "NEWS" = "NARRATIVE",
  overrides?: Partial<TestContent>,
): Promise<TestContent> {
  const timestamp = Date.now();
  const contentId = `test-content-${timestamp}`;

  const content = await prisma.contents.create({
    data: {
      id: contentId,
      title: overrides?.title || `Test Content ${timestamp}`,
      type: "PDF",
      original_language: "PT_BR",
      raw_text: "Test content text",
      mode: mode,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  return {
    id: content.id,
    title: content.title,
    mode: content.mode,
  };
}

/**
 * Create a reading session
 */
export async function createTestSession(
  prisma: PrismaService,
  userId: string,
  contentId: string,
): Promise<{ id: string; userId: string; contentId: string }> {
  const session = await prisma.reading_sessions.create({
    data: {
      user_id: userId,
      content_id: contentId,
      started_at: new Date(),
    },
  });

  return {
    id: session.id,
    userId: session.user_id,
    contentId: session.content_id,
  };
}

/**
 * Clean up test data
 */
export async function cleanupTestData(
  prisma: PrismaService,
  userId?: string,
  contentId?: string,
): Promise<void> {
  if (userId) {
    // Delete in correct order to respect foreign keys
    await prisma.telemetry_events.deleteMany({ where: { user_id: userId } });
    await prisma.reading_sessions.deleteMany({ where: { user_id: userId } });
    await prisma.users.delete({ where: { id: userId } }).catch(() => {
      // Ignore if already deleted
    });
  }

  if (contentId) {
    await prisma.telemetry_events.deleteMany({
      where: { content_id: contentId },
    });
    await prisma.reading_sessions.deleteMany({
      where: { content_id: contentId },
    });
    await prisma.contents.delete({ where: { id: contentId } }).catch(() => {
      // Ignore if already deleted
    });
  }
}
