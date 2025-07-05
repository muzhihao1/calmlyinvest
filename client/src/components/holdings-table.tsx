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
import { Edit, Trash2, FileUp, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StockHolding } from "@shared/schema";

interface HoldingsTableProps {
  holdings: StockHolding[];
  portfolioId: number;
}

export function HoldingsTable({ holdings, portfolioId }: HoldingsTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/stocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/stocks`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/risk`] });
      toast({
        title: "删除成功",
        description: "股票持仓已删除",
      });
    },
    onError: () => {
      toast({
        title: "删除失败",
        description: "无法删除持仓，请稍后重试",
        variant: "destructive",
      });
    }
  });

  const calculatePnL = (holding: StockHolding) => {
    const costValue = holding.quantity * parseFloat(holding.costPrice);
    const currentValue = holding.quantity * parseFloat(holding.currentPrice || "0");
    const pnl = currentValue - costValue;
    const pnlPercent = costValue > 0 ? (pnl / costValue) * 100 : 0;
    
    return {
      absolute: pnl,
      percentage: pnlPercent,
      isPositive: pnl >= 0
    };
  };

  const calculateConcentration = (holding: StockHolding) => {
    const holdingValue = holding.quantity * parseFloat(holding.currentPrice || "0");
    const totalValue = holdings.reduce((sum, h) => 
      sum + (h.quantity * parseFloat(h.currentPrice || "0")), 0
    );
    
    return totalValue > 0 ? (holdingValue / totalValue) * 100 : 0;
  };

  const getConcentrationBadge = (concentration: number) => {
    if (concentration >= 20) {
      return <Badge variant="destructive">{concentration.toFixed(1)}%</Badge>;
    } else if (concentration >= 10) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">{concentration.toFixed(1)}%</Badge>;
    } else {
      return <Badge variant="outline" className="border-green-500 text-green-500">{concentration.toFixed(1)}%</Badge>;
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold flex items-center">
            <span className="mr-2">📈</span>
            股票持仓
          </h3>
        </div>
        <div className="p-6 text-center text-gray-400">
          <p>暂无股票持仓</p>
          <p className="text-sm mt-2">点击"添加股票持仓"开始管理您的投资组合</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-gray-700 mb-6">
      <div className="px-6 py-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold flex items-center">
          <span className="mr-2">📈</span>
          股票持仓
        </h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700">
              <TableHead className="text-gray-400">股票代码</TableHead>
              <TableHead className="text-gray-400">持仓数量</TableHead>
              <TableHead className="text-gray-400">成本价</TableHead>
              <TableHead className="text-gray-400">当前价</TableHead>
              <TableHead className="text-gray-400">市值</TableHead>
              <TableHead className="text-gray-400">盈亏</TableHead>
              <TableHead className="text-gray-400">集中度</TableHead>
              <TableHead className="text-gray-400">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.map((holding) => {
              const pnl = calculatePnL(holding);
              const concentration = calculateConcentration(holding);
              const marketValue = holding.quantity * parseFloat(holding.currentPrice || "0");

              return (
                <TableRow key={holding.id} className="border-gray-700 hover:bg-slate-700/50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{holding.symbol}</div>
                      <div className="text-sm text-gray-400">{holding.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">{holding.quantity}</TableCell>
                  <TableCell className="text-white">${parseFloat(holding.costPrice).toFixed(2)}</TableCell>
                  <TableCell className="text-white">${parseFloat(holding.currentPrice || "0").toFixed(2)}</TableCell>
                  <TableCell className="text-white">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</TableCell>
                  <TableCell>
                    <span className={pnl.isPositive ? "text-green-500" : "text-red-500"}>
                      {pnl.isPositive ? "+" : ""}${pnl.absolute.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({pnl.isPositive ? "+" : ""}{pnl.percentage.toFixed(2)}%)
                    </span>
                  </TableCell>
                  <TableCell>
                    {getConcentrationBadge(concentration)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-blue-400">
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
  );
}
