import { app, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { initializeDatabase } from './database';
import { DataService } from './dataService';

// Register standard custom scheme for local media before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'sq-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;
let dataService: DataService | null = null;

// Determine writable user data paths
const userDataPath = app.getPath('userData');
const dbFilePath = path.join(userDataPath, 'stashly.db');
const uploadsDirPath = path.join(userDataPath, 'uploads');

if (!fs.existsSync(uploadsDirPath)) {
  fs.mkdirSync(uploadsDirPath, { recursive: true });
}

function createWindow() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'icon.ico')
    : path.join(__dirname, '../assets/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 480,
    minHeight: 400,
    title: 'Stashly — Budget Saving & Wishlist Tracker',
    backgroundColor: '#050505',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Completely remove native Windows application menu bar (File Edit View Window Help)
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Handle sq-file requests to serve local uploaded images securely
  protocol.handle('sq-file', async (request) => {
    try {
      // Decode URL to filepath
      let filePath = request.url.replace(/^sq-file:\/\/+/, '');
      if (process.platform === 'win32') {
        filePath = decodeURIComponent(filePath);
        if (/^\/?[a-zA-Z]:/.test(filePath)) {
          filePath = filePath.replace(/^\//, '');
        }
      } else {
        filePath = decodeURIComponent(filePath);
      }

      // Fallback normalization
      filePath = path.normalize(filePath);

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath).toLowerCase();
        let mime = 'image/jpeg';
        if (ext === '.png') mime = 'image/png';
        else if (ext === '.webp') mime = 'image/webp';
        else if (ext === '.gif') mime = 'image/gif';
        else if (ext === '.svg') mime = 'image/svg+xml';

        const buffer = fs.readFileSync(filePath);
        return new Response(buffer, {
          status: 200,
          headers: {
            'Content-Type': mime,
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const fileUrl = pathToFileURL(filePath).toString();
      return net.fetch(fileUrl);
    } catch (err) {
      console.error('Error serving sq-file protocol:', err);
      return new Response('File not found', { status: 404 });
    }
  });

  // Suppress application menu globally
  const { Menu } = require('electron');
  Menu.setApplicationMenu(null);

  // Initialize Database and Service
  const db = initializeDatabase(dbFilePath);
  dataService = new DataService(db);

  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerIpcHandlers() {
  if (!dataService) return;

  // Settings
  ipcMain.handle('settings:get', async () => dataService!.getSettings());
  ipcMain.handle('settings:update', async (_, data) => dataService!.updateSettings(data));

  // Presets
  ipcMain.handle('presets:get', async () => dataService!.getPresets());
  ipcMain.handle('presets:update', async (_, presets) => dataService!.updatePresets(presets));

  // Wishlist
  ipcMain.handle('wishlist:getAll', async () => dataService!.getWishlistItems());
  ipcMain.handle('wishlist:getOne', async (_, id) => dataService!.getWishlistItem(id));
  ipcMain.handle('wishlist:create', async (_, item) => dataService!.createWishlistItem(item));
  ipcMain.handle('wishlist:update', async (_, id, item) => dataService!.updateWishlistItem(id, item));
  ipcMain.handle('wishlist:delete', async (_, id) => dataService!.deleteWishlistItem(id));

  // Transactions
  ipcMain.handle('transactions:getAll', async (_, filter) => dataService!.getTransactions(filter));
  ipcMain.handle('transactions:create', async (_, tx) => dataService!.createTransaction(tx));
  ipcMain.handle('transactions:update', async (_, id, tx) => dataService!.updateTransaction(id, tx));
  ipcMain.handle('transactions:delete', async (_, id) => dataService!.deleteTransaction(id));

  // Dashboard & Heatmap
  ipcMain.handle('dashboard:getData', async (_, todayStr) => dataService!.getDashboardData(todayStr));
  ipcMain.handle('heatmap:getYearData', async (_, year) => dataService!.getYearHeatmapData(year));

  // Image Upload handler (copies selected file to persistent app uploads dir)
  ipcMain.handle('image:selectAndSave', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Wishlist Item Image',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const sourcePath = result.filePaths[0];
    const ext = path.extname(sourcePath).toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const targetPath = path.join(uploadsDirPath, filename);

    fs.copyFileSync(sourcePath, targetPath);

    // Return data URL so image works seamlessly across the app
    let mime = 'image/jpeg';
    if (ext === '.png') mime = 'image/png';
    else if (ext === '.webp') mime = 'image/webp';
    else if (ext === '.gif') mime = 'image/gif';
    else if (ext === '.svg') mime = 'image/svg+xml';

    const buffer = fs.readFileSync(targetPath);
    return `data:${mime};base64,${buffer.toString('base64')}`;
  });

  // Export Data to CSV
  ipcMain.handle('export:csv', async () => {
    if (!mainWindow) return { canceled: true };
    const txs = dataService!.getTransactions() as any[];

    const saveResult = await dialog.showSaveDialog(mainWindow, {
      title: 'Export Transactions as CSV',
      defaultPath: `Stashly-Transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV File', extensions: ['csv'] }],
    });

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true };
    }

    const headers = ['ID', 'Date', 'Type', 'Amount (USD)', 'Goal', 'Note', 'Created At'];
    const rows = txs.map(t => [
      t.id,
      t.transaction_date,
      t.type,
      (t.amount / 100).toFixed(2),
      `"${(t.goal_name || 'General Savings').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    fs.writeFileSync(saveResult.filePath, csvContent, 'utf-8');
    return { success: true, filePath: saveResult.filePath };
  });

  // Backup & Restore
  ipcMain.handle('backup:create', async () => {
    if (!mainWindow) return { canceled: true };
    const saveResult = await dialog.showSaveDialog(mainWindow, {
      title: 'Stashly Database Backup',
      defaultPath: `Stashly-Backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true };
    }

    fs.copyFileSync(dbFilePath, saveResult.filePath);
    return { success: true, filePath: saveResult.filePath };
  });

  ipcMain.handle('backup:restore', async () => {
    if (!mainWindow) return { canceled: true };
    const openResult = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Stashly Backup File',
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['db'] }],
    });

    if (openResult.canceled || openResult.filePaths.length === 0) {
      return { canceled: true };
    }

    const backupFile = openResult.filePaths[0];
    fs.copyFileSync(backupFile, dbFilePath);
    app.relaunch();
    app.exit(0);
    return { success: true };
  });
}
