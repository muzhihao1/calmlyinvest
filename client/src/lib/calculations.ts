import type { StockHolding, OptionHolding, Portfolio } from "@shared/schema";

export interface RiskCalculationResult {
  leverageRatio: number;
  portfolioBeta: number;
  maxConcentration: number;
  marginUsageRatio: number;
  riskLevel: "GREEN" | "YELLOW" | "RED";
  stockValue: number;
  optionMaxLoss: number;
  totalEquity: number;
  remainingLiquidity: number;
}

export class RiskCalculator {
  constructor(
    private portfolio: Portfolio,
    private stockHoldings: StockHolding[],
    private optionHoldings: OptionHolding[]
  ) {}

  calculate(): RiskCalculationResult {
    const stockValue = this.calculateStockValue();
    const optionMaxLoss = this.calculateOptionMaxLoss();
    const totalEquity = parseFloat(this.portfolio.totalEquity || "0");
    const marginUsed = parseFloat(this.portfolio.marginUsed || "0");

    const leverageRatio = totalEquity > 0 ? (stockValue + optionMaxLoss) / totalEquity : 0;
    const portfolioBeta = this.calculatePortfolioBeta();
    const maxConcentration = this.calculateMaxConcentration();
    const marginUsageRatio = totalEquity > 0 ? (marginUsed / totalEquity) * 100 : 0;
    const remainingLiquidity = totalEquity > 0 ? ((totalEquity - marginUsed) / totalEquity) * 100 : 0;

    const riskLevel = this.determineRiskLevel(leverageRatio, maxConcentration, remainingLiquidity);

    return {
      leverageRatio,
      portfolioBeta,
      maxConcentration,
      marginUsageRatio,
      riskLevel,
      stockValue,
      optionMaxLoss,
      totalEquity,
      remainingLiquidity,
    };
  }

  private calculateStockValue(): number {
    return this.stockHoldings.reduce((sum, holding) => {
      return sum + (holding.quantity * parseFloat(holding.currentPrice || "0"));
    }, 0);
  }

  private calculateOptionMaxLoss(): number {
    return this.optionHoldings.reduce((sum, option) => {
      const maxLoss = this.calculateSingleOptionMaxLoss(option);
      return sum + maxLoss;
    }, 0);
  }

  private calculateSingleOptionMaxLoss(option: OptionHolding): number {
    if (option.direction === "BUY") {
      // Buy options: max loss is premium paid
      return Math.abs(option.contracts) * parseFloat(option.costPrice) * 100;
    } else {
      // Sell options: calculate based on type
      if (option.optionType === "PUT") {
        // Sell put: max loss = (strike - premium) * contracts * 100
        const maxLoss = (parseFloat(option.strikePrice) - parseFloat(option.costPrice)) * Math.abs(option.contracts) * 100;
        return Math.max(maxLoss, 0);
      } else {
        // Sell call: unlimited risk, estimate as 3x current underlying price
        const underlyingPrice = this.getUnderlyingPrice(option.underlyingSymbol);
        const estimatedLoss = underlyingPrice * 3 * Math.abs(option.contracts) * 100;
        return estimatedLoss;
      }
    }
  }

  private getUnderlyingPrice(symbol: string): number {
    const stock = this.stockHoldings.find(s => s.symbol === symbol);
    return parseFloat(stock?.currentPrice || "100"); // Default to $100 if not found
  }

  private calculatePortfolioBeta(): number {
    const totalStockValue = this.calculateStockValue();
    
    if (totalStockValue === 0) return 1.0;

    return this.stockHoldings.reduce((weightedBeta, holding) => {
      const weight = (holding.quantity * parseFloat(holding.currentPrice || "0")) / totalStockValue;
      const beta = parseFloat(holding.beta || "1.0");
      return weightedBeta + (weight * beta);
    }, 0);
  }

  private calculateMaxConcentration(): number {
    const totalStockValue = this.calculateStockValue();
    
    if (totalStockValue === 0) return 0;

    return this.stockHoldings.reduce((max, holding) => {
      const value = holding.quantity * parseFloat(holding.currentPrice || "0");
      const concentration = (value / totalStockValue) * 100;
      return Math.max(max, concentration);
    }, 0);
  }

  private determineRiskLevel(
    leverageRatio: number, 
    maxConcentration: number, 
    remainingLiquidity: number
  ): "GREEN" | "YELLOW" | "RED" {
    // High risk conditions
    if (leverageRatio >= 1.5 || maxConcentration >= 20 || remainingLiquidity < 15) {
      return "RED";
    }
    
    // Medium risk conditions
    if (leverageRatio >= 1.0 || maxConcentration >= 10 || remainingLiquidity < 30) {
      return "YELLOW";
    }
    
    // Low risk
    return "GREEN";
  }
}

export function calculatePnL(holding: StockHolding) {
  const costValue = holding.quantity * parseFloat(holding.costPrice);
  const currentValue = holding.quantity * parseFloat(holding.currentPrice || "0");
  const pnl = currentValue - costValue;
  const pnlPercent = costValue > 0 ? (pnl / costValue) * 100 : 0;
  
  return {
    absolute: pnl,
    percentage: pnlPercent,
    isPositive: pnl >= 0
  };
}

export function calculateConcentration(holding: StockHolding, allHoldings: StockHolding[]): number {
  const holdingValue = holding.quantity * parseFloat(holding.currentPrice || "0");
  const totalValue = allHoldings.reduce((sum, h) => 
    sum + (h.quantity * parseFloat(h.currentPrice || "0")), 0
  );
  
  return totalValue > 0 ? (holdingValue / totalValue) * 100 : 0;
}

export function calculateDaysToExpiration(expirationDate: string | Date): number {
  const expiry = new Date(expirationDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateOptionMaxRisk(option: OptionHolding): number {
  if (option.direction === "BUY") {
    // Buy options: max loss is premium paid
    return Math.abs(option.contracts) * parseFloat(option.costPrice) * 100;
  } else {
    // Sell options: calculate based on type
    if (option.optionType === "PUT") {
      // Sell put: max loss = (strike - premium) * contracts * 100
      const maxLoss = (parseFloat(option.strikePrice) - parseFloat(option.costPrice)) * Math.abs(option.contracts) * 100;
      return Math.max(maxLoss, 0);
    } else {
      // Sell call: unlimited risk, estimate as 3x strike price
      return parseFloat(option.strikePrice) * 3 * Math.abs(option.contracts) * 100;
    }
  }
}
