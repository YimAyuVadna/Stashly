import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { QuickSaveModal } from './components/quicksave/QuickSaveModal';
import { WishlistFormModal } from './components/wishlist/WishlistFormModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { Dashboard } from './pages/Dashboard';
import { WishlistPage } from './pages/Wishlist';
import { WishlistDetails } from './pages/WishlistDetails';
import { DailyGoals } from './pages/DailyGoals';
import { HeatmapPage } from './pages/Heatmap';
import { AnalyticsPage } from './pages/Analytics';
import { TransactionsPage } from './pages/Transactions';
import { SettingsPage } from './pages/Settings';
import { clientApi } from './services/clientApi';
import {
  WishlistItem,
  Transaction,
  Settings as AppSettings,
  QuickSavePreset,
  HeatmapStats,
  DashboardSummary,
} from './types';
import { toLocalDateString, calculateStreaks } from './utils/calculations';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistItem | null>(null);

  // Core App State
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [presets, setPresets] = useState<QuickSavePreset[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [heatmapStats, setHeatmapStats] = useState<HeatmapStats | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Modals
  const [isQuickSaveOpen, setIsQuickSaveOpen] = useState(false);
  const [quickSaveGoalId, setQuickSaveGoalId] = useState<string | null>(null);
  const [quickSaveDate, setQuickSaveDate] = useState<string | null>(null);

  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [editingWishlistItem, setEditingWishlistItem] = useState<WishlistItem | null>(null);

  // Custom delete confirmation modal state
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Mobile / responsive sidebar toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active theme tracking ('dark' or 'light')
  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const applyTheme = () => {
      const selected = settings?.theme || 'dark';
      let eff: 'dark' | 'light' = 'dark';
      if (selected === 'system') {
        eff = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        eff = selected;
      }
      setEffectiveTheme(eff);
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(eff);
      root.style.colorScheme = eff;
    };

    applyTheme();

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (settings?.theme === 'system') {
        applyTheme();
      }
    };
    mql.addEventListener('change', handleSystemChange);
    return () => mql.removeEventListener('change', handleSystemChange);
  }, [settings?.theme]);

  const handleToggleTheme = async () => {
    const nextTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    await clientApi.updateSettings({ theme: nextTheme });
    setSettings((prev) => (prev ? { ...prev, theme: nextTheme } : prev));
  };

  // Load all data
  const loadData = async () => {
    try {
      const todayStr = toLocalDateString(new Date());
      const [fetchedSettings, fetchedPresets, fetchedWishlist, fetchedTransactions, fetchedHeatmap] =
        await Promise.all([
          clientApi.getSettings(),
          clientApi.getPresets(),
          clientApi.getWishlistItems(),
          clientApi.getTransactions(),
          clientApi.getYearHeatmapData(selectedYear),
        ]);

      setSettings(fetchedSettings);
      setPresets(fetchedPresets);
      setWishlistItems(fetchedWishlist);
      setTransactions(fetchedTransactions);
      setHeatmapStats(fetchedHeatmap);

      // Refresh currently selected item if viewing details
      if (selectedWishlistItem) {
        const refreshed = fetchedWishlist.find((w: WishlistItem) => w.id === selectedWishlistItem.id);
        if (refreshed) setSelectedWishlistItem(refreshed);
      }
    } catch (err) {
      console.error('Error loading initial data', err);
    }
  };

  useEffect(() => {
    loadData();

    // Check for midnight rollover in local time so daily and weekly metrics refresh automatically
    let lastDate = toLocalDateString(new Date());
    const interval = setInterval(() => {
      const cur = toLocalDateString(new Date());
      if (cur !== lastDate) {
        lastDate = cur;
        loadData();
      }
    }, 10000);

    const handleFocus = () => {
      const cur = toLocalDateString(new Date());
      if (cur !== lastDate) {
        lastDate = cur;
        loadData();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [selectedYear]);

  // Handle Quick Save Transaction Creation
  const handleSaveTransaction = async (txData: any) => {
    const res = await clientApi.createTransaction(txData);
    await loadData();
    return res;
  };

  const handleUndoTransaction = async (txId: string) => {
    await clientApi.deleteTransaction(txId);
    await loadData();
  };

  const handleDeleteTransaction = (txId: string) => {
    setDeletingTxId(txId);
  };

  const handleConfirmDeleteTransaction = async () => {
    if (deletingTxId) {
      const id = deletingTxId;
      setDeletingTxId(null);
      await clientApi.deleteTransaction(id);
      await loadData();
    }
  };

  // Handle Wishlist item creation & update
  const handleSaveWishlist = async (itemData: Partial<WishlistItem>) => {
    if (editingWishlistItem) {
      await clientApi.updateWishlistItem(editingWishlistItem.id, itemData);
    } else {
      await clientApi.createWishlistItem(itemData);
    }
    await loadData();
  };

  const handleDeleteWishlistItem = async (id: string) => {
    await clientApi.deleteWishlistItem(id);
    setSelectedWishlistItem(null);
    setCurrentPage('wishlist');
    await loadData();
  };

  // Open Quick Save helper
  const openQuickSave = (goalId?: string, dateStr?: string) => {
    setQuickSaveGoalId(goalId || null);
    setQuickSaveDate(dateStr || null);
    setIsQuickSaveOpen(true);
  };

  if (!settings) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050505] text-neutral-300">
        <p className="font-semibold text-xs tracking-widest uppercase animate-pulse">Initializing Stashly...</p>
      </div>
    );
  }

  // Dashboard summary metrics
  const todayStr = toLocalDateString(new Date());
  const totalSaved = transactions.reduce(
    (acc, t) => acc + (t.type === 'contribution' ? t.amount : -t.amount),
    0
  );
  const totalTarget = wishlistItems
    .filter((w) => w.status === 'active' || w.status === 'completed')
    .reduce((acc, w) => acc + w.target_amount, 0);
  const remaining = Math.max(0, totalTarget - totalSaved);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 1000) / 10 : 0;

  const todaySaved = transactions
    .filter((t) => t.transaction_date === todayStr)
    .reduce((acc, t) => acc + (t.type === 'contribution' ? t.amount : -t.amount), 0);
  const todayTarget = settings.daily_goal_amount;
  const todayRemaining = Math.max(0, todayTarget - todaySaved);
  const todayProgress = todayTarget > 0 ? Math.round((todaySaved / todayTarget) * 1000) / 10 : 0;

  const curYearMonth = todayStr.substring(0, 7);
  const amountSavedThisMonth = transactions
    .filter((t) => t.transaction_date.startsWith(curYearMonth))
    .reduce((acc, t) => acc + (t.type === 'contribution' ? t.amount : -t.amount), 0);

  const savingDates = Array.from(
    new Set(
      transactions
        .filter((t) => t.type === 'contribution' && t.amount > 0)
        .map((t) => t.transaction_date)
    )
  ).sort();

  const { currentStreak, longestStreak } = calculateStreaks(savingDates);

  const dashboardSummary: DashboardSummary = {
    totalSaved,
    totalWishlistTarget: totalTarget,
    remainingAmount: remaining,
    overallProgress,
    currentStreak,
    longestStreak,
    amountSavedThisMonth,
    todaySaved,
    todayTarget,
    todayRemaining,
    todayProgress,
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Overview';
      case 'wishlist':
        return 'The Wishlist Collection';
      case 'wishlist-detail':
        return selectedWishlistItem ? selectedWishlistItem.name : 'Goal Details';
      case 'dailygoals':
        return 'Daily Mission';
      case 'analytics':
        return 'Performance Analytics';
      case 'heatmap':
        return 'Yearly Heatmap';
      case 'transactions':
        return 'The Ledger';
      case 'settings':
        return 'Settings';
      default:
        return 'Stashly';
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans relative selection:bg-emerald-500 selection:text-black ${
      effectiveTheme === 'dark' ? 'bg-[#050505] text-[#F3F4F6]' : 'bg-[#F8F9FA] text-[#111827]'
    }`}>
      {/* Background ambient lighting orbs (Floria aesthetic) */}
      <div className="botanic-glow w-[500px] h-[500px] bg-emerald-600 top-[-100px] right-[-100px]" />
      <div className="botanic-glow w-[400px] h-[400px] bg-teal-700 bottom-[-50px] left-[200px]" />

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNavigate={(p) => {
          setIsMobileSidebarOpen(false);
          if (p === 'quicksave') {
            openQuickSave();
          } else {
            setCurrentPage(p);
          }
        }}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        <Navbar
          title={getPageTitle()}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-7 lg:p-10">
          <div key={currentPage} className="max-w-7xl mx-auto page-fade-in">
            {currentPage === 'dashboard' && (
              <Dashboard
                summary={dashboardSummary}
                recentTransactions={transactions.slice(0, 8)}
                transactions={transactions}
                activeWishlist={wishlistItems.filter((w) => w.status === 'active').slice(0, 6)}
                allWishlist={wishlistItems}
                onOpenQuickSave={openQuickSave}
                onNavigate={(page) => setCurrentPage(page)}
                onSelectWishlist={(item) => {
                  setSelectedWishlistItem(item);
                  setCurrentPage('wishlist-detail');
                }}
              />
            )}

            {currentPage === 'wishlist' && (
              <WishlistPage
                items={wishlistItems}
                transactions={transactions}
                onOpenCreate={() => {
                  setEditingWishlistItem(null);
                  setIsWishlistModalOpen(true);
                }}
                onSelect={(item) => {
                  setSelectedWishlistItem(item);
                  setCurrentPage('wishlist-detail');
                }}
                onQuickSave={(goalId) => openQuickSave(goalId)}
              />
            )}

            {currentPage === 'wishlist-detail' && selectedWishlistItem && (
              <WishlistDetails
                item={selectedWishlistItem}
                transactions={transactions}
                onBack={() => setCurrentPage('wishlist')}
                onEdit={(item) => {
                  setEditingWishlistItem(item);
                  setIsWishlistModalOpen(true);
                }}
                onDelete={handleDeleteWishlistItem}
                onQuickSave={(goalId) => openQuickSave(goalId)}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {currentPage === 'dailygoals' && (
              <DailyGoals
                settings={settings}
                transactions={transactions}
                onOpenQuickSave={() => openQuickSave()}
                onUpdateDailyTarget={async (newAmountCents) => {
                  await clientApi.updateSettings({ daily_goal_amount: newAmountCents });
                  await loadData();
                }}
              />
            )}

            {currentPage === 'heatmap' && heatmapStats && (
              <HeatmapPage
                stats={heatmapStats}
                dailyGoalCents={settings.daily_goal_amount}
                transactions={transactions}
                onYearChange={(y) => setSelectedYear(y)}
                onOpenQuickSaveWithDate={(d) => openQuickSave(undefined, d)}
                onDeleteTransaction={handleDeleteTransaction}
              />
            )}

            {currentPage === 'analytics' && (
              <AnalyticsPage transactions={transactions} wishlistItems={wishlistItems} />
            )}

            {currentPage === 'transactions' && (
              <TransactionsPage
                transactions={transactions}
                wishlistItems={wishlistItems}
                onDeleteTransaction={handleDeleteTransaction}
                onRefresh={loadData}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsPage
                settings={settings}
                presets={presets}
                onUpdateSettings={async (data) => {
                  await clientApi.updateSettings(data);
                  await loadData();
                }}
                onUpdatePresets={async (p) => {
                  await clientApi.updatePresets(p);
                  await loadData();
                }}
                onRefresh={loadData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Quick Save Modal */}
      <QuickSaveModal
        isOpen={isQuickSaveOpen}
        onClose={() => setIsQuickSaveOpen(false)}
        wishlistItems={wishlistItems}
        presets={presets}
        preselectedGoalId={quickSaveGoalId}
        preselectedDate={quickSaveDate}
        onSave={handleSaveTransaction}
        onUndoLast={handleUndoTransaction}
      />

      {/* Wishlist Create / Edit Form Modal */}
      <WishlistFormModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        onSave={handleSaveWishlist}
        editItem={editingWishlistItem}
      />

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTxId)}
        title="Delete Record."
        description="Permanently delete this record? Balances and historical savings progress will be recalculated."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        requireTwoStep={true}
        isDestructive={true}
        onConfirm={handleConfirmDeleteTransaction}
        onCancel={() => setDeletingTxId(null)}
      />
    </div>
  );
};
