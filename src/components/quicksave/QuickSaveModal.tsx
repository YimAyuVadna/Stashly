import React, { useState, useEffect } from 'react';
import { X, Lightning, ArrowCounterClockwise, ArrowUpRight, Plus, Minus } from '@phosphor-icons/react';
import { formatCurrency, parseToCents, toLocalDateString } from '../../utils/calculations';
import { WishlistItem, QuickSavePreset } from '../../types';
import confetti from 'canvas-confetti';

interface QuickSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: WishlistItem[];
  presets: QuickSavePreset[];
  preselectedGoalId?: string | null;
  preselectedDate?: string | null;
  onSave: (txData: {
    goal_id?: string | null;
    type: 'contribution' | 'withdrawal';
    amount: number;
    transaction_date: string;
    note?: string;
  }) => Promise<{ id: string } | null>;
  onUndoLast?: (txId: string) => Promise<void>;
}

export const QuickSaveModal: React.FC<QuickSaveModalProps> = ({
  isOpen,
  onClose,
  wishlistItems,
  presets,
  preselectedGoalId,
  preselectedDate,
  onSave,
  onUndoLast,
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(preselectedGoalId || '');
  const [type, setType] = useState<'contribution' | 'withdrawal'>('contribution');
  const [customAmountStr, setCustomAmountStr] = useState<string>('5.00');
  const [dateStr, setDateStr] = useState<string>(preselectedDate || toLocalDateString(new Date()));
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [showUndoBanner, setShowUndoBanner] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedGoalId(preselectedGoalId || '');
      setDateStr(preselectedDate || toLocalDateString(new Date()));
      setError(null);
      setShowUndoBanner(false);
      setLastCreatedId(null);
    }
  }, [isOpen, preselectedGoalId, preselectedDate]);

  if (!isOpen) return null;

  const handleSelectPreset = (amountCents: number) => {
    setCustomAmountStr((amountCents / 100).toFixed(2));
    setError(null);
  };

  const fireSuccessCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#ffffff', '#6ee7b7'],
      });
    } catch (e) {
      // safe fallback if canvas unsupported
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amountCents = parseToCents(customAmountStr);

    if (amountCents <= 0) {
      setError('Amount must be greater than $0.00');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSave({
        goal_id: selectedGoalId || null,
        type,
        amount: amountCents,
        transaction_date: dateStr,
        note: note.trim() || undefined,
      });

      if (res && res.id) {
        setLastCreatedId(res.id);
        setShowUndoBanner(true);
        setNote('');
        if (type === 'contribution') {
          fireSuccessCelebration();
        }
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (lastCreatedId && onUndoLast) {
      await onUndoLast(lastCreatedId);
      setShowUndoBanner(false);
      setLastCreatedId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0c0d12] border border-white/[0.09] rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div>
          {/* Header */}
          <div className="px-8 py-5 border-b border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-9 h-9 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-emerald-400">
                <Lightning size={17} weight="fill" />
              </div>
              <div>
                <h3 className="font-editorial text-lg text-white font-normal tracking-tight">Quick Contribution.</h3>
                <p className="text-[11px] text-neutral-400 font-normal">Record savings directly toward your goals</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Undo Banner */}
          {showUndoBanner && (
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-8 py-2.5 flex items-center justify-between text-[12px] text-emerald-300">
              <span>Contribution recorded successfully!</span>
              <button
                onClick={handleUndo}
                className="flex items-center space-x-1 font-semibold underline text-emerald-300 hover:text-white transition"
              >
                <ArrowCounterClockwise size={13} weight="bold" />
                <span>Undo</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-2xl text-red-300 text-[12px]">
                {error}
              </div>
            )}

            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/70 border border-white/[0.06] rounded-full">
              <button
                type="button"
                onClick={() => setType('contribution')}
                className={`py-2 text-[12px] font-semibold rounded-full transition-all flex items-center justify-center space-x-1.5 ${
                  type === 'contribution'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Plus size={12} weight="bold" />
                <span>Deposit</span>
              </button>
              <button
                type="button"
                onClick={() => setType('withdrawal')}
                className={`py-2 text-[12px] font-semibold rounded-full transition-all flex items-center justify-center space-x-1.5 ${
                  type === 'withdrawal'
                    ? 'bg-neutral-300 text-black shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Minus size={12} weight="bold" />
                <span>Withdraw</span>
              </button>
            </div>

            {/* Destination Goal */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Destination Goal
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-2.5 text-[13px] text-white focus:outline-none focus:border-white/30"
              >
                <option value="">General Savings Reserve</option>
                {wishlistItems
                  .filter((item) => item.status === 'active')
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({formatCurrency(item.saved_amount || 0)} / {formatCurrency(item.target_amount)})
                    </option>
                  ))}
              </select>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Preset Amounts
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {presets.map((p) => {
                  const isSelected = customAmountStr === (p.amount / 100).toFixed(2);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p.amount)}
                      className={`py-2.5 rounded-xl text-[12px] font-semibold border transition-all ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-white/[0.04] border-white/10 text-neutral-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Numeric Amount */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                Amount ($)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold text-[15px]">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={customAmountStr}
                  onChange={(e) => setCustomAmountStr(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-black/60 border border-white/10 focus:border-white/30 rounded-2xl pl-8 pr-4 py-3 text-[17px] font-semibold text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Date & Note - No e.g. text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-2 text-[12px] text-white focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Daily savings deposit"
                  className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-2 text-[12px] text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-white/10 text-neutral-300 hover:text-white text-[12px] font-medium transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex items-center space-x-2 pl-6 pr-2.5 py-2 rounded-full bg-white text-black text-[12px] font-semibold hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Recording...' : 'Confirm Deposit'}</span>
                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                  <ArrowUpRight size={11} weight="bold" />
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
