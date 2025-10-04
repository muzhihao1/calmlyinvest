/**
 * Rollover Option Dialog Component
 *
 * Allows users to rollover (close and reopen) an option position
 * Captures realized P&L from the old position and starts fresh tracking for the new one
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { OptionHolding } from "@shared/schema-types";

interface RolloverOptionDialogProps {
  option: OptionHolding | null;
  portfolioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RolloverOptionDialog({
  option,
  portfolioId,
  open,
  onOpenChange,
}: RolloverOptionDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Form state
  const [closePrice, setClosePrice] = useState("");
  const [closeContracts, setCloseContracts] = useState("");
  const [newStrikePrice, setNewStrikePrice] = useState("");
  const [newExpirationDate, setNewExpirationDate] = useState("");
  const [openPrice, setOpenPrice] = useState("");
  const [openContracts, setOpenContracts] = useState("");
  const [fees, setFees] = useState("");
  const [notes, setNotes] = useState("");

  // Auto-generate new option symbol based on inputs
  const generateNewOptionSymbol = () => {
    if (!option || !newStrikePrice || !newExpirationDate) return "";

    const underlying = option.underlyingSymbol;
    const optionType = option.optionType; // 'PUT' or 'CALL'
    const typeCode = optionType === "PUT" ? "P" : "C";

    // Convert date from YYYY-MM-DD to YYMMDD
    const date = new Date(newExpirationDate);
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const dateCode = yy + mm + dd;

    // Format strike price (no decimals for display)
    const strikeCode = Math.round(parseFloat(newStrikePrice)).toString();

    return `${underlying}${dateCode}${typeCode}${strikeCode}`;
  };

  const newOptionSymbol = generateNewOptionSymbol();

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    } else if (option) {
      // Pre-fill contracts with current holding
      setCloseContracts(option.contracts.toString());
      setOpenContracts(option.contracts.toString());
    }
    onOpenChange(newOpen);
  };

  const resetForm = () => {
    setClosePrice("");
    setCloseContracts("");
    setNewStrikePrice("");
    setNewExpirationDate("");
    setOpenPrice("");
    setOpenContracts("");
    setFees("");
    setNotes("");
  };

  // Calculate estimated realized P&L
  const calculateEstimatedPnL = () => {
    if (!option || !closePrice || !closeContracts) return null;

    const costPrice = parseFloat(option.costPrice);
    const closePriceNum = parseFloat(closePrice);
    const contractsNum = parseInt(closeContracts);

    if (isNaN(costPrice) || isNaN(closePriceNum) || isNaN(contractsNum)) return null;

    let pnl: number;
    if (option.direction === "SELL") {
      // Short option: profit when closing at lower price
      pnl = (costPrice - closePriceNum) * contractsNum * 100;
    } else {
      // Long option: profit when closing at higher price
      pnl = (closePriceNum - costPrice) * contractsNum * 100;
    }

    // Subtract fees if provided
    if (fees && !isNaN(parseFloat(fees))) {
      pnl -= parseFloat(fees);
    }

    return pnl;
  };

  const rolloverMutation = useMutation({
    mutationFn: async () => {
      if (!option) throw new Error("No option selected");

      const rolloverData = {
        portfolioId,
        oldOptionId: option.id,
        closePrice: parseFloat(closePrice),
        closeContracts: parseInt(closeContracts),
        newOptionSymbol,
        newStrikePrice: parseFloat(newStrikePrice),
        newExpirationDate,
        openPrice: parseFloat(openPrice),
        openContracts: parseInt(openContracts),
        fees: fees ? parseFloat(fees) : undefined,
        notes: notes || undefined,
        rolloverDate: new Date().toISOString(),
      };

      const response = await apiRequest("POST", "/api/options/rollover", rolloverData);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/options`] });
      queryClient.invalidateQueries({ queryKey: [`/api/portfolio/${portfolioId}/risk`] });
      queryClient.invalidateQueries({ queryKey: ['rollovers', portfolioId] });

      // Safely access realizedPnl
      const realizedPnl = data?.rollover?.realizedPnl || data?.realizedPnl || 0;
      toast({
        title: "Rollover 成功",
        description: `实现盈亏: ${realizedPnl >= 0 ? '+' : ''}$${parseFloat(realizedPnl.toString()).toFixed(2)}`,
      });

      handleOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Rollover error:", error);
      toast({
        title: "Rollover 失败",
        description: error.message || error.toString() || "操作失败，请稍后重试",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!closePrice || !closeContracts || !newStrikePrice || !newExpirationDate || !openPrice || !openContracts) {
      toast({
        title: "请填写所有必填字段",
        variant: "destructive",
      });
      return;
    }

    if (!newOptionSymbol) {
      toast({
        title: "无法生成期权代码",
        description: "请检查执行价和到期日是否正确",
        variant: "destructive",
      });
      return;
    }

    rolloverMutation.mutate();
  };

  if (!option) return null;

  const estimatedPnL = calculateEstimatedPnL();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Rollover 期权</DialogTitle>
          <DialogDescription className="text-gray-400">
            平仓当前期权并开立新期权，实现盈亏将被锁定
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Current Position Info */}
            <div className="bg-slate-900/50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-400 mb-2">当前持仓</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">期权: </span>
                  <span className="text-white">{option.optionSymbol}</span>
                </div>
                <div>
                  <span className="text-gray-500">执行价: </span>
                  <span className="text-white">${parseFloat(option.strikePrice).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">到期日: </span>
                  <span className="text-white">{new Date(option.expirationDate).toLocaleDateString('zh-CN')}</span>
                </div>
                <div>
                  <span className="text-gray-500">成本价: </span>
                  <span className="text-white">${parseFloat(option.costPrice).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-500">合约数: </span>
                  <span className="text-white">{option.contracts}</span>
                </div>
                <div>
                  <span className="text-gray-500">方向: </span>
                  <span className={option.direction === "SELL" ? "text-red-400" : "text-green-400"}>
                    {option.direction === "SELL" ? "卖出看跌" : "买入看跌"}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Position Fields */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">平仓信息</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="closePrice">平仓价格 *</Label>
                  <Input
                    id="closePrice"
                    type="number"
                    step="0.01"
                    value={closePrice}
                    onChange={(e) => setClosePrice(e.target.value)}
                    className="bg-slate-900 border-gray-700"
                    placeholder="例: 7.14"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="closeContracts">平仓数量 *</Label>
                  <Input
                    id="closeContracts"
                    type="number"
                    value={closeContracts}
                    onChange={(e) => setCloseContracts(e.target.value)}
                    className="bg-slate-900 border-gray-700"
                    placeholder="合约数"
                    required
                  />
                </div>
              </div>

              {/* Estimated P&L */}
              {estimatedPnL !== null && (
                <div className="bg-slate-900/50 rounded p-2 border border-gray-700">
                  <span className="text-xs text-gray-400">预估实现盈亏: </span>
                  <span className={`font-semibold ${estimatedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {estimatedPnL >= 0 ? '+' : ''}${estimatedPnL.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* New Position Fields */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">新仓位信息</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newStrikePrice">新执行价 *</Label>
                    <Input
                      id="newStrikePrice"
                      type="number"
                      step="0.01"
                      value={newStrikePrice}
                      onChange={(e) => setNewStrikePrice(e.target.value)}
                      className="bg-slate-900 border-gray-700"
                      placeholder="例: 195"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newExpirationDate">新到期日 *</Label>
                    <Input
                      id="newExpirationDate"
                      type="date"
                      value={newExpirationDate}
                      onChange={(e) => setNewExpirationDate(e.target.value)}
                      className="bg-slate-900 border-gray-700"
                      required
                    />
                  </div>
                </div>

                {/* Auto-generated option symbol preview */}
                {newOptionSymbol && (
                  <div className="bg-slate-900/50 rounded p-2 border border-gray-700">
                    <span className="text-xs text-gray-400">自动生成期权代码: </span>
                    <span className="font-semibold text-green-500">{newOptionSymbol}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="openPrice">开仓价格 *</Label>
                    <Input
                      id="openPrice"
                      type="number"
                      step="0.01"
                      value={openPrice}
                      onChange={(e) => setOpenPrice(e.target.value)}
                      className="bg-slate-900 border-gray-700"
                      placeholder="例: 14.74"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="openContracts">开仓数量 *</Label>
                    <Input
                      id="openContracts"
                      type="number"
                      value={openContracts}
                      onChange={(e) => setOpenContracts(e.target.value)}
                      className="bg-slate-900 border-gray-700"
                      placeholder="合约数"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="fees">手续费 (可选)</Label>
                <Input
                  id="fees"
                  type="number"
                  step="0.01"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  className="bg-slate-900 border-gray-700"
                  placeholder="例: 2.10"
                />
              </div>
              <div>
                <Label htmlFor="notes">备注 (可选)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-slate-900 border-gray-700"
                  placeholder="例: NVDA rollover from 175 to 195 strike"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={rolloverMutation.isPending}>
              {rolloverMutation.isPending ? "处理中..." : "确认 Rollover"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
