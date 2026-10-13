import React, { useState, useEffect } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isSameDay,
} from 'date-fns';
import { Zap, Award } from 'lucide-react';
import { Settings, Transaction } from '../types';
import { formatCurrency, toLocalDateString } from '../utils/calculations';

interface DailyGoalsProps {
  settings: Settings;
  transactions: Transaction[];
  onOpenQuickSave: () => void;
  onUpdateDailyTarget: (newAmountCents: number) => void;
}

export const DailyGoals: React.FC<DailyGoalsProps> = ({
  settings,
  transactions,
  onOpenQuickSave,
  onUpdateDailyTarget,
}) => {
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState((settings.daily_goal_amount / 100).toFixed(2));
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    // Check every 10 seconds and on window focus/visibility to automatically reset
    // when local midnight / end of week passes without requiring an app reload
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 10000);

    const handleWake = () => setCurrentDate(new Date());
    window.addEventListener('focus', handleWake);
    document.addEventListener('visibilitychange', handleWake);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleWake);
      document.removeEventListener('visibilitychange', handleWake);
    };
  }, []);

  const todayStr = toLocalDateString(currentDate);

  // Today's contributions
  const todaySaved = transactions
    .filter((t) => t.transaction_date === todayStr)
    .reduce((sum, t) => sum + (t.type === 'contribution' ? t.amount : -t.amount), 0);

  const dailyTarget = settings.daily_goal_amount;
  const todayRemaining = Math.max(0, dailyTarget - todaySaved);
  const todayProgress = dailyTarget > 0 ? Math.round((todaySaved / dailyTarget) * 1000) / 10 : 0;
  const isGoalReached = todaySaved >= dailyTarget;

  // Weekly Goal Calculation in local time
  const weekStartDay = (settings.week_start_day === 0 ? 0 : 1) as 0 | 1;
  const weekStart = startOfWeek(currentDate, { weekStartsOn: weekStartDay });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: weekStartDay });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekDaysData = daysOfWeek.map((dayDate) => {
    const dStr = toLocalDateString(dayDate);
    const daySaved = transactions
      .filter((t) => t.transaction_date === dStr)
      .reduce((sum, t) => sum + (t.type === 'contribution' ? t.amount : -t.amount), 0);

    return {
      date: dayDate,
      dateStr: dStr,
      saved: daySaved,
      reached: daySaved >= dailyTarget,
      isToday: isSameDay(dayDate, currentDate),
    };
  });

  const weeklySaved = weekDaysData.reduce((sum, d) => sum + d.saved, 0);
  const weeklyTarget = settings.weekly_goal_amount || dailyTarget * 7;
  const successfulDays = weekDaysData.filter((d) => d.reached).length;
  const weeklyProgress = weeklyTarget > 0 ? Math.round((weeklySaved / weeklyTarget) * 1000) / 10 : 0;

  const handleSaveTarget = () => {
    const parsed = Math.round(parseFloat(targetInput) * 100);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateDailyTarget(parsed);
    }
    setEditingTarget(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Daily Target Hero Card */}
      <div className="sq-card p-8 sm:p-12 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
              Daily Ritual & Mission
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight mt-1">
              Save {formatCurrency(dailyTarget)} Today.
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {editingTarget ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={targetInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = val.split('.');
                    const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                    setTargetInput(clean);
                  }}
                  className="w-24 bg-black/60 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none cursor-text select-text"
                />
                <button
                  onClick={handleSaveTarget}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold transition"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTarget(true)}
                className="px-4 py-2.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] text-neutral-300 hover:text-white text-[12px] font-medium transition"
              >
                Change Target
              </button>
            )}

            <button
              onClick={onOpenQuickSave}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-[12px] hover:bg-neutral-200 active:scale-95 transition shadow-lg"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>Record Deposit</span>
            </button>
          </div>
        </div>

        {/* Progress Breakdown */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 bg-[#050608] border border-white/[0.06] rounded-2xl p-7 shadow-inner">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-[11px] text-neutral-400 uppercase tracking-widest">Amount Saved Today</p>
                <p className="font-editorial text-4xl font-normal text-emerald-400 mt-1">
                  {formatCurrency(todaySaved)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-neutral-400 uppercase tracking-widest">Target</p>
                <p className="font-editorial text-2xl font-normal text-neutral-300 mt-1">
                  {formatCurrency(dailyTarget)}
                </p>
              </div>
            </div>

            <div className="w-full bg-white/[0.06] h-2 rounded-full mt-5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, todayProgress)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[12px] text-neutral-400 mt-2.5 font-normal">
              <span className="text-emerald-400 font-medium">{todayProgress}% Completed</span>
              <span>
                {todayRemaining > 0
                  ? `${formatCurrency(todayRemaining)} remaining today`
                  : 'Daily goal exceeded!'}
              </span>
            </div>
          </div>

          <div className="bg-[#050608] border border-white/[0.06] rounded-2xl p-7 text-center flex flex-col justify-center h-full">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2">
              <Award className="w-6 h-6" />
            </div>
            <h4 className="font-editorial text-lg text-white">
              {isGoalReached ? 'Ritual Fulfilled.' : 'Discipline in Progress.'}
            </h4>
            <p className="text-[12px] text-neutral-400 mt-1">
              {isGoalReached
                ? 'Your consistent habit compounds into substantial capital.'
                : 'Commit small daily amounts to keep the streak unbroken.'}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="sq-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-editorial text-2xl font-normal text-white">Weekly Consistency.</h3>
            <p className="text-[12px] text-neutral-400 mt-0.5">
              {successfulDays} of 7 days hit target • {formatCurrency(weeklySaved)} total saved
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-400">
            {weeklyProgress}% Weekly Target ({formatCurrency(weeklyTarget)})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mt-4">
          {weekDaysData.map((d) => (
            <div
              key={d.dateStr}
              className={`p-4 rounded-2xl border text-center transition-all ${
                d.reached
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                  : d.isToday
                  ? 'bg-[#050608] border-white/30 shadow-md'
                  : 'bg-[#050608] border-white/[0.06] text-neutral-400'
              }`}
            >
              <span className="text-[10px] font-bold block uppercase tracking-widest text-neutral-400">
                {format(d.date, 'EEE')}
              </span>
              <span className="text-[11px] text-neutral-400 block mb-1">
                {format(d.date, 'MMM d')}
              </span>
              <p className="font-editorial text-lg font-normal text-white mt-1">
                {formatCurrency(d.saved)}
              </p>
              <span
                className={`inline-block mt-2.5 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  d.reached
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : d.saved > 0
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-white/[0.05] text-neutral-400'
                }`}
              >
                {d.reached ? 'Done' : d.saved > 0 ? 'Partial' : 'Rest'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
