/**
 * Rollover History Page
 *
 * Displays the history of option rollover transactions with:
 * - Old and new position details
 * - Realized P&L from each rollover
 * - Strike and expiration adjustments
 * - Total realized P&L from all rollovers
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';

interface RolloverRecord {
  id: string;
  rollover_date: string;

  // Old position
  old_option_symbol: string;
  old_strike_price: number;
  old_expiration_date: string;
  close_price: number;
  close_contracts: number;
  old_cost_price: number;
  old_direction: string;

  // New position
  new_option_symbol: string;
  new_strike_price: number;
  new_expiration_date: string;
  open_price: number;
  open_contracts: number;
  new_status: string;

  // Financial
  realized_pnl: number;
  fees: number | null;

  // Calculated
  days_extended: number;
  strike_adjustment: number;

  notes: string | null;
}

export default function RolloverHistory() {
  const { user, portfolios } = useAuth();
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');

  // Fetch rollover history
  const { data: rollovers, isLoading } = useQuery({
    queryKey: ['rollovers', selectedPortfolio || portfolios?.[0]?.id],
    queryFn: async () => {
      const portfolioId = selectedPortfolio || portfolios?.[0]?.id;
      if (!portfolioId) return [];

      const response = await fetch(`/api/options/rollovers/${portfolioId}`);
      if (!response.ok) throw new Error('Failed to fetch rollover history');
      return response.json() as Promise<RolloverRecord[]>;
    },
    enabled: !!portfolios && portfolios.length > 0,
  });

  // Calculate total realized P&L
  const totalRealizedPnL = rollovers?.reduce((sum, r) => sum + parseFloat(r.realized_pnl.toString()), 0) || 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <p className="text-gray-400">请先登录</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Rollover 历史
          </h1>
          <p className="text-gray-400">期权展期交易记录与实现盈亏</p>
        </div>

        {/* Portfolio Selector */}
        {portfolios && portfolios.length > 1 && (
          <div className="mb-4">
            <select
              value={selectedPortfolio || portfolios[0]?.id}
              onChange={(e) => setSelectedPortfolio(e.target.value)}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg border border-gray-700"
            >
              {portfolios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Summary Card */}
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-xs sm:text-sm text-gray-400">总实现盈亏</div>
              <div className={`text-2xl sm:text-3xl font-bold ${totalRealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalRealizedPnL >= 0 ? '+' : ''}${totalRealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">Rollover 次数</div>
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {rollovers?.length || 0}
              </div>
            </div>
            <div>
              <div className="text-xs sm:text-sm text-gray-400">平均盈亏</div>
              <div className={`text-2xl sm:text-3xl font-bold ${totalRealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {rollovers && rollovers.length > 0
                  ? `$${(totalRealizedPnL / rollovers.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '$0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Rollover Records */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-gray-400">加载中...</div>
          </div>
        ) : !rollovers || rollovers.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-12 border border-gray-700 text-center">
            <p className="text-gray-400">暂无 Rollover 记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rollovers.map((rollover) => (
              <div
                key={rollover.id}
                className="bg-slate-800 rounded-xl p-4 sm:p-6 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                {/* Date and P&L Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-sm text-gray-400">
                      {new Date(rollover.rollover_date).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">实现盈亏</div>
                    <div className={`text-xl sm:text-2xl font-bold ${parseFloat(rollover.realized_pnl.toString()) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {parseFloat(rollover.realized_pnl.toString()) >= 0 ? '+' : ''}
                      ${parseFloat(rollover.realized_pnl.toString()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Rollover Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Old Position */}
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2">平仓位置</div>
                    <div className="space-y-1">
                      <div className="text-white font-medium">{rollover.old_option_symbol}</div>
                      <div className="text-sm text-gray-400">
                        Strike: ${rollover.old_strike_price.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">
                        Exp: {new Date(rollover.old_expiration_date).toLocaleDateString('zh-CN')}
                      </div>
                      <div className="text-sm text-gray-400">
                        平仓价: ${rollover.close_price.toLocaleString()} × {rollover.close_contracts} 张
                      </div>
                      <div className="text-sm text-gray-400">
                        成本价: ${rollover.old_cost_price?.toLocaleString() || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* New Position */}
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-2">新仓位置</div>
                    <div className="space-y-1">
                      <div className="text-white font-medium">{rollover.new_option_symbol}</div>
                      <div className="text-sm text-gray-400">
                        Strike: ${rollover.new_strike_price.toLocaleString()}
                        {rollover.strike_adjustment !== 0 && (
                          <span className={rollover.strike_adjustment > 0 ? 'text-green-500' : 'text-red-500'}>
                            {' '}({rollover.strike_adjustment > 0 ? '+' : ''}{rollover.strike_adjustment})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        Exp: {new Date(rollover.new_expiration_date).toLocaleDateString('zh-CN')}
                        {rollover.days_extended > 0 && (
                          <span className="text-blue-500"> (+{rollover.days_extended}天)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        开仓价: ${rollover.open_price.toLocaleString()} × {rollover.open_contracts} 张
                      </div>
                      <div className="text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          rollover.new_status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' :
                          rollover.new_status === 'ROLLED' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-gray-500/20 text-gray-500'
                        }`}>
                          {rollover.new_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fees and Notes */}
                {(rollover.fees || rollover.notes) && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    {rollover.fees && (
                      <div className="text-xs text-gray-400">
                        手续费: ${rollover.fees.toLocaleString()}
                      </div>
                    )}
                    {rollover.notes && (
                      <div className="text-xs text-gray-400 mt-1">
                        备注: {rollover.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
