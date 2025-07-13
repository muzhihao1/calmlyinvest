import { logger } from './logger';

/**
 * Retry utility for Supabase API calls
 * Handles network errors and timeouts with exponential backoff
 */
export async function retrySupabaseCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a network/timeout error
      const isNetworkError = 
        error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('Network request failed');
      
      // Only retry on network errors
      if (!isNetworkError || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, i) + Math.random() * 1000;
      logger.warn(`Supabase call failed, retrying in ${Math.round(delay)}ms... (attempt ${i + 1}/${maxRetries})`, {
        error: error.message,
        code: error.code
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Failed after retries');
}

/**
 * Wrapper for fetch with timeout
 */
export function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));
}