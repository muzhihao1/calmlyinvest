/**
 * User ID mapping between Supabase UUID and memory storage numeric IDs
 * This is a temporary solution for development mode
 */

// Map Supabase UUID to memory storage user ID
const userIdMap = new Map<string, number>([
  // Your account
  ['8e82d664-5ef9-47c1-a540-9af664860a7c', 2],
  // Guest/test account
  ['guest', 1]
]);

// Reverse map for numeric ID to UUID
const reverseMap = new Map<number, string>([
  [2, '8e82d664-5ef9-47c1-a540-9af664860a7c'],
  [1, 'guest']
]);

export function getNumericUserId(uuidOrString: string): number | null {
  // If it's already a number, return it
  const numId = parseInt(uuidOrString);
  if (!isNaN(numId)) {
    return numId;
  }
  
  // Otherwise look up in map
  return userIdMap.get(uuidOrString) || null;
}

export function getUuidUserId(numericId: number): string | null {
  return reverseMap.get(numericId) || null;
}

export function isValidUserId(userId: string | number): boolean {
  if (typeof userId === 'number') {
    return reverseMap.has(userId);
  }
  return userIdMap.has(userId) || !isNaN(parseInt(userId));
}