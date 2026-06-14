import { toDate, format, toZonedTime } from 'date-fns-tz';
import { INDIAN_MARKET_HOLIDAYS_2025 } from '../config/constants';

const TIMEZONE = 'Asia/Kolkata';

/**
 * Returns a Date object converted or represented in Asia/Kolkata timezone
 */
export function getKolkataDate(dateInput?: Date | string | number): Date {
  const input = dateInput ?? new Date();
  return toZonedTime(new Date(input), TIMEZONE);
}

/**
 * Formats a date in Asia/Kolkata timezone
 */
export function formatKolkataDate(dateInput: Date | string | number, formatStr: string): string {
  const date = new Date(dateInput);
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, formatStr, { timeZone: TIMEZONE });
}

/**
 * Checks if a given date is a weekend (Saturday or Sunday) or in the Indian market holiday list
 */
export function isMarketHolidayOrWeekend(dateInput: Date | string | number): boolean {
  const date = new Date(dateInput);
  const zonedDate = toZonedTime(date, TIMEZONE);
  const day = zonedDate.getDay();

  // 0 is Sunday, 6 is Saturday
  if (day === 0 || day === 6) {
    return true;
  }

  const dateString = format(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
  return INDIAN_MARKET_HOLIDAYS_2025.includes(dateString);
}
