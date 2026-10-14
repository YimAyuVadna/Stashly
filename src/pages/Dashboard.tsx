import React, { useEffect, useRef } from 'react';
import {
  PiggyBank,
  ArrowUpRight,
} from '@phosphor-icons/react';
import { formatCurrency, calculateDaysRemaining } from '../utils/calculations';
import { DashboardSummary, WishlistItem, Transaction } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import gsap from 'gsap';

interface DashboardProps {
  summary: DashboardSummary;
  recentTransactions: Transaction[];
  activeWishlist: WishlistItem[];
  allWishlist?: WishlistItem[];
  transactions?: Transaction[];
  onOpenQuickSave: (goalId?: string) => void;
  onNavigate: (page: string) => void;
  onSelectWishlist: (item: WishlistItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  recentTransactions,
  activeWishlist,
  allWishlist,
  transactions,
  onOpenQuickSave,
  onNavigate,
  onSelectWishlist,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Augment activeWishlist with live calculated figures if transactions available
  const displayWishlist = React.useMemo(() => {
    const txList = transactions || recentTransactions;
    if (!txList) return activeWishlist;
    return activeWishlist.map((item) => {
      const goalTxs = txList.filter((t) => t.goal_id === item.id);
      const saved = goalTxs.reduce(
        (acc, t) => acc + (t.type === 'contribution' ? t.amount : -t.amount),
        0
      );
      const remaining = Math.max(0, item.target_amount - saved);
      const progress = item.target_amount > 0 ? Math.round((saved / item.target_amount) * 1000) / 10 : 0;
      return {
        ...item,
        saved_amount: saved,
        remaining_amount: remaining,
        progress_percentage: progress,
      };
    });
  }, [activeWishlist, transactions, recentTransactions]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-dash-item',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Calculate accumulation trajectory from actual transactions
  const chartData = React.useMemo(() => {
    if (recentTransactions && recentTransactions.length > 0) {
      // Sort ascending by date
      const sorted = [...recentTransactions].sort((a, b) =>
        a.transaction_date.localeCompare(b.transaction_date)
      );
      let runningBalanceCents = 0;
      const points: { name: string; value: number }[] = [];
      sorted.forEach((t) => {
        runningBalanceCents += t.type === 'contribution' ? t.amount : -t.amount;
        points.push({
          name: t.transaction_date.slice(5), // MM-DD
          value: Math.max(0, runningBalanceCents / 100),
        });
      });
      // Keep last 10 points
      return points.slice(-10);
    }
    // Fallback if no transactions yet
    return [
      { name: 'Start', value: 0 },
      { name: 'Current', value: summary.totalSaved / 100 },
    ];
  }, [recentTransactions, summary.totalSaved]);

  return (
    <div ref={containerRef} className="space-y-10 max-w-7xl mx-auto pb-12">
      {/* Editorial Luxury Hero - Inspired by Floria reference */}
      <div className="gsap-dash-item relative overflow-hidden rounded-[2.5rem] bg-[#0c0d12] border border-white/[0.08] p-8 sm:p-12 shadow-2xl">
        {/* Ambient glow mesh */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/15 via-teal-600/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Big Editorial Serif Title */}
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.08]">
            Wealth Architecture. <br />
            <span className="italic font-normal text-neutral-300">Measured daily.</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 mt-4 max-w-xl font-normal leading-relaxed">
            You have disciplined <strong className="text-white font-medium">{formatCurrency(summary.totalSaved)}</strong> into your personal collection. Break ambition into daily rituals.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <button
              onClick={() => onOpenQuickSave()}
              className="px-6 py-3 rounded-full bg-white text-black font-semibold text-[13px] hover:bg-neutral-200 active:scale-95 transition-all duration-300 shadow-xl shadow-white/10"
            >
              <span>Record Contribution</span>
            </button>
            <button
              onClick={() => onNavigate('heatmap')}
              className="px-6 py-3 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-neutral-300 hover:text-white text-[13px] font-medium transition-all duration-300 backdrop-blur-md"
            >
              Inspect Yearly Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* Double-Bezel Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Saved */}
        <div className="gsap-dash-item double-bezel">
          <div className="bezel-core p-6 flex flex-col justify-between h-full">
            <div className="text-neutral-400 text-xs font-medium">
              <span className="uppercase tracking-[0.15em] text-[10px]">Accumulated Capital</span>
            </div>
            <div className="mt-5">
              <h3 className="font-editorial text-3xl font-normal text-white tracking-tight">
                {formatCurrency(summary.totalSaved)}
              </h3>
              <p className="text-[12px] text-neutral-400 mt-1 font-normal">
                Of {formatCurrency(summary.totalWishlistTarget)} total aspirations
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Remaining Target */}
        <div className="gsap-dash-item double-bezel">
          <div className="bezel-core p-6 flex flex-col justify-between h-full">
            <div className="text-neutral-400 text-xs font-medium">
              <span className="uppercase tracking-[0.15em] text-[10px]">Distance to Completion</span>
            </div>
            <div className="mt-5">
              <h3 className="font-editorial text-3xl font-normal text-white tracking-tight">
                {formatCurrency(summary.remainingAmount)}
              </h3>
              <p className="text-[12px] text-neutral-400 mt-1 font-normal">
                {summary.overallProgress}% of all collections secured
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Saved This Month */}
        <div className="gsap-dash-item double-bezel">
          <div className="bezel-core p-6 flex flex-col justify-between h-full">
            <div className="text-neutral-400 text-xs font-medium">
              <span className="uppercase tracking-[0.15em] text-[10px]">Current Month</span>
            </div>
            <div className="mt-5">
              <h3 className="font-editorial text-3xl font-normal text-white tracking-tight">
                {formatCurrency(summary.amountSavedThisMonth)}
              </h3>
              <p className="text-[12px] text-neutral-400 mt-1 font-normal">
                Active month volume
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Daily Mission */}
        <div className="gsap-dash-item double-bezel">
          <div className="bezel-core p-6 flex flex-col justify-between h-full">
            <div className="text-neutral-400 text-xs font-medium">
              <span className="uppercase tracking-[0.15em] text-[10px]">Today's Target</span>
            </div>
            <div className="mt-5">
              <h3 className="font-editorial text-3xl font-normal text-white tracking-tight">
                {formatCurrency(summary.todaySaved)}
              </h3>
              <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, summary.todayProgress)}%` }}
                />
              </div>
              <p className="text-[12px] text-neutral-400 mt-2 flex justify-between">
                <span>Goal: {formatCurrency(summary.todayTarget)}</span>
                <span className="font-semibold text-emerald-400">{summary.todayProgress}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Daily Mission Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Savings Velocity Area Chart */}
        <div className="gsap-dash-item lg:col-span-2 sq-card p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-editorial text-2xl font-normal text-white">Savings Velocity.</h3>
              <p className="text-[12px] text-neutral-400 mt-0.5">Capital accumulation curve over active periods</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-neutral-300 hover:text-white font-medium flex items-center space-x-1.5 transition"
            >
              <span>Comprehensive Analytics</span>
              <ArrowUpRight size={13} weight="bold" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="emeraldVelocityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="60%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.4" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c0d12',
                    borderColor: 'rgba(16,185,129,0.4)',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    color: '#ffffff',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 15px rgba(16,185,129,0.15)',
                  }}
                  itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 500, marginBottom: '4px' }}
                  formatter={(val: any) => [`$${val.toFixed(2)}`, 'Cumulative Savings']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#emeraldVelocityGrad)"
                  filter="url(#emeraldGlow)"
                  activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Mission Focus Card */}
        <div className="gsap-dash-item sq-card p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-2xl font-normal text-white">Today's Mission.</h3>
              <span
                className={`text-[10px] px-3 py-1 rounded-full font-semibold uppercase tracking-wider ${
                  summary.todaySaved >= summary.todayTarget
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/[0.06] text-neutral-300 border border-white/10'
                }`}
              >
                {summary.todaySaved >= summary.todayTarget ? 'Achieved' : 'In Progress'}
              </span>
            </div>
            <p className="text-[12px] text-neutral-400 mt-1">
              Standard: {formatCurrency(summary.todayTarget)} daily
            </p>

            <div className="my-6 p-6 rounded-2xl bg-[#050608] border border-white/[0.06] text-center shadow-inner">
              <p className="text-[11px] text-neutral-400 uppercase tracking-widest">Contributed Today</p>
              <p className="font-editorial text-4xl font-normal text-emerald-400 mt-2">
                {formatCurrency(summary.todaySaved)}
              </p>
              <p className="text-[12px] text-neutral-400 mt-2">
                {summary.todayRemaining > 0
                  ? `${formatCurrency(summary.todayRemaining)} remaining to complete today's discipline`
                  : 'Daily quota fulfilled!'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenQuickSave()}
            className="w-full py-3 rounded-full bg-white text-black font-semibold text-[12px] hover:bg-neutral-200 active:scale-95 transition-all shadow-lg shadow-white/5 flex items-center justify-center space-x-2"
          >
            <span>
              {summary.todayRemaining > 0
                ? `Save Remaining ${formatCurrency(summary.todayRemaining)}`
                : 'Deposit Excess'}
            </span>
          </button>
        </div>
      </div>

      {/* Curated Collection Section - Matches Floria "Curated Assemblages" */}
      <div className="gsap-dash-item sq-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-editorial text-2xl font-normal text-white">Curated Collection.</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">Active acquisitions currently under disciplined funding</p>
          </div>
          <button
            onClick={() => onNavigate('wishlist')}
            className="text-xs text-neutral-300 hover:text-white font-medium flex items-center space-x-1.5 transition"
          >
            <span>Explore All</span>
            <ArrowUpRight size={13} weight="bold" />
          </button>
        </div>

        {displayWishlist.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 text-xs">
            No items in your collection yet. Create an item to begin funding.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayWishlist.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectWishlist(item)}
                className="cursor-pointer bg-[#050608] border border-white/[0.07] hover:border-white/20 rounded-2xl p-5 transition-all duration-300 group hover:-translate-y-1 shadow-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {item.image_path ? (
                      <img src={item.image_path} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <PiggyBank size={28} weight="duotone" className="text-neutral-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                      {item.category}
                    </span>
                    <h4 className="font-editorial text-base text-white truncate group-hover:text-neutral-200 transition">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {formatCurrency(item.saved_amount || 0)} / {formatCurrency(item.target_amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.05]">
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, item.progress_percentage || 0)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1.5 font-normal">
                    <span className="text-white font-medium">{item.progress_percentage}% secured</span>
                    <span>{formatCurrency(item.remaining_amount || 0)} left</span>
                  </div>

                  {/* Remaining Horizon / Days until completion badge */}
                  <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                    <span className="text-neutral-500 uppercase tracking-wider">Remaining Horizon</span>
                    {(() => {
                      const horizon = calculateDaysRemaining(
                        item.remaining_amount || 0,
                        item.target_date,
                        item.created_at ? item.created_at.slice(0, 10) : undefined,
                        item.saved_amount,
                        item.planned_daily_rate
                      );
                      const hasContrib = (item.saved_amount || 0) > 0;
                      return (
                        <span
                          className={`font-medium px-2 py-0.5 rounded-full border ${
                            hasContrib
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              : 'text-neutral-400 bg-white/[0.04] border border-white/10'
                          }`}
                        >
                          {horizon.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Ledger Entries */}
      <div className="gsap-dash-item sq-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-editorial text-2xl font-normal text-white">The Archive Ledger.</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">Chronological record of verified financial movements</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-neutral-300 hover:text-white font-medium flex items-center space-x-1.5 transition"
          >
            <span>Full Ledger</span>
            <ArrowUpRight size={13} weight="bold" />
          </button>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {recentTransactions.map((tx) => {
            const list = allWishlist || activeWishlist;
            const itemImage =
              tx.goal_image ||
              (tx.goal_id ? list.find((w) => w.id === tx.goal_id)?.image_path : null) ||
              (tx.goal_name ? list.find((w) => w.name === tx.goal_name)?.image_path : null);

            return (
              <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={tx.goal_name || 'Item'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PiggyBank size={18} weight="duotone" className="text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white tracking-tight">
                      {tx.goal_name || 'General Capital Reserve'}
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
                </div>
                <span
                  className={`font-semibold tracking-tight ${
                    tx.type === 'contribution' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {tx.type === 'contribution' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
