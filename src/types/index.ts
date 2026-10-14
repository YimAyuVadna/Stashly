export type TransactionType = 'contribution' | 'withdrawal' | 'adjustment';
export type WishlistStatus = 'active' | 'completed' | 'paused' | 'archived';
export type WishlistPriority = 'low' | 'medium' | 'high';

export interface WishlistItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  description?: string;
  image_path?: string;
  product_url?: string;
  target_amount: number; // in cents
  current_price?: number; // in cents
  currency_code: string;
  priority: WishlistPriority;
  target_date?: string; // YYYY-MM-DD
  planned_daily_rate?: number; // planned saving amount per day in cents (e.g. 100 for $1.00/day)
  status: WishlistStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  // Computed fields
  saved_amount?: number;
  remaining_amount?: number;
  progress_percentage?: number;
  contribution_count?: number;
  average_contribution?: number;
  estimated_completion_date?: string | null;
}

export interface Transaction {
  id: string;
  goal_id?: string | null; // null for general savings
  goal_name?: string | null; // joined
  goal_image?: string | null; // joined
  type: TransactionType;
  amount: number; // in cents
  currency_code: string;
  transaction_date: string; // YYYY-MM-DD
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: number;
  currency_code: string;
  theme: 'dark' | 'light' | 'system';
  daily_goal_amount: number; // in cents
  weekly_goal_amount: number; // in cents
  week_start_day: number; // 0 = Sunday, 1 = Monday
  heatmap_scale_mode: 'daily_goal' | 'fixed_range';
  created_at: string;
  updated_at: string;
}

export interface QuickSavePreset {
  id: number;
  label: string;
  amount: number; // in cents
  sort_order: number;
  is_enabled: boolean;
}

export interface DailyGoalHistory {
  id: number;
  goal_amount: number;
  effective_from: string;
  effective_until?: string;
  is_rest_day: boolean;
  created_at: string;
}

export interface DashboardSummary {
  totalSaved: number;
  totalWishlistTarget: number;
  remainingAmount: number;
  overallProgress: number;
  currentStreak: number;
  longestStreak: number;
  amountSavedThisMonth: number;
  todaySaved: number;
  todayTarget: number;
  todayRemaining: number;
  todayProgress: number;
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  savedAmount: number; // cents (contributions)
  withdrawalAmount: number; // cents (withdrawals)
  isNetNegative?: boolean; // true if withdrawals > deposits
  contributionCount: number;
  targetAmount: number;
  level: 0 | 1 | 2 | 3 | 4;
  reachedTarget: boolean;
  items: Array<{ id: string; name: string; amount: number }>;
}

export interface HeatmapStats {
  year: number;
  totalSaved: number;
  savingDaysCount: number;
  longestStreak: number;
  averagePerSavingDay: number;
  days: Record<string, DayActivity>;
}
