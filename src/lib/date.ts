import { format } from 'date-fns';

/**
 * Returns local calendar date as YYYY-MM-DD (avoids UTC offset shifts from toISOString()).
 */
export function getLocalDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Returns local calendar month as YYYY-MM.
 */
export function getLocalMonthString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM');
}

/**
 * Returns local timestamp formatted as 'YYYY-MM-DD HH:mm:ss'.
 */
export function getLocalTimestamp(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}
