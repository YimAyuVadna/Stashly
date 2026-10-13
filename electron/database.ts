import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export function initializeDatabase(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      currency_code TEXT NOT NULL DEFAULT 'USD',
      theme TEXT NOT NULL DEFAULT 'dark',
      daily_goal_amount INTEGER NOT NULL DEFAULT 500, -- cents ($5.00)
      weekly_goal_amount INTEGER NOT NULL DEFAULT 3500, -- cents ($35.00)
      week_start_day INTEGER NOT NULL DEFAULT 1, -- 1 = Monday
      heatmap_scale_mode TEXT NOT NULL DEFAULT 'daily_goal',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wishlist_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      brand TEXT,
      model TEXT,
      description TEXT,
      image_path TEXT,
      product_url TEXT,
      target_amount INTEGER NOT NULL, -- cents
      current_price INTEGER, -- cents
      currency_code TEXT NOT NULL DEFAULT 'USD',
      priority TEXT NOT NULL DEFAULT 'medium',
      target_date TEXT,
      planned_daily_rate INTEGER, -- planned saving amount per day in cents
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      goal_id TEXT,
      type TEXT NOT NULL, -- 'contribution' | 'withdrawal' | 'adjustment'
      amount INTEGER NOT NULL, -- cents
      currency_code TEXT NOT NULL DEFAULT 'USD',
      transaction_date TEXT NOT NULL, -- YYYY-MM-DD
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (goal_id) REFERENCES wishlist_items(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS daily_goal_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_amount INTEGER NOT NULL,
      effective_from TEXT NOT NULL,
      effective_until TEXT,
      is_rest_day INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quick_save_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      amount INTEGER NOT NULL, -- cents
      sort_order INTEGER NOT NULL,
      is_enabled INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Migration: Ensure planned_daily_rate exists on wishlist_items
  try {
    const tableInfo = db.prepare("PRAGMA table_info('wishlist_items')").all() as any[];
    const hasCol = tableInfo.some((col: any) => col.name === 'planned_daily_rate');
    if (!hasCol) {
      db.prepare("ALTER TABLE wishlist_items ADD COLUMN planned_daily_rate INTEGER").run();
    }
  } catch (err) {
    console.error('Migration error checking planned_daily_rate:', err);
  }

  // Initial seed data if settings table is empty
  const hasSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
  if (hasSettings.count === 0) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO settings (id, currency_code, theme, daily_goal_amount, weekly_goal_amount, week_start_day, heatmap_scale_mode, created_at, updated_at)
      VALUES (1, 'USD', 'dark', 500, 3500, 1, 'daily_goal', ?, ?)
    `).run(now, now);

    // Seed default presets ($0.50, $1.00, $2.50, $5.00, $10.00, $20.00)
    const insertPreset = db.prepare(`
      INSERT INTO quick_save_presets (label, amount, sort_order, is_enabled)
      VALUES (?, ?, ?, 1)
    `);

    const presets = [
      { label: '$0.50', amount: 50, order: 1 },
      { label: '$1.00', amount: 100, order: 2 },
      { label: '$2.50', amount: 250, order: 3 },
      { label: '$5.00', amount: 500, order: 4 },
      { label: '$10.00', amount: 1000, order: 5 },
      { label: '$20.00', amount: 2000, order: 6 },
    ];

    db.transaction(() => {
      for (const p of presets) {
        insertPreset.run(p.label, p.amount, p.order);
      }
    })();
  }

  return db;
}
