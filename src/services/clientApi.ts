import { api } from '../../electron/preload';

declare global {
  interface Window {
    electronAPI?: typeof api;
  }
}

// In-memory fallback mock for browser-based dev testing when run outside Electron
const memoryStore = {
  settings: {
    id: 1,
    currency_code: 'USD',
    theme: 'dark' as const,
    daily_goal_amount: 500,
    weekly_goal_amount: 3500,
    week_start_day: 1,
    heatmap_scale_mode: 'daily_goal' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  presets: [
    { id: 1, label: '$0.50', amount: 50, sort_order: 1, is_enabled: 1 },
    { id: 2, label: '$1.00', amount: 100, sort_order: 2, is_enabled: 1 },
    { id: 3, label: '$2.50', amount: 250, sort_order: 3, is_enabled: 1 },
    { id: 4, label: '$5.00', amount: 500, sort_order: 4, is_enabled: 1 },
    { id: 5, label: '$10.00', amount: 1000, sort_order: 5, is_enabled: 1 },
    { id: 6, label: '$20.00', amount: 2000, sort_order: 6, is_enabled: 1 },
  ],
  wishlist: [
    {
      id: 'cam-sony-a6000',
      name: 'Sony a6000 Camera',
      category: 'Cameras',
      brand: 'Sony',
      model: 'ILCE-6000L',
      description: 'Mirrorless camera with 16-50mm power zoom lens for high quality travel photography.',
      target_amount: 20000, // $200.00
      current_price: 24900,
      currency_code: 'USD',
      priority: 'high' as const,
      target_date: '2026-12-25',
      status: 'active' as const,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'audio-anc-headphones',
      name: 'Sony WH-1000XM5',
      category: 'Electronics',
      brand: 'Sony',
      model: 'WH1000XM5',
      description: 'Noise canceling headphones for distraction-free focus sessions.',
      target_amount: 35000, // $350.00
      current_price: 39800,
      currency_code: 'USD',
      priority: 'medium' as const,
      target_date: '2027-01-15',
      status: 'active' as const,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  transactions: [
    {
      id: 'tx-init-1',
      goal_id: 'cam-sony-a6000',
      goal_name: 'Sony a6000 Camera',
      type: 'contribution' as const,
      amount: 250,
      currency_code: 'USD',
      transaction_date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      note: 'Saved coffee budget',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'tx-init-2',
      goal_id: 'cam-sony-a6000',
      goal_name: 'Sony a6000 Camera',
      type: 'contribution' as const,
      amount: 500,
      currency_code: 'USD',
      transaction_date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
      note: 'Cooked dinner at home',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: 'tx-init-3',
      goal_id: 'cam-sony-a6000',
      goal_name: 'Sony a6000 Camera',
      type: 'contribution' as const,
      amount: 500,
      currency_code: 'USD',
      transaction_date: new Date().toISOString().slice(0, 10),
      note: 'Daily goal completed!',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]
};

export const clientApi = {
  getSettings: async () => {
    if (window.electronAPI) return window.electronAPI.getSettings();
    return memoryStore.settings;
  },
  updateSettings: async (data: any) => {
    if (window.electronAPI) return window.electronAPI.updateSettings(data);
    memoryStore.settings = { ...memoryStore.settings, ...data, updated_at: new Date().toISOString() };
    return memoryStore.settings;
  },
  getPresets: async () => {
    if (window.electronAPI) return window.electronAPI.getPresets();
    return memoryStore.presets;
  },
  updatePresets: async (presets: any[]) => {
    if (window.electronAPI) return window.electronAPI.updatePresets(presets);
    memoryStore.presets = presets;
    return presets;
  },
  getWishlistItems: async () => {
    if (window.electronAPI) return window.electronAPI.getWishlistItems();
    return memoryStore.wishlist.map(w => {
      const saved = memoryStore.transactions
        .filter(t => t.goal_id === w.id)
        .reduce((sum, t) => sum + (t.type === 'contribution' ? t.amount : -t.amount), 0);
      const remaining = Math.max(0, w.target_amount - saved);
      const progress = w.target_amount > 0 ? Math.round((saved / w.target_amount) * 1000) / 10 : 0;
      return { ...w, saved_amount: saved, remaining_amount: remaining, progress_percentage: progress };
    });
  },
  getWishlistItem: async (id: string) => {
    if (window.electronAPI) return window.electronAPI.getWishlistItem(id);
    const item = memoryStore.wishlist.find(w => w.id === id);
    if (!item) return null;
    const txs = memoryStore.transactions.filter(t => t.goal_id === id);
    const saved = txs.reduce((sum, t) => sum + (t.type === 'contribution' ? t.amount : -t.amount), 0);
    const remaining = Math.max(0, item.target_amount - saved);
    const progress = item.target_amount > 0 ? Math.round((saved / item.target_amount) * 1000) / 10 : 0;
    return { ...item, saved_amount: saved, remaining_amount: remaining, progress_percentage: progress, transactions: txs };
  },
  createWishlistItem: async (data: any) => {
    if (window.electronAPI) return window.electronAPI.createWishlistItem(data);
    const id = 'item-' + Date.now().toString(36);
    const newItem = {
      ...data,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.wishlist.push(newItem);
    return newItem;
  },
  updateWishlistItem: async (id: string, data: any) => {
    if (window.electronAPI) return window.electronAPI.updateWishlistItem(id, data);
    const index = memoryStore.wishlist.findIndex(w => w.id === id);
    if (index !== -1) {
      memoryStore.wishlist[index] = { ...memoryStore.wishlist[index], ...data, updated_at: new Date().toISOString() };
      return memoryStore.wishlist[index];
    }
    return null;
  },
  deleteWishlistItem: async (id: string) => {
    if (window.electronAPI) return window.electronAPI.deleteWishlistItem(id);
    memoryStore.wishlist = memoryStore.wishlist.filter(w => w.id !== id);
    return { success: true };
  },
  getTransactions: async (filter?: any) => {
    if (window.electronAPI) return window.electronAPI.getTransactions(filter);
    return memoryStore.transactions;
  },
  createTransaction: async (data: any) => {
    if (window.electronAPI) return window.electronAPI.createTransaction(data);
    const goal = memoryStore.wishlist.find(w => w.id === data.goal_id);
    const id = 'tx-' + Date.now().toString(36);
    const newTx = {
      ...data,
      id,
      goal_name: goal ? goal.name : 'General Savings',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryStore.transactions.unshift(newTx);
    return newTx;
  },
  updateTransaction: async (id: string, data: any) => {
    if (window.electronAPI) return window.electronAPI.updateTransaction(id, data);
    const idx = memoryStore.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      memoryStore.transactions[idx] = { ...memoryStore.transactions[idx], ...data, updated_at: new Date().toISOString() };
      return memoryStore.transactions[idx];
    }
    return null;
  },
  deleteTransaction: async (id: string) => {
    if (window.electronAPI) return window.electronAPI.deleteTransaction(id);
    memoryStore.transactions = memoryStore.transactions.filter(t => t.id !== id);
    return { success: true };
  },
  getDashboardData: async (todayStr: string) => {
    if (window.electronAPI) return window.electronAPI.getDashboardData(todayStr);
    const totalSaved = memoryStore.transactions.reduce((acc, t) => acc + (t.type === 'contribution' ? t.amount : -t.amount), 0);
    const totalTarget = memoryStore.wishlist.reduce((acc, w) => acc + w.target_amount, 0);
    const remaining = Math.max(0, totalTarget - totalSaved);
    const progress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 1000) / 10 : 0;
    const todaySaved = memoryStore.transactions
      .filter(t => t.transaction_date === todayStr)
      .reduce((acc, t) => acc + (t.type === 'contribution' ? t.amount : -t.amount), 0);
    const curYearMonth = todayStr.substring(0, 7);
    const amountSavedThisMonth = memoryStore.transactions
      .filter(t => t.transaction_date.startsWith(curYearMonth))
      .reduce((acc, t) => acc + (t.type === 'contribution' ? t.amount : -t.amount), 0);
    const savingDates = Array.from(new Set(memoryStore.transactions.filter(t => t.type === 'contribution' && t.amount > 0).map(t => t.transaction_date))).sort();

    return {
      summary: {
        totalSaved,
        totalWishlistTarget: totalTarget,
        remainingAmount: remaining,
        overallProgress: progress,
        amountSavedThisMonth,
        todaySaved,
        todayTarget: memoryStore.settings.daily_goal_amount,
        todayRemaining: Math.max(0, memoryStore.settings.daily_goal_amount - todaySaved),
        todayProgress: Math.round((todaySaved / memoryStore.settings.daily_goal_amount) * 1000) / 10,
      },
      savingDates,
      recentTransactions: memoryStore.transactions.slice(0, 8),
      activeWishlist: memoryStore.wishlist.filter(w => w.status === 'active').slice(0, 6),
    };
  },
  getYearHeatmapData: async (year: number) => {
    if (window.electronAPI) return window.electronAPI.getYearHeatmapData(year);
    const dailyTarget = memoryStore.settings.daily_goal_amount;
    const daysMap: Record<string, any> = {};
    let totalSaved = 0;
    let savingDaysCount = 0;

    for (const t of memoryStore.transactions) {
      if (t.transaction_date.startsWith(String(year))) {
        if (!daysMap[t.transaction_date]) {
          daysMap[t.transaction_date] = {
            date: t.transaction_date,
            savedAmount: 0,
            withdrawalAmount: 0,
            contributionCount: 0,
            targetAmount: dailyTarget,
            level: 0,
            reachedTarget: false,
          };
        }
        if (t.type === 'contribution') {
          daysMap[t.transaction_date].savedAmount += t.amount;
          daysMap[t.transaction_date].contributionCount++;
        } else if (t.type === 'withdrawal') {
          daysMap[t.transaction_date].withdrawalAmount += t.amount;
        }
      }
    }

    for (const d of Object.values(daysMap)) {
      const net = d.savedAmount;
      if (net > 0) {
        totalSaved += net;
        savingDaysCount++;
        const ratio = net / dailyTarget;
        if (ratio >= 1.0) d.level = 4;
        else if (ratio >= 0.5) d.level = 3;
        else if (ratio >= 0.25) d.level = 2;
        else d.level = 1;
        d.reachedTarget = net >= dailyTarget;
      }
    }

    return {
      year,
      totalSaved,
      savingDaysCount,
      averagePerSavingDay: savingDaysCount > 0 ? Math.round(totalSaved / savingDaysCount) : 0,
      days: daysMap,
    };
  },
  selectAndSaveImage: async () => {
    if (window.electronAPI) return window.electronAPI.selectAndSaveImage();
    return null;
  },
  exportCsv: async () => {
    if (window.electronAPI) return window.electronAPI.exportCsv();
    return { success: true };
  },
  createBackup: async () => {
    if (window.electronAPI) return window.electronAPI.createBackup();
    return { success: true };
  },
  restoreBackup: async () => {
    if (window.electronAPI) return window.electronAPI.restoreBackup();
    return { success: true };
  },
};
