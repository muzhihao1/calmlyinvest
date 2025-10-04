/**
 * Guest mode storage using browser localStorage
 * This handles storage for guest users without API persistence issues
 */

const GUEST_STOCKS_KEY = 'guest_stocks';
const GUEST_OPTIONS_KEY = 'guest_options';

export interface GuestStock {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  quantity: number;
  costPrice: string;
  currentPrice: string;
  beta: string;
  marketValue: string;
  unrealizedPnl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GuestOption {
  id: string;
  portfolioId: string;
  optionSymbol: string;
  underlyingSymbol: string;
  optionType: 'CALL' | 'PUT';
  direction: 'BUY' | 'SELL';
  contracts: number;
  strikePrice: string;
  expirationDate: string;
  costPrice: string;
  currentPrice: string;
  deltaValue: string;
  createdAt: string;
  updatedAt: string;
}

class GuestStorage {
  private getStocks(): Record<string, GuestStock[]> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(GUEST_STOCKS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading guest stocks from localStorage:', error);
      return {};
    }
  }

  private setStocks(stocks: Record<string, GuestStock[]>) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(GUEST_STOCKS_KEY, JSON.stringify(stocks));
    } catch (error) {
      console.error('Error saving guest stocks to localStorage:', error);
    }
  }

  private getOptions(): Record<string, GuestOption[]> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(GUEST_OPTIONS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading guest options from localStorage:', error);
      return {};
    }
  }

  private setOptions(options: Record<string, GuestOption[]>) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(GUEST_OPTIONS_KEY, JSON.stringify(options));
    } catch (error) {
      console.error('Error saving guest options to localStorage:', error);
    }
  }

  // Stock methods
  getPortfolioStocks(portfolioId: string): GuestStock[] {
    const allStocks = this.getStocks();
    return allStocks[portfolioId] || [];
  }

  addStock(portfolioId: string, stockData: Omit<GuestStock, 'id' | 'createdAt' | 'updatedAt'>): GuestStock {
    const allStocks = this.getStocks();
    
    const newStock: GuestStock = {
      ...stockData,
      id: `stock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portfolioId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!allStocks[portfolioId]) {
      allStocks[portfolioId] = [];
    }
    
    allStocks[portfolioId].push(newStock);
    this.setStocks(allStocks);
    
    return newStock;
  }

  updateStock(portfolioId: string, stockId: string, updates: Partial<GuestStock>): GuestStock | null {
    const allStocks = this.getStocks();
    const portfolioStocks = allStocks[portfolioId] || [];
    
    const stockIndex = portfolioStocks.findIndex(stock => stock.id === stockId);
    if (stockIndex === -1) {
      return null;
    }

    portfolioStocks[stockIndex] = {
      ...portfolioStocks[stockIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    allStocks[portfolioId] = portfolioStocks;
    this.setStocks(allStocks);
    
    return portfolioStocks[stockIndex];
  }

  deleteStock(portfolioId: string, stockId: string): boolean {
    const allStocks = this.getStocks();
    const portfolioStocks = allStocks[portfolioId] || [];
    
    const stockIndex = portfolioStocks.findIndex(stock => stock.id === stockId);
    if (stockIndex === -1) {
      return false;
    }

    portfolioStocks.splice(stockIndex, 1);
    allStocks[portfolioId] = portfolioStocks;
    this.setStocks(allStocks);
    
    return true;
  }

  // Option methods
  getPortfolioOptions(portfolioId: string): GuestOption[] {
    const allOptions = this.getOptions();
    return allOptions[portfolioId] || [];
  }

  addOption(portfolioId: string, optionData: Omit<GuestOption, 'id' | 'createdAt' | 'updatedAt'>): GuestOption {
    const allOptions = this.getOptions();
    
    const newOption: GuestOption = {
      ...optionData,
      id: `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portfolioId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!allOptions[portfolioId]) {
      allOptions[portfolioId] = [];
    }
    
    allOptions[portfolioId].push(newOption);
    this.setOptions(allOptions);
    
    return newOption;
  }

  updateOption(portfolioId: string, optionId: string, updates: Partial<GuestOption>): GuestOption | null {
    const allOptions = this.getOptions();
    const portfolioOptions = allOptions[portfolioId] || [];
    
    const optionIndex = portfolioOptions.findIndex(option => option.id === optionId);
    if (optionIndex === -1) {
      return null;
    }

    portfolioOptions[optionIndex] = {
      ...portfolioOptions[optionIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    allOptions[portfolioId] = portfolioOptions;
    this.setOptions(allOptions);
    
    return portfolioOptions[optionIndex];
  }

  deleteOption(portfolioId: string, optionId: string): boolean {
    const allOptions = this.getOptions();
    const portfolioOptions = allOptions[portfolioId] || [];
    
    const optionIndex = portfolioOptions.findIndex(option => option.id === optionId);
    if (optionIndex === -1) {
      return false;
    }

    portfolioOptions.splice(optionIndex, 1);
    allOptions[portfolioId] = portfolioOptions;
    this.setOptions(allOptions);
    
    return true;
  }

  // Utility methods
  clearAllData() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(GUEST_STOCKS_KEY);
    localStorage.removeItem(GUEST_OPTIONS_KEY);
  }

  exportData() {
    return {
      stocks: this.getStocks(),
      options: this.getOptions()
    };
  }
}

export const guestStorage = new GuestStorage();