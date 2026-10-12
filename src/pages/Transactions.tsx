import React, { useState } from 'react';
import {
  Download,
  Search,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { Transaction, WishlistItem } from '../types';
import { formatCurrency } from '../utils/calculations';
import { clientApi } from '../services/clientApi';

interface TransactionsPageProps {
  transactions: Transaction[];
  wishlistItems: WishlistItem[];
  onDeleteTransaction: (id: string) => void;
  onRefresh: () => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  wishlistItems,
  onDeleteTransaction,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [goalFilter, setGoalFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const filtered = transactions.filter((t) => {
    const matchSearch =
      (t.note && t.note.toLowerCase().includes(search.toLowerCase())) ||
      (t.goal_name && t.goal_name.toLowerCase().includes(search.toLowerCase())) ||
      t.transaction_date.includes(search);
    const matchType = typeFilter === 'all' || t.type === typeFilter;
    const matchGoal =
      goalFilter === 'all' ||
      (goalFilter === 'general' ? !t.goal_id : t.goal_id === goalFilter);
    return matchSearch && matchType && matchGoal;
  });

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await clientApi.exportCsv();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
            Immutable Activity
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight mt-1">
            The Archive Ledger.
          </h2>
          <p className="text-[12px] text-neutral-400 mt-1 max-w-md">
            Complete transaction record of all deposits, withdrawals, and adjustments.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="self-start sm:self-auto flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-[12px] hover:bg-neutral-200 active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isExporting ? 'Exporting...' : 'Export to CSV'}</span>
        </button>
      </div>

      {/* Action Header & Filters */}
      <div className="bg-[#0b0c10] border border-white/[0.08] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by note, item or date..."
              className="w-full bg-[#050608] border border-white/10 rounded-full pl-9 pr-3.5 py-2 text-[12px] text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#050608] border border-white/10 rounded-full px-3.5 py-2 text-[12px] font-medium text-neutral-300 focus:outline-none focus:border-white/30"
          >
            <option value="all">All Types</option>
            <option value="contribution">Contributions</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="adjustment">Adjustments</option>
          </select>

          {/* Goal Filter */}
          <select
            value={goalFilter}
            onChange={(e) => setGoalFilter(e.target.value)}
            className="bg-[#050608] border border-white/10 rounded-full px-3.5 py-2 text-[12px] font-medium text-neutral-300 focus:outline-none focus:border-white/30"
          >
            <option value="all">All Goals</option>
            <option value="general">General Savings Reserve</option>
            {wishlistItems.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transaction List Table */}
      <div className="sq-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050608] border-b border-white/[0.06] text-neutral-400 uppercase font-medium text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Destination Item</th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-neutral-500">
                    No transactions match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[10px] font-semibold ${
                          t.type === 'contribution'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {t.type === 'contribution' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        <span className="capitalize">{t.type}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-medium whitespace-nowrap">
                      {t.transaction_date}
                    </td>
                    <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                      {t.goal_name || 'General Savings Reserve'}
                    </td>
                    <td className="px-6 py-4 text-neutral-400 max-w-xs truncate">
                      {t.note || '—'}
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${
                        t.type === 'contribution' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {t.type === 'contribution' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
