import { JwtService } from "@nestjs/jwt";

export interface TestUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Test authentication helper
 * Generates real JWT tokens for integration testing
 */
export class TestAuthHelper {
  private jwtService: JwtService;

  constructor(jwtSecret: string) {
    this.jwtService = new JwtService({
      secret: jwtSecret,
      signOptions: { expiresIn: "1h" },
    });
  }

  /**
   * Generate a valid JWT token for a test user
   */
  generateToken(user: TestUser): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Generate an Authorization header with Bearer token
   */
  generateAuthHeader(user: TestUser): string {
    const token = this.generateToken(user);
    return `Bearer ${token}`;
  }

  /**
   * Generate an expired token for testing expiry validation
   */
  generateExpiredToken(user: TestUser): string {
    const jwtServiceExpired = new JwtService({
      secret: this.jwtService["options"].secret,
      signOptions: { expiresIn: "0s" }, // Already expired
    });

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    };

    return jwtServiceExpired.sign(payload);
  }

  /**
   * Verify and decode a token (for testing)
   */
  verifyToken(token: string): any {
    return this.jwtService.verify(token);
  }
}

/**
 * Create a test user for integration tests
 */
export function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return {
    id: overrides?.id || "test-user-id-123",
    email: overrides?.email || "test@example.com",
    name: overrides?.name || "Test User",
  };
}
