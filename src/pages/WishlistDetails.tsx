import React, { useState } from 'react';
import {
  ArrowLeft,
  Zap,
  Edit2,
  Trash2,
  PiggyBank,
} from 'lucide-react';
import { WishlistItem, Transaction } from '../types';
import { formatCurrency, estimateCompletionDate, calculateDaysRemaining } from '../utils/calculations';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface WishlistDetailsProps {
  item: WishlistItem;
  transactions: Transaction[];
  onBack: () => void;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onQuickSave: (goalId: string) => void;
  onDeleteTransaction: (txId: string) => void;
}

export const WishlistDetails: React.FC<WishlistDetailsProps> = ({
  item,
  transactions,
  onBack,
  onEdit,
  onDelete,
  onQuickSave,
  onDeleteTransaction,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const goalTransactions = transactions.filter((t) => t.goal_id === item.id);
  const totalSaved = goalTransactions.reduce(
    (acc, t) => acc + (t.type === 'contribution' ? t.amount : -t.amount),
    0
  );
  const remaining = Math.max(0, item.target_amount - totalSaved);
  const progress = item.target_amount > 0 ? Math.round((totalSaved / item.target_amount) * 1000) / 10 : 0;
  const contributionCount = goalTransactions.length;
  const averageContribution = contributionCount > 0 ? Math.round(totalSaved / contributionCount) : 0;

  const firstContribDate = goalTransactions.length > 0
    ? [...goalTransactions].sort((a, b) => a.transaction_date.localeCompare(b.transaction_date))[0].transaction_date
    : item.created_at ? item.created_at.slice(0, 10) : undefined;

  const estimatedDate = estimateCompletionDate(
    remaining,
    firstContribDate,
    totalSaved,
    item.planned_daily_rate
  );

  // Growth curve data
  let rolling = 0;
  const chartData = goalTransactions
    .slice()
    .reverse()
    .map((t, idx) => {
      rolling += (t.type === 'contribution' ? t.amount : -t.amount);
      return {
        step: `Tx ${idx + 1}`,
        date: t.transaction_date,
        saved: rolling / 100,
      };
    });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-semibold text-neutral-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Collection</span>
        </button>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => onEdit(item)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] text-neutral-300 text-xs font-semibold transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Item</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full border border-red-900/50 text-red-400 hover:bg-red-950/40 text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Goal Banner Card */}
      <div className="sq-card p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Image */}
        <div className="h-64 md:h-full rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center relative shadow-inner">
          {item.image_path ? (
            <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <PiggyBank className="w-16 h-16 text-neutral-700" />
          )}
          <span className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/80 text-white/90 border border-white/10 backdrop-blur-md">
            {item.status}
          </span>
        </div>

        {/* Right: Detailed Info & Metrics */}
        <div className="md:col-span-2 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                {item.category}
              </span>
              {item.priority && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 font-semibold border border-white/10">
                  {item.priority} priority
                </span>
              )}
            </div>

            <h1 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight mt-1">
              {item.name}
            </h1>
            {item.brand && (
              <p className="text-[12px] text-neutral-400 mt-0.5 font-normal">
                {item.brand} {item.model ? `• ${item.model}` : ''}
              </p>
            )}

            {item.description && (
              <p className="text-[12px] text-neutral-300 mt-4 leading-relaxed bg-[#050608] p-4 rounded-2xl border border-white/[0.06]">
                {item.description}
              </p>
            )}
          </div>

          {/* Target Financials */}
          <div className="bg-[#050608] border border-white/[0.06] rounded-2xl p-6 shadow-inner">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-neutral-400 uppercase tracking-widest">Saved Balance</span>
                <p className="font-editorial text-2xl font-normal text-emerald-400 mt-1">
                  {formatCurrency(totalSaved)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 uppercase tracking-widest">Target Goal</span>
                <p className="font-editorial text-2xl font-normal text-white mt-1">
                  {formatCurrency(item.target_amount)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 uppercase tracking-widest">Remaining</span>
                <p className="font-editorial text-2xl font-normal text-neutral-300 mt-1">
                  {formatCurrency(remaining)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 uppercase tracking-widest">Completion</span>
                <p className="font-editorial text-2xl font-normal text-teal-400 mt-1">
                  {progress}%
                </p>
              </div>
            </div>

            {/* Days Until Complete Metric Highlight */}
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-neutral-400">Estimated Horizon:</span>
                {item.planned_daily_rate && item.planned_daily_rate > 0 && (
                  <span className="text-[10px] text-neutral-400 bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-md">
                    Target pace: {formatCurrency(item.planned_daily_rate)}/day
                  </span>
                )}
              </div>
              {(() => {
                const horizon = calculateDaysRemaining(
                  remaining,
                  item.target_date,
                  firstContribDate,
                  totalSaved,
                  item.planned_daily_rate
                );
                const hasContrib = totalSaved > 0;
                return (
                  <span
                    className={`font-semibold px-2.5 py-0.5 rounded-full border ${
                      hasContrib
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-neutral-400 bg-white/[0.04] border-white/10'
                    }`}
                  >
                    {horizon.label}
                  </span>
                );
              })()}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/[0.06] h-2 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>

          {/* Quick CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-neutral-400">
              {estimatedDate ? (
                <span>
                  Est. Completion Date: <strong className="text-white font-medium">{estimatedDate}</strong>
                </span>
              ) : (
                <span>Need more contributions to estimate completion</span>
              )}
            </div>

            <button
              onClick={() => onQuickSave(item.id)}
              className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-[12px] hover:bg-neutral-200 active:scale-95 transition shadow-lg shadow-white/5"
            >
              <span>Contribute to this Goal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Goal Growth Chart */}
      {chartData.length > 0 && (
        <div className="sq-card p-8">
          <h3 className="font-editorial text-2xl font-normal text-white mb-1">
            Goal Accumulation Trajectory.
          </h3>
          <p className="text-[12px] text-neutral-400 mb-6">
            Progress tracked across {contributionCount} contributions (avg {formatCurrency(averageContribution)})
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wishlistGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <filter id="wishlistEmeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.4" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0d12',
                    borderColor: 'rgba(16,185,129,0.3)',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    color: '#fff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 15px rgba(16,185,129,0.15)',
                  }}
                  formatter={(val: any) => [`$${val.toFixed(2)}`, 'Secured Balance']}
                />
                <Area
                  type="monotone"
                  dataKey="saved"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#wishlistGrowthGrad)"
                  filter="url(#wishlistEmeraldGlow)"
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Item Contributions List */}
      <div className="sq-card p-8">
        <h3 className="font-editorial text-2xl font-normal text-white mb-6">Contribution History.</h3>
        {goalTransactions.length === 0 ? (
          <p className="text-xs text-neutral-400 py-6 text-center">
            No contributions recorded yet. Use Quick Save above to record your first step!
          </p>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {goalTransactions.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-white">
                    {tx.type === 'contribution' ? 'Savings Deposit' : 'Withdrawal'}
                  </p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[11px] text-neutral-400 font-normal">
                      {tx.transaction_date}
                    </span>
                    {tx.note && (
                      <div className="relative group inline-block max-w-[150px]">
                        <span className="block px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-neutral-200 text-[10px] font-medium leading-none truncate cursor-pointer hover:border-emerald-500/40 hover:bg-white/[0.08] transition">
                          {tx.note}
                        </span>
                        {/* Floating Hover Tooltip (like Heatmap info) */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none w-max max-w-xs px-3 py-2 rounded-xl bg-[#0c0d12] border border-white/20 text-white text-[11px] shadow-2xl backdrop-blur-2xl">
                          <p className="font-sans leading-relaxed text-neutral-200">
                            {tx.note}
                          </p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#0c0d12]" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`font-semibold ${
                      tx.type === 'contribution' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {tx.type === 'contribution' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => onDeleteTransaction(tx.id)}
                    className="text-neutral-400 hover:text-red-400 transition"
                    title="Delete contribution"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Item."
        description={`Permanently delete "${item.name}" from your collection? Contributed transactions will be unlinked.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        requireTwoStep={true}
        isDestructive={true}
        onConfirm={() => {
          setShowDeleteModal(false);
          onDelete(item.id);
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};
