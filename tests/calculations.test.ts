import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  parseToCents,
  calculateRemaining,
  calculateProgress,
  toLocalDateString,
  calculateStreaks,
  estimateCompletionDate
} from '../src/utils/calculations';

describe('Money and Calculation Utilities', () => {
  it('formats currency in cents accurately', () => {
    expect(formatCurrency(250, 'USD')).toBe('$2.50');
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
    expect(formatCurrency(19999, 'USD')).toBe('$199.99');
  });

  it('parses string amounts to integer cents', () => {
    expect(parseToCents('2.50')).toBe(250);
    expect(parseToCents('$199.99')).toBe(19999);
    expect(parseToCents('0.05')).toBe(5);
    expect(parseToCents(10.25)).toBe(1025);
    expect(parseToCents('invalid')).toBe(0);
  });

  it('calculates remaining amounts clamped to zero', () => {
    expect(calculateRemaining(20000, 5000)).toBe(15000);
    expect(calculateRemaining(20000, 20000)).toBe(0);
    expect(calculateRemaining(20000, 25000)).toBe(0);
  });

  it('calculates progress percentage accurately', () => {
    expect(calculateProgress(20000, 5000)).toBe(25);
    expect(calculateProgress(20000, 20000)).toBe(100);
    expect(calculateProgress(20000, 10000)).toBe(50);
    expect(calculateProgress(0, 100)).toBe(100);
  });

  it('computes saving streaks without cheating', () => {
    const today = toLocalDateString(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = toLocalDateString(yesterdayDate);

    const prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 2);
    const twoDaysAgo = toLocalDateString(prevDate);

    // Streak with 3 consecutive days ending today
    const { currentStreak, longestStreak } = calculateStreaks([twoDaysAgo, yesterday, today]);
    expect(currentStreak).toBe(3);
    expect(longestStreak).toBe(3);

    // Empty list
    expect(calculateStreaks([])).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('estimates completion date correctly', () => {
    expect(estimateCompletionDate(0)).toBe('Completed');
    expect(estimateCompletionDate(1000, undefined, 0)).toBeNull();
  });
});
