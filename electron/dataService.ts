import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

function resolveImageToDataUrl(imagePath: string | null | undefined): string | null | undefined {
  if (!imagePath) return imagePath;
  if (imagePath.startsWith('data:') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Handle local sq-file:// or plain filesystem paths
  try {
    let cleanPath = imagePath.replace(/^sq-file:\/\/+/, '');
    if (process.platform === 'win32') {
      cleanPath = decodeURIComponent(cleanPath);
      if (/^\/?[a-zA-Z]:/.test(cleanPath)) {
        cleanPath = cleanPath.replace(/^\//, '');
      }
    } else {
      cleanPath = decodeURIComponent(cleanPath);
    }
    cleanPath = path.normalize(cleanPath);

    if (fs.existsSync(cleanPath)) {
      const ext = path.extname(cleanPath).toLowerCase();
      let mime = 'image/jpeg';
      if (ext === '.png') mime = 'image/png';
      else if (ext === '.webp') mime = 'image/webp';
      else if (ext === '.gif') mime = 'image/gif';
      else if (ext === '.svg') mime = 'image/svg+xml';

      const data = fs.readFileSync(cleanPath);
      return `data:${mime};base64,${data.toString('base64')}`;
    }
  } catch (err) {
    console.error('Error converting image to data URL:', err);
  }

  return imagePath;
}

export class DataService {
  constructor(private db: Database.Database) {}

  // ==================== SETTINGS ====================
  getSettings() {
    return this.db.prepare('SELECT * FROM settings WHERE id = 1').get();
  }

  updateSettings(data: any) {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
    const setClause = fields.map(k => `${k} = ?`).join(', ');
    const values = fields.map(k => data[k]);
    values.push(new Date().toISOString());

    this.db.prepare(`
      UPDATE settings
      SET ${setClause}, updated_at = ?
      WHERE id = 1
    `).run(...values);

    return this.getSettings();
  }

  // ==================== PRESETS ====================
  getPresets() {
    return this.db.prepare('SELECT * FROM quick_save_presets WHERE is_enabled = 1 ORDER BY sort_order ASC').all();
  }

  updatePresets(presets: Array<{ id?: number; label: string; amount: number; sort_order: number; is_enabled: number }>) {
    const deleteStmt = this.db.prepare('DELETE FROM quick_save_presets');
    const insertStmt = this.db.prepare(`
      INSERT INTO quick_save_presets (label, amount, sort_order, is_enabled)
      VALUES (?, ?, ?, ?)
    `);

    this.db.transaction(() => {
      deleteStmt.run();
      for (const p of presets) {
        insertStmt.run(p.label, p.amount, p.sort_order, p.is_enabled ?? 1);
      }
    })();

    return this.getPresets();
  }

  // ==================== WISHLIST ITEMS ====================
  getWishlistItems() {
    const items = this.db.prepare(`
      SELECT w.*,
        COALESCE(SUM(CASE WHEN t.type = 'contribution' THEN t.amount WHEN t.type = 'withdrawal' THEN -t.amount ELSE 0 END), 0) as saved_amount,
        COUNT(t.id) as contribution_count
      FROM wishlist_items w
      LEFT JOIN transactions t ON t.goal_id = w.id
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `).all() as any[];

    return items.map(item => {
      const saved = Math.max(0, item.saved_amount || 0);
      const remaining = Math.max(0, item.target_amount - saved);
      const progress = item.target_amount > 0 ? Math.round((saved / item.target_amount) * 1000) / 10 : 0;
      return {
        ...item,
        image_path: resolveImageToDataUrl(item.image_path),
        saved_amount: saved,
        remaining_amount: remaining,
        progress_percentage: progress,
      };
    });
  }

  getWishlistItem(id: string) {
    const item = this.db.prepare(`
      SELECT w.*,
        COALESCE(SUM(CASE WHEN t.type = 'contribution' THEN t.amount WHEN t.type = 'withdrawal' THEN -t.amount ELSE 0 END), 0) as saved_amount,
        COUNT(t.id) as contribution_count
      FROM wishlist_items w
      LEFT JOIN transactions t ON t.goal_id = w.id
      WHERE w.id = ?
      GROUP BY w.id
    `).get(id) as any;

    if (!item) return null;

    const saved = Math.max(0, item.saved_amount || 0);
    const remaining = Math.max(0, item.target_amount - saved);
    const progress = item.target_amount > 0 ? Math.round((saved / item.target_amount) * 1000) / 10 : 0;

    // Get item contributions
    const transactions = this.db.prepare(`
      SELECT * FROM transactions WHERE goal_id = ? ORDER BY transaction_date ASC
    `).all(id) as any[];

    return {
      ...item,
      image_path: resolveImageToDataUrl(item.image_path),
      saved_amount: saved,
      remaining_amount: remaining,
      progress_percentage: progress,
      transactions,
    };
  }

  createWishlistItem(data: any) {
    const id = (data.id && typeof data.id === 'string') ? data.id : (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO wishlist_items (
        id, name, category, brand, model, description, image_path, product_url,
        target_amount, current_price, currency_code, priority, target_date, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name,
      data.category || 'Other',
      data.brand || null,
      data.model || null,
      data.description || null,
      data.image_path || null,
      data.product_url || null,
      data.target_amount,
      data.current_price || null,
      data.currency_code || 'USD',
      data.priority || 'medium',
      data.target_date || null,
      data.status || 'active',
      now,
      now
    );

    return this.getWishlistItem(id);
  }

  updateWishlistItem(id: string, data: any) {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
    const setClause = fields.map(k => `${k} = ?`).join(', ');
    const values = fields.map(k => data[k]);
    values.push(new Date().toISOString());
    values.push(id);

    this.db.prepare(`
      UPDATE wishlist_items
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `).run(...values);

    return this.getWishlistItem(id);
  }

  deleteWishlistItem(id: string) {
    return this.db.transaction(() => {
      // Unlink or delete transactions according to requirement
      this.db.prepare('DELETE FROM wishlist_items WHERE id = ?').run(id);
      return { success: true };
    })();
  }

  // ==================== TRANSACTIONS ====================
  getTransactions(filter?: { goal_id?: string; type?: string; from_date?: string; to_date?: string }) {
    let query = `
      SELECT t.*, w.name as goal_name, w.image_path as goal_image
      FROM transactions t
      LEFT JOIN wishlist_items w ON w.id = t.goal_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.goal_id) {
      query += ' AND t.goal_id = ?';
      params.push(filter.goal_id);
    }
    if (filter?.type) {
      query += ' AND t.type = ?';
      params.push(filter.type);
    }
    if (filter?.from_date) {
      query += ' AND t.transaction_date >= ?';
      params.push(filter.from_date);
    }
    if (filter?.to_date) {
      query += ' AND t.transaction_date <= ?';
      params.push(filter.to_date);
    }

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

    return this.db.prepare(query).all(...params);
  }

  createTransaction(data: {
    goal_id?: string | null;
    type: 'contribution' | 'withdrawal' | 'adjustment';
    amount: number;
    currency_code?: string;
    transaction_date: string;
    note?: string | null;
  }) {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    return this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO transactions (
          id, goal_id, type, amount, currency_code, transaction_date, note, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.goal_id || null,
        data.type,
        data.amount,
        data.currency_code || 'USD',
        data.transaction_date,
        data.note || null,
        now,
        now
      );

      // Check if goal reached target and update completed_at status if completed
      if (data.goal_id) {
        const item = this.getWishlistItem(data.goal_id);
        if (item && item.saved_amount >= item.target_amount && item.status === 'active') {
          this.db.prepare(`
            UPDATE wishlist_items
            SET status = 'completed', completed_at = ?, updated_at = ?
            WHERE id = ?
          `).run(now, now, data.goal_id);
        }
      }

      return this.db.prepare(`
        SELECT t.*, w.name as goal_name, w.image_path as goal_image
        FROM transactions t
        LEFT JOIN wishlist_items w ON w.id = t.goal_id
        WHERE t.id = ?
      `).get(id);
    })();
  }

  updateTransaction(id: string, data: any) {
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
    const setClause = fields.map(k => `${k} = ?`).join(', ');
    const values = fields.map(k => data[k]);
    values.push(new Date().toISOString());
    values.push(id);

    this.db.prepare(`
      UPDATE transactions
      SET ${setClause}, updated_at = ?
      WHERE id = ?
    `).run(...values);

    return this.db.prepare(`
      SELECT t.*, w.name as goal_name, w.image_path as goal_image
      FROM transactions t
      LEFT JOIN wishlist_items w ON w.id = t.goal_id
      WHERE t.id = ?
    `).get(id);
  }

  deleteTransaction(id: string) {
    this.db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return { success: true };
  }

  // ==================== DASHBOARD & HEATMAP ====================
  getDashboardData(todayStr: string) {
    const settings = this.getSettings() as any;

    // Total saved calculation from actual transactions
    const totalSavedRow = this.db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN type = 'contribution' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END), 0) as total
      FROM transactions
    `).get() as { total: number };
    const totalSaved = Math.max(0, totalSavedRow.total || 0);

    // Total wishlist target (active items)
    const totalTargetRow = this.db.prepare(`
      SELECT COALESCE(SUM(target_amount), 0) as total
      FROM wishlist_items
      WHERE status IN ('active', 'completed')
    `).get() as { total: number };
    const totalWishlistTarget = totalTargetRow.total || 0;

    const remainingAmount = Math.max(0, totalWishlistTarget - totalSaved);
    const overallProgress = totalWishlistTarget > 0 ? Math.round((totalSaved / totalWishlistTarget) * 1000) / 10 : 0;

    // Amount saved this month
    const curYearMonth = todayStr.substring(0, 7); // YYYY-MM
    const thisMonthRow = this.db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN type = 'contribution' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END), 0) as total
      FROM transactions
      WHERE transaction_date LIKE ?
    `).get(`${curYearMonth}%`) as { total: number };
    const amountSavedThisMonth = Math.max(0, thisMonthRow.total || 0);

    // Today saved
    const todayRow = this.db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN type = 'contribution' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END), 0) as total
      FROM transactions
      WHERE transaction_date = ?
    `).get(todayStr) as { total: number };
    const todaySaved = Math.max(0, todayRow.total || 0);
    const todayTarget = settings.daily_goal_amount;
    const todayRemaining = Math.max(0, todayTarget - todaySaved);
    const todayProgress = todayTarget > 0 ? Math.round((todaySaved / todayTarget) * 1000) / 10 : 0;

    // Streaks
    const savingDays = this.db.prepare(`
      SELECT DISTINCT transaction_date
      FROM transactions
      WHERE type = 'contribution' AND amount > 0
      ORDER BY transaction_date ASC
    `).all() as Array<{ transaction_date: string }>;
    
    // Recent transactions
    const recentTransactions = this.db.prepare(`
      SELECT t.*, w.name as goal_name, w.image_path as goal_image
      FROM transactions t
      LEFT JOIN wishlist_items w ON w.id = t.goal_id
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT 8
    `).all();

    // Active wishlist
    const activeWishlist = this.getWishlistItems().filter(i => i.status === 'active').slice(0, 6);

    return {
      summary: {
        totalSaved,
        totalWishlistTarget,
        remainingAmount,
        overallProgress,
        amountSavedThisMonth,
        todaySaved,
        todayTarget,
        todayRemaining,
        todayProgress,
      },
      savingDates: savingDays.map(d => d.transaction_date),
      recentTransactions,
      activeWishlist,
    };
  }

  getYearHeatmapData(year: number) {
    const settings = this.getSettings() as any;
    const dailyTarget = settings.daily_goal_amount || 500;

    const rows = this.db.prepare(`
      SELECT 
        t.transaction_date,
        COALESCE(SUM(CASE WHEN t.type = 'contribution' THEN t.amount ELSE 0 END), 0) as saved_amount,
        COALESCE(SUM(CASE WHEN t.type = 'withdrawal' THEN t.amount ELSE 0 END), 0) as withdrawal_amount,
        COUNT(t.id) as contribution_count
      FROM transactions t
      WHERE t.transaction_date LIKE ?
      GROUP BY t.transaction_date
    `).all(`${year}%`) as Array<{
      transaction_date: string;
      saved_amount: number;
      withdrawal_amount: number;
      contribution_count: number;
    }>;

    const daysMap: Record<string, any> = {};
    let totalSaved = 0;
    let savingDaysCount = 0;

    for (const r of rows) {
      const netSaved = Math.max(0, r.saved_amount);
      totalSaved += netSaved;
      if (netSaved > 0) savingDaysCount++;

      // Intensity level (0-4) based on user daily saving goal:
      // Level 0: $0
      // Level 1: > 0 and < 25%
      // Level 2: 25% to < 50%
      // Level 3: 50% to < 100%
      // Level 4: >= 100%
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (netSaved > 0) {
        const ratio = netSaved / dailyTarget;
        if (ratio >= 1.0) level = 4;
        else if (ratio >= 0.5) level = 3;
        else if (ratio >= 0.25) level = 2;
        else level = 1;
      }

      daysMap[r.transaction_date] = {
        date: r.transaction_date,
        savedAmount: netSaved,
        withdrawalAmount: r.withdrawal_amount,
        contributionCount: r.contribution_count,
        targetAmount: dailyTarget,
        level,
        reachedTarget: netSaved >= dailyTarget,
      };
    }

    const averagePerSavingDay = savingDaysCount > 0 ? Math.round(totalSaved / savingDaysCount) : 0;

    return {
      year,
      totalSaved,
      savingDaysCount,
      averagePerSavingDay,
      days: daysMap,
    };
  }
}
