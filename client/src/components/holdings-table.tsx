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
import { Edit, Trash2, FileUp, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EditHoldingDialog } from "./edit-holding-dialog";
import type { StockHolding } from "@shared/schema-types";

interface HoldingsTableProps {
  holdings: StockHolding[];
  portfolioId: string;
  isGuest?: boolean;
}

type SortColumn = 'symbol' | 'quantity' | 'costPrice' | 'currentPrice' | 'beta' | 'marketValue' | 'pnl' | 'concentration';
type SortDirection = 'asc' | 'desc';

export function HoldingsTable({ holdings, portfolioId, isGuest = false }: HoldingsTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingHolding, setEditingHolding] = useState<StockHolding | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Delete from localStorage for guest mode
  const deleteFromLocalStorage = (id: string) => {
    try {
      const stored = localStorage.getItem('guest_stocks');
      const allStocks = stored ? JSON.parse(stored) : {};

      if (allStocks[portfolioId]) {
        allStocks[portfolioId] = allStocks[portfolioId].filter((stock: StockHolding) => stock.id !== id);
        localStorage.setItem('guest_stocks', JSON.stringify(allStocks));

        // Dispatch custom event to notify dashboard
        window.dispatchEvent(new CustomEvent('guestStocksUpdated', {
          detail: { portfolioId, stocks: allStocks[portfolioId] }
        }));

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting stock from localStorage:', error);
      return false;
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isGuest) {
        // Guest mode: delete from localStorage
        const success = deleteFromLocalStorage(id);
        if (!success) {
          throw new Error('Failed to delete from localStorage');
        }
        return;
      } else {
        // Authenticated mode: call API
        await apiRequest("DELETE", `/api/stocks/${id}`);
      }
    },
    onSuccess: () => {
      if (!isGuest) {
        // Invalidate all portfolio-related queries to ensure UI updates immediately
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-stocks-simple`] });
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-details-simple`] });
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio-risk-simple`] });
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/stocks`] });
        queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/risk`] });
      }
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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedHoldings = [...holdings].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: number = 0;
    let bValue: number = 0;

    switch (sortColumn) {
      case 'symbol':
        return sortDirection === 'asc' 
          ? a.symbol.localeCompare(b.symbol)
          : b.symbol.localeCompare(a.symbol);
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case 'costPrice':
        aValue = parseFloat(a.costPrice);
        bValue = parseFloat(b.costPrice);
        break;
      case 'currentPrice':
        aValue = parseFloat(a.currentPrice || '0');
        bValue = parseFloat(b.currentPrice || '0');
        break;
      case 'beta':
        aValue = parseFloat(a.beta || '1.0');
        bValue = parseFloat(b.beta || '1.0');
        break;
      case 'marketValue':
        aValue = a.quantity * parseFloat(a.currentPrice || '0');
        bValue = b.quantity * parseFloat(b.currentPrice || '0');
        break;
      case 'pnl':
        const aPnL = calculatePnL(a);
        const bPnL = calculatePnL(b);
        aValue = aPnL.absolute;
        bValue = bPnL.absolute;
        break;
      case 'concentration':
        aValue = calculateConcentration(a);
        bValue = calculateConcentration(b);
        break;
    }

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
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
    <>
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
                <TableHead 
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center">
                    股票代码
                    <SortIcon column="symbol" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    持仓数量
                    <SortIcon column="quantity" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('costPrice')}
                >
                  <div className="flex items-center">
                    成本价
                    <SortIcon column="costPrice" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('currentPrice')}
                >
                  <div className="flex items-center">
                    当前价
                    <SortIcon column="currentPrice" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('beta')}
                >
                  <div className="flex items-center">
                    Beta值
                    <SortIcon column="beta" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('marketValue')}
                >
                  <div className="flex items-center">
                    市值
                    <SortIcon column="marketValue" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center">
                    盈亏
                    <SortIcon column="pnl" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('concentration')}
                >
                  <div className="flex items-center">
                    集中度
                    <SortIcon column="concentration" />
                  </div>
                </TableHead>
                <TableHead className="text-gray-400">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHoldings.map((holding) => {
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
                    <TableCell className="text-white">{parseFloat(holding.beta || "1.0").toFixed(2)}</TableCell>
                    <TableCell className="text-white">${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <span className={pnl.isPositive ? "text-green-500" : "text-red-500"}>
                        {pnl.isPositive ? "+" : ""}${pnl.absolute.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pnl.isPositive ? "+" : ""}{pnl.percentage.toFixed(2)}%)
                      </span>
                    </TableCell>
                    <TableCell>
                      {getConcentrationBadge(concentration)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-blue-400"
                          onClick={() => {
                            setEditingHolding(holding);
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
      
      <EditHoldingDialog 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        holding={editingHolding}
        portfolioId={portfolioId}
      />
    </>
  );
}
