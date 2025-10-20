import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Clock, Repeat } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { EditOptionDialog } from "./edit-option-dialog";
import { RolloverOptionDialog } from "./rollover-option-dialog";
import type { OptionHolding } from "@shared/schema-supabase";

interface OptionsTableProps {
  holdings: OptionHolding[];
  portfolioId: string;
}

export function OptionsTable({ holdings, portfolioId }: OptionsTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isGuest } = useAuth();
  const [editingOption, setEditingOption] = useState<OptionHolding | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rolloverOption, setRolloverOption] = useState<OptionHolding | null>(null);
  const [rolloverDialogOpen, setRolloverDialogOpen] = useState(false);

  // Helper function to delete option from localStorage for guest mode
  const deleteOptionFromLocalStorage = (optionId: string) => {
    try {
      const stored = localStorage.getItem('guest_options');
      const allOptions = stored ? JSON.parse(stored) : {};
      
      if (allOptions[portfolioId]) {
        allOptions[portfolioId] = allOptions[portfolioId].filter((option: OptionHolding) => option.id !== optionId);
        localStorage.setItem('guest_options', JSON.stringify(allOptions));
      }
    } catch (error) {
      console.error('Error deleting option from localStorage:', error);
      throw error;
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) {
        // Guest mode: delete from localStorage
        deleteOptionFromLocalStorage(id);
      } else {
        // Authenticated mode: call API
        await apiRequest("DELETE", `/api/options/${id}`);
      }
    },
    // Optimistic update: immediately remove from UI before server responds
    onMutate: async (deletedId) => {
      if (isGuest) return;

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: [`/api/portfolio-options-simple?portfolioId=${portfolioId}`] });

      // Snapshot the previous value for rollback on error
      const previousOptions = queryClient.getQueryData([`/api/portfolio-options-simple?portfolioId=${portfolioId}`]);

      // Optimistically update by removing the deleted option
      queryClient.setQueryData(
        [`/api/portfolio-options-simple?portfolioId=${portfolioId}`],
        (old: any) => {
          if (!old?.options) return old;
          return {
            ...old,
            options: old.options.filter((option: OptionHolding) => option.id !== deletedId)
          };
        }
      );

      return { previousOptions };
    },
    onSuccess: () => {
      if (isGuest) {
        // Guest mode: trigger page refresh
        window.dispatchEvent(new CustomEvent('guestOptionsUpdated'));
      } else {
        // Invalidate queries to refetch fresh data from server (but UI already updated via optimistic update)
        // Only invalidate essential queries to minimize refetch overhead
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-options-simple?portfolioId=${portfolioId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-details-simple?portfolioId=${portfolioId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple?portfolioId=${portfolioId}`] });
      }

      toast({
        title: "删除成功",
        description: "期权持仓已删除",
      });
    },
    onError: (_error, _deletedId, context) => {
      // Rollback optimistic update on error
      if (context?.previousOptions && !isGuest) {
        queryClient.setQueryData(
          [`/api/portfolio-options-simple?portfolioId=${portfolioId}`],
          context.previousOptions
        );
      }

      toast({
        title: "删除失败",
        description: "无法删除期权持仓，请稍后重试",
        variant: "destructive",
      });
    }
  });

  const calculateDaysToExpiration = (expirationDate: string) => {
    const expiry = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateMaxRisk = (holding: OptionHolding) => {
    if (holding.direction === "BUY") {
      // Buy options: max loss is premium paid
      return Math.abs(holding.contracts) * parseFloat(holding.costPrice) * 100;
    } else {
      // Sell options: calculate based on type
      if (holding.optionType === "PUT") {
        // Sell put: max loss = (strike - premium) * contracts * 100
        const maxLoss = (parseFloat(holding.strikePrice) - parseFloat(holding.costPrice)) * Math.abs(holding.contracts) * 100;
        return Math.max(maxLoss, 0);
      } else {
        // Sell call: unlimited risk, estimate as 3x strike price
        return parseFloat(holding.strikePrice) * 3 * Math.abs(holding.contracts) * 100;
      }
    }
  };

  const getOptionTypeBadge = (optionType: string, direction: string) => {
    const type = `${direction === "BUY" ? "买入" : "卖出"}${optionType === "CALL" ? "看涨" : "看跌"}`;
    const variant = direction === "SELL" ? "destructive" : "default";
    return <Badge variant={variant}>{type}</Badge>;
  };

  const getDaysToExpirationBadge = (days: number) => {
    if (days <= 7) {
      return <Badge variant="destructive" className="flex items-center"><Clock className="h-3 w-3 mr-1" />{days}天</Badge>;
    } else if (days <= 30) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">{days}天</Badge>;
    } else {
      return <Badge variant="outline" className="border-green-500 text-green-500">{days}天</Badge>;
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">⚙️</span>
            期权持仓
          </h3>
        </div>
        <div className="p-6 text-center text-gray-400">
          <p>暂无期权持仓</p>
          <p className="text-sm mt-2">点击"添加期权持仓"开始期权交易</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800 rounded-xl border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">⚙️</span>
            期权持仓
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-400">期权代码</TableHead>
              <TableHead className="text-gray-400">类型</TableHead>
              <TableHead className="text-gray-400">合约数</TableHead>
              <TableHead className="text-gray-400">成本价</TableHead>
              <TableHead className="text-gray-400">当前价</TableHead>
              <TableHead className="text-gray-400">执行价</TableHead>
              <TableHead className="text-gray-400">到期日</TableHead>
              <TableHead className="text-gray-400">Delta</TableHead>
              <TableHead className="text-gray-400">未实现盈亏（总）</TableHead>
              <TableHead className="text-gray-400">最大风险</TableHead>
              <TableHead className="text-gray-400">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              const daysToExpiration = calculateDaysToExpiration(holding.expirationDate.toString());
              const maxRisk = calculateMaxRisk(holding);
              const expirationDate = new Date(holding.expirationDate).toLocaleDateString('zh-CN');
              const costPrice = parseFloat(holding.costPrice);
              const currentPrice = parseFloat(holding.currentPrice || holding.costPrice);
              const priceChange = currentPrice - costPrice;
              const priceChangePercent = costPrice > 0 ? (priceChange / costPrice) * 100 : 0;
              const isPriceUp = priceChange > 0;

              // Calculate unrealized P&L: (current - cost) × contracts × 100 × direction
              const directionMultiplier = holding.direction === "BUY" ? 1 : -1;
              const unrealizedPL = priceChange * Math.abs(holding.contracts) * 100 * directionMultiplier;
              const isProfitable = unrealizedPL > 0;

              return (
                <TableRow key={holding.id} className="border-gray-700 hover:bg-slate-700/50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{holding.optionSymbol}</div>
                      <div className="text-sm text-gray-400">{holding.underlyingSymbol}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getOptionTypeBadge(holding.optionType, holding.direction)}
                  </TableCell>
                  <TableCell className="text-white">{holding.contracts}</TableCell>
                  <TableCell className="text-gray-400">${costPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    <div>
                      <div className={isPriceUp ? "text-green-500 font-semibold" : priceChange < 0 ? "text-red-500 font-semibold" : "text-white"}>
                        ${currentPrice.toFixed(2)}
                      </div>
                      {priceChange !== 0 && (
                        <div className={`text-xs ${isPriceUp ? "text-green-500" : "text-red-500"}`}>
                          {isPriceUp ? "+" : ""}{priceChangePercent.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">${parseFloat(holding.strikePrice).toFixed(2)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-white">{expirationDate}</div>
                      {getDaysToExpirationBadge(daysToExpiration)}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">{holding.deltaValue}</TableCell>
                  <TableCell>
                    <div className={`font-semibold ${isProfitable ? "text-green-500" : unrealizedPL < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {isProfitable ? "+" : ""}{unrealizedPL >= 0 ? "$" : "-$"}{Math.abs(unrealizedPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </TableCell>
                  <TableCell className="text-red-500 font-semibold">
                    ${maxRisk.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-500 hover:text-green-400"
                        onClick={() => {
                          setRolloverOption(holding);
                          setRolloverDialogOpen(true);
                        }}
                        title="Rollover 期权"
                      >
                        <Repeat className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-blue-400"
                        onClick={() => {
                          setEditingOption(holding);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-400"
                        onClick={() => deleteMutation.mutate(holding.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>
      
      <EditOptionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        option={editingOption}
        portfolioId={portfolioId}
      />

      <RolloverOptionDialog
        open={rolloverDialogOpen}
        onOpenChange={setRolloverDialogOpen}
        option={rolloverOption}
        portfolioId={portfolioId}
      />
    </>
  );
}
