/**
 * Safe token extraction from Authorization header
 * Handles various JWT token format issues
 */

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    console.log('[Token Parser] No Authorization header provided');
    return null;
  }

  // Log raw header for debugging (mask middle part for security)
  const maskedHeader = authHeader.length > 20
    ? `${authHeader.substring(0, 10)}...${authHeader.substring(authHeader.length - 10)}`
    : authHeader;
  console.log(`[Token Parser] Raw Authorization header: ${maskedHeader}`);

  // Normalize: trim whitespace and handle case sensitivity
  const normalized = authHeader.trim();

  // Check if it starts with "Bearer "
  if (!normalized.startsWith('Bearer ')) {
    console.error(`[Token Parser] Header doesn't start with "Bearer ", got: ${normalized.substring(0, 20)}`);
    return null;
  }

  // Extract token (everything after "Bearer ")
  const token = normalized.substring(7); // 'Bearer '.length === 7

  if (!token || token.length === 0) {
    console.error('[Token Parser] Token is empty after extraction');
    return null;
  }

  // JWT should have exactly 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error(`[Token Parser] Invalid JWT format: expected 3 parts, got ${parts.length}`);
    console.error(`[Token Parser] Token parts lengths: ${parts.map(p => p.length).join(', ')}`);
    return null;
  }

  // Each part should be base64url encoded (non-empty)
  if (parts.some(part => part.length === 0)) {
    console.error('[Token Parser] JWT contains empty parts');
    return null;
  }

  // Log token validity (mask the token for security)
  const maskedToken = `${token.substring(0, 20)}...${token.substring(token.length - 20)}`;
  console.log(`[Token Parser] Valid JWT extracted: ${maskedToken} (${token.length} chars, 3 parts)`);

  return token;
}

/**
 * Validate token format without calling Supabase
 */
export function isValidJwtFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  return parts.every(part => part.length > 0);
}
