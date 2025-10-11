import { StorageInterface } from '../../shared/storage-interface';
import { User } from './auth.js';

/**
 * Check if user is authorized to access a portfolio
 */
export function isAuthorizedForPortfolio(
  portfolio: any, 
  userId: string | undefined, 
  portfolioId: string
): boolean {
  // Guest users can access demo portfolio
  if (userId === 'guest-user' && portfolioId === 'demo-portfolio-1') {
    return true;
  }
  // Regular users must own the portfolio
  return portfolio && portfolio.userId === userId;
}

/**
 * Verify portfolio ownership and return portfolio if authorized
 */
export async function verifyPortfolioAccess(
  storage: StorageInterface,
  portfolioId: string,
  user: User,
  req?: any
): Promise<{ portfolio?: any; error?: string; status?: number }> {
  try {
    const portfolio = await storage.getPortfolio(portfolioId, req);
    
    if (!portfolio) {
      return { error: 'Portfolio not found', status: 404 };
    }
    
    if (!isAuthorizedForPortfolio(portfolio, user.id, portfolioId)) {
      return { error: 'Unauthorized', status: 403 };
    }
    
    return { portfolio };
  } catch (error) {
    console.error('Portfolio access verification error:', error);
    return { 
      error: 'Failed to verify portfolio access', 
      status: 500 
    };
  }
}