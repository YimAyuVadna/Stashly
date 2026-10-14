import React, { useState } from 'react';
import { Plus, Search, PiggyBank } from 'lucide-react';
import { WishlistItem, Transaction } from '../types';
import { formatCurrency, calculateDaysRemaining } from '../utils/calculations';

interface WishlistPageProps {
  items: WishlistItem[];
  transactions?: Transaction[];
  onOpenCreate: () => void;
  onSelect: (item: WishlistItem) => void;
  onQuickSave: (goalId: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  items,
  transactions,
  onOpenCreate,
  onSelect,
  onQuickSave,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  // Augment items with live calculations from transactions if transactions provided
  const augmentedItems = items.map((item) => {
    if (!transactions) return item;
    const goalTxs = transactions.filter((t) => t.goal_id === item.id);
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

  const filteredItems = augmentedItems
    .filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(search.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      const matchCategory = filterCategory === 'all' || item.category === filterCategory;

      return matchSearch && matchStatus && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-high') return b.target_amount - a.target_amount;
      if (sortBy === 'price-low') return a.target_amount - b.target_amount;
      if (sortBy === 'progress-high') return (b.progress_percentage || 0) - (a.progress_percentage || 0);
      if (sortBy === 'progress-low') return (a.progress_percentage || 0) - (b.progress_percentage || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);

  return (
    <div className="space-y-8 w-full max-w-[1700px] mx-auto pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
            Aspirations & Acquisitions
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight mt-1">
            The Collection.
          </h2>
          <p className="text-[12px] text-neutral-400 mt-1 max-w-md">
            Individual goal targets tracked with surgical contribution discipline.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          className="self-start sm:self-auto flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-[12px] hover:bg-neutral-200 active:scale-95 transition-all shadow-xl shadow-white/5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Acquisition</span>
        </button>
      </div>

      {/* Search and Filter Pill Bar */}
      <div className="bg-[#0b0c10] border border-white/[0.08] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collection..."
              className="w-full bg-[#050608] border border-white/10 rounded-full pl-9 pr-3.5 py-2 text-[12px] text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#050608] border border-white/10 rounded-full px-3.5 py-2 text-[12px] font-medium text-neutral-300 focus:outline-none focus:border-white/30"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#050608] border border-white/10 rounded-full px-3.5 py-2 text-[12px] font-medium text-neutral-300 focus:outline-none focus:border-white/30"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#050608] border border-white/10 rounded-full px-3.5 py-2 text-[12px] font-medium text-neutral-300 focus:outline-none focus:border-white/30"
          >
            <option value="recent">Recently Added</option>
            <option value="price-high">Highest Target</option>
            <option value="price-low">Lowest Target</option>
            <option value="progress-high">Closest to Goal</option>
            <option value="progress-low">Furthest from Goal</option>
          </select>
        </div>
      </div>

      {/* Gallery Grid of Wishlist Cards */}
      {filteredItems.length === 0 ? (
        <div className="py-24 text-center sq-card rounded-3xl">
          <PiggyBank className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="font-editorial text-lg text-white">No items found</h3>
          <p className="text-[12px] text-neutral-400 mt-1 max-w-sm mx-auto">
            Curate your wishlists and establish small daily deposits to unlock them.
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-5 px-5 py-2 rounded-full bg-white text-black font-semibold text-[12px] transition hover:bg-neutral-200"
          >
            Add New Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="double-bezel transition-all duration-300 group hover:-translate-y-1.5"
            >
              <div className="bezel-core p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="cursor-pointer" onClick={() => onSelect(item)}>
                    <div className="w-full h-52 rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center relative">
                      {item.image_path ? (
                        <img
                          src={item.image_path}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <PiggyBank className="w-14 h-14 text-neutral-700" />
                      )}
                      <span
                        className={`absolute top-3 right-3 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest backdrop-blur-md ${
                          item.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-black/70 text-white/80 border border-white/10'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-4">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        {item.category}
                      </span>
                      <h3 className="font-editorial text-lg text-white truncate mt-0.5 group-hover:text-neutral-200 transition">
                        {item.name}
                      </h3>
                      {item.brand && (
                        <p className="text-[11px] text-neutral-400 mt-0.5 font-normal">
                          {item.brand} {item.model ? `• ${item.model}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.05]">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] text-neutral-400">Disciplined</span>
                        <p className="font-editorial text-xl font-normal text-white tracking-tight">
                          {formatCurrency(item.saved_amount || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-neutral-400">Target</span>
                        <p className="text-[13px] font-medium text-neutral-300">
                          {formatCurrency(item.target_amount)}
                        </p>
                      </div>
                    </div>

                    <div className="w-full bg-white/[0.06] h-1.5 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, item.progress_percentage || 0)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 font-normal">
                      <span className="text-white font-medium">{item.progress_percentage}% secured</span>
                      <span>{formatCurrency(item.remaining_amount || 0)} left</span>
                    </div>

                    {/* Days Until Complete Badge */}
                    <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px]">
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
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-neutral-400 bg-white/[0.04] border-white/10'
                            }`}
                          >
                            {horizon.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/[0.05] flex items-center space-x-2">
                  <button
                    onClick={() => onSelect(item)}
                    className="flex-1 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-[12px] font-medium transition"
                  >
                    Inspect Details
                  </button>
                  <button
                    onClick={() => onQuickSave(item.id)}
                    className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-[12px] hover:bg-neutral-200 active:scale-95 transition flex items-center justify-center shadow-sm"
                  >
                    <span>Deposit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
