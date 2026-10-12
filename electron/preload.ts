import { contextBridge, ipcRenderer } from 'electron';

export const api = {
  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (data: any) => ipcRenderer.invoke('settings:update', data),

  // Presets
  getPresets: () => ipcRenderer.invoke('presets:get'),
  updatePresets: (presets: any[]) => ipcRenderer.invoke('presets:update', presets),

  // Wishlist
  getWishlistItems: () => ipcRenderer.invoke('wishlist:getAll'),
  getWishlistItem: (id: string) => ipcRenderer.invoke('wishlist:getOne', id),
  createWishlistItem: (item: any) => ipcRenderer.invoke('wishlist:create', item),
  updateWishlistItem: (id: string, item: any) => ipcRenderer.invoke('wishlist:update', id, item),
  deleteWishlistItem: (id: string) => ipcRenderer.invoke('wishlist:delete', id),

  // Transactions
  getTransactions: (filter?: any) => ipcRenderer.invoke('transactions:getAll', filter),
  createTransaction: (tx: any) => ipcRenderer.invoke('transactions:create', tx),
  updateTransaction: (id: string, tx: any) => ipcRenderer.invoke('transactions:update', id, tx),
  deleteTransaction: (id: string) => ipcRenderer.invoke('transactions:delete', id),

  // Dashboard & Heatmap
  getDashboardData: (todayStr: string) => ipcRenderer.invoke('dashboard:getData', todayStr),
  getYearHeatmapData: (year: number) => ipcRenderer.invoke('heatmap:getYearData', year),

  // Native files & backups
  selectAndSaveImage: () => ipcRenderer.invoke('image:selectAndSave'),
  exportCsv: () => ipcRenderer.invoke('export:csv'),
  createBackup: () => ipcRenderer.invoke('backup:create'),
  restoreBackup: () => ipcRenderer.invoke('backup:restore'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
