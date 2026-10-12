import React, { useState } from 'react';
import { HeatmapCalendar } from '../components/heatmap/HeatmapCalendar';
import { HeatmapStats, DayActivity, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Flame, X, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface HeatmapPageProps {
  stats: HeatmapStats;
  dailyGoalCents: number;
  transactions: Transaction[];
  onYearChange: (year: number) => void;
  onOpenQuickSaveWithDate: (dateStr: string) => void;
  onDeleteTransaction: (txId: string) => void;
}

export const HeatmapPage: React.FC<HeatmapPageProps> = ({
  stats,
  dailyGoalCents,
  transactions,
  onYearChange,
  onOpenQuickSaveWithDate,
  onDeleteTransaction,
}) => {
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);

  const selectedDayActivity: DayActivity | undefined = selectedDayDate
    ? stats.days[selectedDayDate]
    : undefined;

  const selectedDayTransactions = selectedDayDate
    ? transactions.filter((t) => t.transaction_date === selectedDayDate)
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Editorial Header */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
          Temporal Consistency
        </span>
        <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight mt-1">
          The Annual Matrix.
        </h2>
        <p className="text-[12px] text-neutral-400 mt-1 max-w-md">
          A 365-day heat map visualizing the density of your daily savings habits.
        </p>
      </div>

      {/* Metric Highlights for Selected Year */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="double-bezel">
          <div className="bezel-core p-6">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">Saved in {stats.year}</span>
            <h3 className="font-editorial text-3xl font-normal text-emerald-400 mt-2">
              {formatCurrency(stats.totalSaved)}
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1">Accumulated across {stats.year}</p>
          </div>
        </div>

        <div className="double-bezel">
          <div className="bezel-core p-6">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">Disciplined Days</span>
            <h3 className="font-editorial text-3xl font-normal text-white mt-2">
              {stats.savingDaysCount} Days
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1">Qualifying deposit events</p>
          </div>
        </div>

        <div className="double-bezel">
          <div className="bezel-core p-6">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">Longest Streak</span>
            <h3 className="font-editorial text-3xl font-normal text-amber-400 mt-2 flex items-center space-x-2">
              <Flame className="w-5 h-5 fill-amber-400" />
              <span>{stats.longestStreak} Days</span>
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1">Unbroken habit momentum</p>
          </div>
        </div>

        <div className="double-bezel">
          <div className="bezel-core p-6">
            <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium">Average Volume</span>
            <h3 className="font-editorial text-3xl font-normal text-teal-400 mt-2">
              {formatCurrency(stats.averagePerSavingDay)}
            </h3>
            <p className="text-[11px] text-neutral-400 mt-1">Per active deposit session</p>
          </div>
        </div>
      </div>

      {/* Main Heatmap Calendar */}
      <HeatmapCalendar
        year={stats.year}
        daysData={stats.days}
        dailyGoalCents={dailyGoalCents}
        onYearChange={onYearChange}
        onDayClick={(dateStr) => setSelectedDayDate(dateStr)}
      />

      {/* Day Detail Slide-over / Modal Panel */}
      {selectedDayDate && (
        <div className="sq-card p-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.05]">
            <div>
              <h3 className="font-editorial text-2xl font-normal text-white">
                Activity on {format(new Date(selectedDayDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="text-xs text-neutral-400 mt-1">
                Total Saved: <strong className="text-emerald-400">{formatCurrency(selectedDayActivity?.savedAmount || 0)}</strong> • Daily Target: {formatCurrency(dailyGoalCents)}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => onOpenQuickSaveWithDate(selectedDayDate)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white text-black font-semibold text-xs transition hover:bg-neutral-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record on this Day</span>
              </button>
              <button
                onClick={() => setSelectedDayDate(null)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-5">
            {selectedDayTransactions.length === 0 ? (
              <p className="text-xs text-neutral-400 py-8 text-center">
                No transactions recorded on this date. Click "Add Record on this Day" to add a backdated contribution.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {selectedDayTransactions.map((tx) => (
                  <div key={tx.id} className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-white">
                        {tx.goal_name || 'General Savings Reserve'}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {tx.type} {tx.note ? `• "${tx.note}"` : ''}
                      </p>
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
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
