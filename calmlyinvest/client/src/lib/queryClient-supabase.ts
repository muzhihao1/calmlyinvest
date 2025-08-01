import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from './supabase';
import { guestStorage } from './guest-storage';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to create mock response
function createMockResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper function to extract portfolio ID from URL
function extractPortfolioId(url: string): string | null {
  const match = url.match(/portfolioId=([^&]+)/) || url.match(/portfolio\/([^\/\?]+)/);
  return match ? match[1] : null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  isGuestMode?: boolean,
): Promise<Response> {
  // 获取Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {};
  
  // Check if in guest mode - if explicitly passed or user is guest-user or demo portfolio
  const guestMode = isGuestMode || url.includes('guest-user') || url.includes('demo-portfolio');
  
  // Handle guest mode requests with localStorage
  if (guestMode) {
    // Handle stock-related requests for guest mode
    if (url.includes('portfolio-stocks-simple')) {
      const portfolioId = extractPortfolioId(url) || 'demo-portfolio-1';
      
      if (method === 'GET') {
        const stocks = guestStorage.getPortfolioStocks(portfolioId);
        return createMockResponse(stocks);
      } else if (method === 'POST' && data) {
        const stockData = data as any;
        
        // Get stock quote data first
        try {
          const quoteResponse = await fetch(`/api/stock-quote-simple?symbol=${stockData.symbol}`);
          const quote = await quoteResponse.json();
          
          // Merge quote data with stock data
          stockData.currentPrice = quote.price?.toFixed(2) || stockData.costPrice;
          stockData.beta = (quote.beta || 1.0).toString();
          stockData.name = quote.name || stockData.symbol;
        } catch (error) {
          // Use fallback values if quote API fails
          stockData.currentPrice = stockData.costPrice;
          stockData.beta = "1.0";
          stockData.name = stockData.symbol;
        }

        // Calculate market value and PnL
        const quantity = parseFloat(stockData.quantity);
        const currentPrice = parseFloat(stockData.currentPrice);
        const costPrice = parseFloat(stockData.costPrice);
        
        const newStock = guestStorage.addStock(portfolioId, {
          portfolioId,
          symbol: stockData.symbol,
          name: stockData.name,
          quantity: stockData.quantity,
          costPrice: stockData.costPrice,
          currentPrice: stockData.currentPrice,
          beta: stockData.beta,
          marketValue: (quantity * currentPrice).toFixed(2),
          unrealizedPnl: ((currentPrice - costPrice) * quantity).toFixed(2)
        });
        
        return createMockResponse(newStock, 201);
      }
    }
    
    // Handle option-related requests for guest mode
    if (url.includes('portfolio-options-simple')) {
      const portfolioId = extractPortfolioId(url) || 'demo-portfolio-1';
      
      if (method === 'GET') {
        const options = guestStorage.getPortfolioOptions(portfolioId);
        return createMockResponse(options);
      } else if (method === 'POST' && data) {
        const optionData = data as any;
        
        const newOption = guestStorage.addOption(portfolioId, {
          portfolioId,
          optionSymbol: optionData.optionSymbol,
          underlyingSymbol: optionData.underlyingSymbol,
          optionType: optionData.optionType,
          direction: optionData.direction,
          contracts: optionData.contracts,
          strikePrice: optionData.strikePrice,
          expirationDate: optionData.expirationDate,
          costPrice: optionData.costPrice,
          currentPrice: optionData.currentPrice || optionData.costPrice,
          deltaValue: optionData.deltaValue
        });
        
        return createMockResponse(newOption, 201);
      }
    }
    
    // For other guest mode requests, set guest headers and continue
    headers["Authorization"] = "Bearer guest-mode";
  } else if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  } else {
    // No session and not guest mode - default to guest mode
    headers["Authorization"] = "Bearer guest-mode";
  }
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {};
    const url = queryKey[0] as string;
    
    // Check if in guest mode - if URL contains guest-user or demo portfolio
    const isGuestMode = url.includes('guest-user') || url.includes('demo-portfolio');
    
    // Handle guest mode requests with localStorage
    if (isGuestMode) {
      // Handle stock-related requests for guest mode
      if (url.includes('portfolio-stocks-simple')) {
        const portfolioId = extractPortfolioId(url) || 'demo-portfolio-1';
        const stocks = guestStorage.getPortfolioStocks(portfolioId);
        return stocks as T;
      }
      
      // Handle option-related requests for guest mode
      if (url.includes('portfolio-options-simple')) {
        const portfolioId = extractPortfolioId(url) || 'demo-portfolio-1';
        const options = guestStorage.getPortfolioOptions(portfolioId);
        return options as T;
      }
      
      // For other guest mode requests, set headers and continue
      headers["Authorization"] = "Bearer guest-mode";
    } else if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else {
      // No session and not guest mode - default to guest mode
      headers["Authorization"] = "Bearer guest-mode";
      
      // If no session, also handle as guest mode for stocks/options
      if (url.includes('portfolio-stocks-simple')) {
        const portfolioId = extractPortfolioId(url) || 'demo-portfolio-1';
        const stocks = guestStorage.getPortfolioStocks(portfolioId);
        return stocks as T;
      }
      
      if (url.includes('portfolio-options-simple')) {
        const portfolioId = extractPortfolioId(url) || 'demo-portfolio-1';
        const options = guestStorage.getPortfolioOptions(portfolioId);
        return options as T;
      }
    }
    
    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});