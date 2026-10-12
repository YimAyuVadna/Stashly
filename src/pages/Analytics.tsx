import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Transaction, WishlistItem } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Calendar, PieChart as PieIcon } from 'lucide-react';

interface AnalyticsPageProps {
  transactions: Transaction[];
  wishlistItems: WishlistItem[];
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  transactions,
  wishlistItems,
}) => {
  const [timeRange, setTimeRange] = useState<'30days' | '90days' | 'all'>('30days');

  // Filter transactions by date range
  const now = new Date();
  const filteredTx = transactions.filter((t) => {
    if (timeRange === 'all') return true;
    const txDate = new Date(t.transaction_date + 'T00:00:00');
    const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
    if (timeRange === '30days') return diffDays <= 30;
    if (timeRange === '90days') return diffDays <= 90;
    return true;
  });

  // 1. Savings distribution per wishlist item
  const itemContributionMap: Record<string, { name: string; value: number }> = {};
  for (const t of filteredTx) {
    if (t.type === 'contribution') {
      const key = t.goal_id || 'general';
      const name = t.goal_name || 'General Savings';
      if (!itemContributionMap[key]) {
        itemContributionMap[key] = { name, value: 0 };
      }
      itemContributionMap[key].value += t.amount / 100;
    }
  }
  const distributionData = Object.values(itemContributionMap);

  // Expansive, distinct luxury palette for wishlist items
  const COLORS = [
    '#10b981', // Emerald
    '#3b82f6', // Sapphire Blue
    '#f59e0b', // Amber / Gold
    '#8b5cf6', // Violet
    '#ec4899', // Rose Pink
    '#06b6d4', // Cyan
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#6366f1', // Indigo
    '#84cc16', // Lime
  ];

  // 2. Monthly aggregates: Income/Contributions (green) vs Withdrawals/Take Away (red)
  const monthlyMap: Record<string, { deposits: number; withdrawals: number }> = {};
  for (const t of filteredTx) {
    const monthKey = t.transaction_date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { deposits: 0, withdrawals: 0 };
    }
    if (t.type === 'contribution') {
      monthlyMap[monthKey].deposits += t.amount / 100;
    } else if (t.type === 'withdrawal') {
      monthlyMap[monthKey].withdrawals += t.amount / 100;
    }
  }
  const monthlyData = Object.keys(monthlyMap)
    .sort()
    .map((month) => ({
      month,
      deposits: monthlyMap[month].deposits,
      withdrawals: monthlyMap[month].withdrawals,
    }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
            Intelligence & Velocity
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight mt-1">
            Performance Analytics.
          </h2>
          <p className="text-[12px] text-neutral-400 mt-1 max-w-md">
            Aggregated metrics calculated strictly from verified local SQLite transactions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {(['30days', '90days', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                timeRange === range
                  ? 'bg-white text-black font-bold shadow-md'
                  : 'bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-white'
              }`}
            >
              {range === '30days' ? 'Last 30 Days' : range === '90days' ? 'Last 90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Monthly Bar Chart & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Savings Bar Chart: Green deposits, Red withdrawals */}
        <div className="sq-card p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h4 className="font-editorial text-xl font-normal text-white">Monthly Volume.</h4>
            </div>
            {/* Graph Legend */}
            <div className="flex items-center space-x-4 text-[11px] font-sans">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50" />
                <span>Deposits (Income)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-red-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-[3px] bg-red-500 inline-block shadow-sm shadow-red-500/50" />
                <span>Withdrawals (Take Away)</span>
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            {monthlyData.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center pt-24">No monthly records in this time range</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c0d12',
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '1rem',
                      fontSize: '12px',
                      color: '#ffffff',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                    labelStyle={{ color: '#a1a1aa', fontWeight: 500, marginBottom: '4px' }}
                    formatter={(val: any, name: string) => [
                      `$${Number(val).toFixed(2)}`,
                      name === 'deposits' ? 'Deposited' : 'Withdrawn',
                    ]}
                  />
                  <Bar dataKey="deposits" name="deposits" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="withdrawals" name="withdrawals" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Savings Breakdown by Goal */}
        <div className="sq-card p-8">
          <div className="flex items-center space-x-2.5 mb-6">
            <PieIcon className="w-4 h-4 text-teal-400" />
            <h4 className="font-editorial text-xl font-normal text-white">Distribution Ratio.</h4>
          </div>
          <div className="h-64 w-full">
            {distributionData.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center pt-24">No distribution records</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        return (
                          <div className="bg-[#0c0d12] border border-white/20 px-3.5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl text-[12px]">
                            <p className="font-editorial text-sm text-white font-medium">
                              {data.name}
                            </p>
                            <p className="text-emerald-400 font-semibold font-sans mt-0.5">
                              ${Number(data.value).toFixed(2)}
                            </p>
                            <p className="text-neutral-400 text-[10px] font-sans">
                              Allocated Volume
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }}
                    formatter={(val) => <span className="text-neutral-300 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Wishlist Goal Completion Status Table */}
      <div className="sq-card p-8">
        <h4 className="font-editorial text-2xl font-normal text-white mb-6">Fulfillment Horizon.</h4>
        <div className="divide-y divide-white/[0.04]">
          {wishlistItems.map((item) => (
            <div key={item.id} className="py-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="min-w-[200px]">
                <p className="font-medium text-white">{item.name}</p>
                <p className="text-[11px] text-neutral-400">{item.category} • Status: {item.status}</p>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${Math.min(100, item.progress_percentage || 0)}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-emerald-400">{item.progress_percentage}%</p>
                <p className="text-[11px] text-neutral-400">
                  {formatCurrency(item.saved_amount || 0)} / {formatCurrency(item.target_amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
