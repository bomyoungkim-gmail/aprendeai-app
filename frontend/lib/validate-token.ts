import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp: number;
  sub: string;
  email?: string;
  role?: string;
}

// Fix #6: Cache decoded token to avoid redundant JWT parsing
// Source: Performance optimization best practices
let cachedToken: { raw: string; decoded: DecodedToken } | null = null;

/**
 * Get decoded token from cache or decode if not cached
 * @param token - JWT token string
 * @returns Decoded token object
 */
function getDecodedToken(token: string): DecodedToken {
  // Return from cache if same token
  if (cachedToken?.raw === token) {
    return cachedToken.decoded;
  }
  
  // Decode and cache
  const decoded = jwtDecode<DecodedToken>(token);
  cachedToken = { raw: token, decoded };
  return decoded;
}

/**
 * Check if a JWT token is valid and not expired
 * @param token - JWT token string
 * @param bufferSeconds - Number of seconds before expiry to consider token invalid (default: 60)
 * @returns true if token is valid and not expired
 */
export function isTokenValid(token: string | null, bufferSeconds: number = 60): boolean {
  if (!token) return false;

  try {
    const decoded = getDecodedToken(token); // Use cached version
    const now = Date.now() / 1000; // Current time in seconds
    
    // Token is valid if it expires more than bufferSeconds from now
    return decoded.exp > now + bufferSeconds;
  } catch (error) {
    // Token is malformed or invalid
    cachedToken = null; // Clear cache on error
    return false;
  }
}

/**
 * Get time until token expires in seconds
 * @param token - JWT token string
 * @returns seconds until expiry, or 0 if invalid/expired
 */
export function getTokenExpiryTime(token: string | null): number {
  if (!token) return 0;

  try {
    const decoded = getDecodedToken(token); // Use cached version
    const now = Date.now() / 1000;
    const timeUntilExpiry = decoded.exp - now;
    
    return Math.max(0, timeUntilExpiry);
  } catch (error) {
    cachedToken = null; // Clear cache on error
    return 0;
  }
}

/**
 * Check if token should be refreshed proactively
 * Tokens should be refreshed when they have less than 5 minutes remaining
 * @param token - JWT token string
 * @returns true if token should be refreshed
 */
export function shouldRefreshToken(token: string | null): boolean {
  const REFRESH_THRESHOLD = 5 * 60; // 5 minutes in seconds
  return !isTokenValid(token, REFRESH_THRESHOLD);
}
