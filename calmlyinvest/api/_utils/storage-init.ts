import { SupabaseStorage } from '../../server/supabase-storage.js';
import { StorageInterface } from '../../shared/storage-interface.js';
import { guestStorage } from '../../server/storage-guest.js';

// Helper to convert dates to strings in objects
function convertDatesToStrings(obj: any): any {
  if (!obj) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(convertDatesToStrings);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertDatesToStrings(obj[key]);
    }
    return result;
  }
  return obj;
}

// Wrapper to convert Supabase date types to strings
class SupabaseStorageAdapter implements StorageInterface {
  constructor(private storage: SupabaseStorage) {}

  async getPortfolios(userId: string, req?: any) {
    const result = await this.storage.getPortfolios(userId);
    return convertDatesToStrings(result);
  }

  async getPortfolio(id: string, req?: any) {
    const result = await this.storage.getPortfolio(id);
    return convertDatesToStrings(result);
  }

  async createPortfolio(data: any, req?: any) {
    const result = await this.storage.createPortfolio(data);
    return convertDatesToStrings(result);
  }

  async updatePortfolio(id: string, data: any, req?: any) {
    const result = await this.storage.updatePortfolio(id, data);
    return convertDatesToStrings(result);
  }

  async deletePortfolio(id: string, req?: any): Promise<void> {
    await this.storage.deletePortfolio(id);
  }

  async getStockHoldings(portfolioId: string, req?: any) {
    const result = await this.storage.getStockHoldings(portfolioId);
    return convertDatesToStrings(result);
  }

  async createStockHolding(data: any, req?: any) {
    const result = await this.storage.createStockHolding(data);
    return convertDatesToStrings(result);
  }

  async updateStockHolding(id: string, data: any, req?: any) {
    const result = await this.storage.updateStockHolding(id, data);
    return convertDatesToStrings(result);
  }

  async deleteStockHolding(id: string, req?: any): Promise<void> {
    await this.storage.deleteStockHolding(id);
  }

  async getOptionHoldings(portfolioId: string, req?: any) {
    const result = await this.storage.getOptionHoldings(portfolioId);
    return convertDatesToStrings(result);
  }

  async createOptionHolding(data: any, req?: any) {
    const result = await this.storage.createOptionHolding(data);
    return convertDatesToStrings(result);
  }

  async updateOptionHolding(id: string, data: any, req?: any) {
    const result = await this.storage.updateOptionHolding(id, data);
    return convertDatesToStrings(result);
  }

  async deleteOptionHolding(id: string, req?: any): Promise<void> {
    await this.storage.deleteOptionHolding(id);
  }

  async getRiskSettings(userId: string, req?: any) {
    const result = await this.storage.getRiskSettings(userId);
    return convertDatesToStrings(result);
  }

  async updateRiskSettings(userId: string, data: any, req?: any) {
    const result = await this.storage.updateRiskSettings(userId, data);
    return convertDatesToStrings(result);
  }

  async getRiskMetrics(portfolioId: string, req?: any) {
    const result = await this.storage.getRiskMetrics(portfolioId);
    if (!result) {
      return undefined;
    }
    return convertDatesToStrings(result);
  }

  async createRiskMetrics(data: any, req?: any) {
    const result = await this.storage.createRiskMetrics(data);
    return convertDatesToStrings(result);
  }
}

// Cache storage instances to avoid re-initialization
const storageCache = new Map<string, StorageInterface>();

/**
 * Initialize storage based on user authentication
 */
export async function initializeStorage(userId?: string, req?: any): Promise<StorageInterface> {
  // Use guest storage for guest users
  if (!userId || userId === 'guest-user') {
    return guestStorage;
  }
  
  // Check cache
  const cacheKey = userId || 'guest';
  if (storageCache.has(cacheKey)) {
    return storageCache.get(cacheKey)!;
  }
  
  // Initialize Supabase storage for authenticated users
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !serviceKey) {
    console.warn('Missing Supabase configuration. Using guest storage.');
    return guestStorage;
  }
  
  const supabaseStorage = new SupabaseStorage(supabaseUrl, serviceKey);
  const storage = new SupabaseStorageAdapter(supabaseStorage);
  storageCache.set(cacheKey, storage);
  
  return storage;
}