import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Portfolio, StockHolding, OptionHolding } from "@shared/schema";
import type { RiskMetrics, Suggestion } from "@/lib/types";

export function usePortfolio(portfolioId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Portfolio queries
  const portfolio = useQuery<Portfolio>({
    queryKey: [`/api/portfolio-details-simple?portfolioId=${portfolioId}`],
  });

  const stockHoldings = useQuery<StockHolding[]>({
    queryKey: [`/api/portfolio-stocks-simple?portfolioId=${portfolioId}`],
  });

  const optionHoldings = useQuery<OptionHolding[]>({
    queryKey: [`/api/portfolio-options-simple?portfolioId=${portfolioId}`],
  });

  const riskMetrics = useQuery<RiskMetrics>({
    queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`],
  });

  const suggestions = useQuery<Suggestion[]>({
    queryKey: [`/api/portfolio-suggestions-simple?portfolioId=${portfolioId}`],
  });

  // Mutations
  const updatePortfolio = useMutation({
    mutationFn: async (updates: Partial<Portfolio>) => {
      const response = await apiRequest("PUT", `/api/portfolio-details-simple`, { ...updates, portfolioId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-details-simple?portfolioId=${portfolioId}`] });
      toast({
        title: "更新成功",
        description: "投资组合信息已更新",
      });
    },
    onError: () => {
      toast({
        title: "更新失败",
        description: "无法更新投资组合信息",
        variant: "destructive",
      });
    },
  });

  const addStockHolding = useMutation({
    mutationFn: async (holding: Omit<StockHolding, "id" | "createdAt" | "updatedAt">) => {
      const response = await apiRequest("POST", `/api/portfolio-stocks-simple`, { ...holding, portfolioId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-stocks-simple?portfolioId=${portfolioId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`] });
      toast({
        title: "添加成功",
        description: "股票持仓已添加",
      });
    },
    onError: () => {
      toast({
        title: "添加失败",
        description: "无法添加股票持仓",
        variant: "destructive",
      });
    },
  });

  const updateStockHolding = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<StockHolding> }) => {
      const response = await apiRequest("PUT", `/api/stocks/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-stocks-simple?portfolioId=${portfolioId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`] });
      toast({
        title: "更新成功",
        description: "股票持仓已更新",
      });
    },
    onError: () => {
      toast({
        title: "更新失败",
        description: "无法更新股票持仓",
        variant: "destructive",
      });
    },
  });

  const deleteStockHolding = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/stocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-stocks-simple?portfolioId=${portfolioId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`] });
      toast({
        title: "删除成功",
        description: "股票持仓已删除",
      });
    },
    onError: () => {
      toast({
        title: "删除失败",
        description: "无法删除股票持仓",
        variant: "destructive",
      });
    },
  });

  const addOptionHolding = useMutation({
    mutationFn: async (holding: Omit<OptionHolding, "id" | "createdAt" | "updatedAt">) => {
      const response = await apiRequest("POST", `/api/portfolio-options-simple`, { ...holding, portfolioId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-options-simple?portfolioId=${portfolioId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`] });
      toast({
        title: "添加成功",
        description: "期权持仓已添加",
      });
    },
    onError: () => {
      toast({
        title: "添加失败",
        description: "无法添加期权持仓",
        variant: "destructive",
      });
    },
  });

  const updateOptionHolding = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<OptionHolding> }) => {
      const response = await apiRequest("PUT", `/api/options/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-options-simple?portfolioId=${portfolioId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`] });
      toast({
        title: "更新成功",
        description: "期权持仓已更新",
      });
    },
    onError: () => {
      toast({
        title: "更新失败",
        description: "无法更新期权持仓",
        variant: "destructive",
      });
    },
  });

  const deleteOptionHolding = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/options/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-options-simple?portfolioId=${portfolioId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`] });
      toast({
        title: "删除成功",
        description: "期权持仓已删除",
      });
    },
    onError: () => {
      toast({
        title: "删除失败",
        description: "无法删除期权持仓",
        variant: "destructive",
      });
    },
  });

  const refreshData = async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-details-simple?portfolioId=${portfolioId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-stocks-simple?portfolioId=${portfolioId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-options-simple?portfolioId=${portfolioId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`] }),
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-suggestions-simple?portfolioId=${portfolioId}`] }),
      ]);
      
      toast({
        title: "数据已更新",
        description: "所有数据已重新加载",
      });
    } catch (error) {
      toast({
        title: "更新失败",
        description: "无法刷新数据，请稍后重试",
        variant: "destructive",
      });
    }
  };

  return {
    // Data
    portfolio: portfolio.data,
    stockHoldings: stockHoldings.data || [],
    optionHoldings: optionHoldings.data || [],
    riskMetrics: riskMetrics.data,
    suggestions: suggestions.data || [],

    // Loading states
    isLoading: portfolio.isLoading || stockHoldings.isLoading || optionHoldings.isLoading,
    isRiskLoading: riskMetrics.isLoading,
    isSuggestionsLoading: suggestions.isLoading,

    // Mutations
    updatePortfolio,
    addStockHolding,
    updateStockHolding,
    deleteStockHolding,
    addOptionHolding,
    updateOptionHolding,
    deleteOptionHolding,

    // Actions
    refreshData,
  };
}

export function usePortfolios(userId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const portfolios = useQuery<Portfolio[]>({
    queryKey: [`/api/user-portfolios-simple?userId=${userId}`],
  });

  const createPortfolio = useMutation({
    mutationFn: async (portfolio: Omit<Portfolio, "id" | "createdAt" | "updatedAt">) => {
      const response = await apiRequest("POST", `/api/portfolios`, portfolio);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user-portfolios-simple?userId=${userId}`] });
      toast({
        title: "创建成功",
        description: "新的投资组合已创建",
      });
    },
    onError: () => {
      toast({
        title: "创建失败",
        description: "无法创建投资组合",
        variant: "destructive",
      });
    },
  });

  return {
    portfolios: portfolios.data || [],
    isLoading: portfolios.isLoading,
    createPortfolio,
  };
}
