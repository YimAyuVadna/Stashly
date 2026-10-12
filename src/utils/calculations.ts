/**
 * Formats integer minor units (cents) into a localized currency string.
 */
export function formatCurrency(cents: number, currencyCode = 'USD'): string {
  const value = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Parses a decimal string (e.g. "12.50") into integer cents (1250).
 */
export function parseToCents(amountStr: string | number): number {
  if (typeof amountStr === 'number') {
    return Math.round(amountStr * 100);
  }
  const clean = amountStr.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Calculates remaining amount clamped to zero.
 */
export function calculateRemaining(targetCents: number, savedCents: number): number {
  return Math.max(0, targetCents - savedCents);
}

/**
 * Calculates progress percentage capped or uncapped.
 */
export function calculateProgress(targetCents: number, savedCents: number): number {
  if (targetCents <= 0) return savedCents > 0 ? 100 : 0;
  return Math.round((savedCents / targetCents) * 1000) / 10;
}

/**
 * Converts a Date to YYYY-MM-DD local calendar string.
 */
export function toLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates continuous saving streak.
 * A saving day is a day with > 0 qualifying contribution cents.
 */
export function calculateStreaks(savingDates: string[]): { currentStreak: number; longestStreak: number } {
  if (!savingDates || savingDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Unique sorted dates
  const uniqueDates = Array.from(new Set(savingDates)).sort();
  const dateSet = new Set(uniqueDates);

  let longest = 0;
  let currentRun = 0;

  // Find longest consecutive sequence
  for (let i = 0; i < uniqueDates.length; i++) {
    const cur = new Date(uniqueDates[i] + 'T00:00:00');
    if (i === 0) {
      currentRun = 1;
    } else {
      const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
      const diffDays = Math.round((cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentRun++;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > longest) {
      longest = currentRun;
    }
  }

  // Current streak counting backwards from today or yesterday
  const today = toLocalDateString(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = toLocalDateString(yesterdayDate);

  let currentStreak = 0;
  let checkDate = new Date();

  // If saved today, start from today. If not saved today but saved yesterday, streak is alive from yesterday.
  if (dateSet.has(today)) {
    checkDate = new Date();
  } else if (dateSet.has(yesterday)) {
    checkDate = yesterdayDate;
  } else {
    return { currentStreak: 0, longestStreak: longest };
  }

  while (true) {
    const dateStr = toLocalDateString(checkDate);
    if (dateSet.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak: Math.max(longest, currentStreak) };
}

/**
 * Calculates estimated completion date based on average contribution rate.
 */
export function estimateCompletionDate(
  remainingCents: number,
  firstDateStr?: string,
  totalSavedCents?: number
): string | null {
  if (remainingCents <= 0) return 'Completed';
  if (!firstDateStr || !totalSavedCents || totalSavedCents <= 0) return null;

  const firstDate = new Date(firstDateStr + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.max(1, Math.round((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const dailyRate = totalSavedCents / diffDays;
  if (dailyRate <= 0) return null;

  const daysNeeded = Math.ceil(remainingCents / dailyRate);
  if (daysNeeded > 3650) return '> 10 years'; // Too far out

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysNeeded);
  return toLocalDateString(targetDate);
}

/**
 * Calculates number of days remaining until goal is complete.
 * If target_date is set by user, calculates days between now and target_date.
 * Otherwise, calculates days needed based on saving rate or daily goal amount.
 */
export function calculateDaysRemaining(
  remainingCents: number,
  targetDateStr?: string,
  firstDateStr?: string,
  totalSavedCents?: number,
  fallbackDailyGoalCents?: number
): { days: number | null; label: string } {
  if (remainingCents <= 0) {
    return { days: 0, label: 'Goal Reached' };
  }

  // 1. If explicit target date is set by the user:
  if (targetDateStr) {
    const target = new Date(targetDateStr + 'T00:00:00');
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return { days: 0, label: 'Due Today' };
    }
    return { days: diffDays, label: `${diffDays} days left` };
  }

  // 2. Otherwise calculate based on contribution velocity:
  if (firstDateStr && totalSavedCents && totalSavedCents > 0) {
    const firstDate = new Date(firstDateStr + 'T00:00:00');
    const now = new Date();
    const elapsedDays = Math.max(1, Math.round((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyRate = totalSavedCents / elapsedDays;
    if (dailyRate > 0) {
      const needed = Math.ceil(remainingCents / dailyRate);
      if (needed <= 3650) {
        return { days: needed, label: `~${needed} days left` };
      }
    }
  }

  // 3. Fallback to daily goal quota (e.g. at $5/day, $200 = 40 days left):
  const dailyTarget = fallbackDailyGoalCents && fallbackDailyGoalCents > 0 ? fallbackDailyGoalCents : 500;
  const daysAtDailyRate = Math.ceil(remainingCents / dailyTarget);
  return { days: daysAtDailyRate, label: `~${daysAtDailyRate} days left` };
}
