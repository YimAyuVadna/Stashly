import React, { useState, useEffect } from 'react';
import { Settings, QuickSavePreset } from '../types';
import { parseToCents } from '../utils/calculations';
import { clientApi } from '../services/clientApi';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface SettingsPageProps {
  settings: Settings;
  presets: QuickSavePreset[];
  onUpdateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  onUpdatePresets: (newPresets: QuickSavePreset[]) => Promise<void>;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  presets,
  onUpdateSettings,
  onUpdatePresets,
  onRefresh,
}) => {
  const [currency, setCurrency] = useState(settings.currency_code || 'USD');
  const [theme, setTheme] = useState(settings.theme || 'dark');
  const [weekStartDay, setWeekStartDay] = useState<number>(settings.week_start_day ?? 1);
  const [dailyGoalStr, setDailyGoalStr] = useState(
    (settings.daily_goal_amount / 100).toFixed(2)
  );
  const [weeklyGoalStr, setWeeklyGoalStr] = useState(
    (settings.weekly_goal_amount / 100).toFixed(2)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);

  useEffect(() => {
    setCurrency(settings.currency_code || 'USD');
    setTheme(settings.theme || 'dark');
    setWeekStartDay(settings.week_start_day ?? 1);
    setDailyGoalStr((settings.daily_goal_amount / 100).toFixed(2));
    setWeeklyGoalStr((settings.weekly_goal_amount / 100).toFixed(2));
  }, [settings]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      currency_code: currency,
      theme: theme as any,
      week_start_day: weekStartDay,
      daily_goal_amount: parseToCents(dailyGoalStr),
      weekly_goal_amount: parseToCents(weeklyGoalStr),
    });
    setMessage('Settings saved successfully!');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateBackup = async () => {
    try {
      const res = await clientApi.createBackup();
      if (res && res.success) {
        setMessage('Backup created successfully!');
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRestoreBackup = () => {
    setIsRestoreConfirmOpen(true);
  };

  const handleConfirmRestore = async () => {
    setIsRestoreConfirmOpen(false);
    await clientApi.restoreBackup();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Editorial Header */}
      <div>
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-400">
          Preferences & Integrity
        </span>
        <h2 className="font-editorial text-3xl sm:text-4xl font-normal text-white tracking-tight mt-1">
          Settings.
        </h2>
        <p className="text-[12px] text-neutral-400 mt-1 max-w-md">
          Configure financial constraints, active currency, and manage offline SQLite backups.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-semibold shadow-md animate-in fade-in">
          {message}
        </div>
      )}

      {/* General Settings */}
      <form
        onSubmit={handleSaveGeneral}
        className="sq-card p-8 space-y-6"
      >
        <div className="pb-4 border-b border-white/[0.05]">
          <h3 className="font-editorial text-xl font-normal text-white">Financial Targets.</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
              Active Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full bg-[#050608] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
            >
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="CAD">CAD ($) - Canadian Dollar</option>
              <option value="AUD">AUD ($) - Australian Dollar</option>
              <option value="JPY">JPY (¥) - Japanese Yen</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
              Display Theme
            </label>
            <select
              value={theme}
              onChange={async (e) => {
                const val = e.target.value as any;
                setTheme(val);
                await onUpdateSettings({ theme: val });
              }}
              className="w-full bg-[#050608] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
            >
              <option value="dark">Studio OLED Dark</option>
              <option value="light">Editorial Warm Light</option>
              <option value="system">Follow System Theme</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
              Week Starts On
            </label>
            <select
              value={weekStartDay}
              onChange={(e) => setWeekStartDay(Number(e.target.value))}
              className="w-full bg-[#050608] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/30"
            >
              <option value={1}>Monday (Resets Sun 23:59)</option>
              <option value={0}>Sunday (Resets Sat 23:59)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
              Daily Saving Target ($)
            </label>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={dailyGoalStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                const parts = val.split('.');
                const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                setDailyGoalStr(clean);
              }}
              className="w-full bg-[#050608] border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-white/30 cursor-text select-text"
            />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
              Weekly Saving Target ($)
            </label>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={weeklyGoalStr}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                const parts = val.split('.');
                const clean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                setWeeklyGoalStr(clean);
              }}
              className="w-full bg-[#050608] border border-white/10 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-white/30 cursor-text select-text"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-semibold transition hover:bg-neutral-200 active:scale-95 shadow-lg shadow-white/5"
        >
          Save Changes
        </button>
      </form>

      {/* Backup and Restore Management */}
      <div className="sq-card p-8 space-y-5">
        <div className="pb-4 border-b border-white/[0.05]">
          <h3 className="font-editorial text-xl font-normal text-white">Local Data Security & Vault.</h3>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Stashly stores all your financial data, wishlists, and images completely offline in a local SQLite database. Never transmitted to the cloud. Export regular backup files to ensure zero data loss.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleCreateBackup}
            className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold border border-white/10 transition"
          >
            Create Database Backup (.db)
          </button>
          <button
            onClick={handleRestoreBackup}
            className="px-5 py-2.5 rounded-full border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 text-xs font-semibold transition"
          >
            Restore From Backup File
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className="sq-card p-8">
        <h4 className="font-editorial text-lg text-white mb-1">Stashly Studio.</h4>
        <p className="text-xs text-neutral-400">
          Version 1.0.0 • Offline Personal Savings & Wishlist Architecture
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          Engineered for Windows with Electron, React, TypeScript, and SQLite.
        </p>
      </div>

      {/* Custom Database Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={isRestoreConfirmOpen}
        title="Restore SQLite Database."
        description="Restoring a database backup will replace all current financial records and goals. Make sure you have backed up your current data first."
        confirmLabel="Restore Database"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmRestore}
        onCancel={() => setIsRestoreConfirmOpen(false)}
      />
    </div>
  );
};
