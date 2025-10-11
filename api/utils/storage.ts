import type { VercelRequest } from '@vercel/node';
import { initializeStorage } from './storage-init.js';
import { StorageInterface } from '../../shared/storage-interface';
import { User } from './auth.js';

/**
 * Get storage adapter based on user authentication
 */
export async function getStorage(user: User | null, req?: VercelRequest): Promise<StorageInterface> {
  return initializeStorage(user?.id, req as any);
}