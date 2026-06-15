"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKolkataDate = getKolkataDate;
exports.formatKolkataDate = formatKolkataDate;
exports.isMarketHolidayOrWeekend = isMarketHolidayOrWeekend;
const date_fns_tz_1 = require("date-fns-tz");
const constants_1 = require("../config/constants");
const TIMEZONE = 'Asia/Kolkata';
/**
 * Returns a Date object converted or represented in Asia/Kolkata timezone
 */
function getKolkataDate(dateInput) {
    const input = dateInput ?? new Date();
    return (0, date_fns_tz_1.toZonedTime)(new Date(input), TIMEZONE);
}
/**
 * Formats a date in Asia/Kolkata timezone
 */
function formatKolkataDate(dateInput, formatStr) {
    const date = new Date(dateInput);
    const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, TIMEZONE);
    return (0, date_fns_tz_1.format)(zonedDate, formatStr, { timeZone: TIMEZONE });
}
/**
 * Checks if a given date is a weekend (Saturday or Sunday) or in the Indian market holiday list
 */
function isMarketHolidayOrWeekend(dateInput) {
    const date = new Date(dateInput);
    const zonedDate = (0, date_fns_tz_1.toZonedTime)(date, TIMEZONE);
    const day = zonedDate.getDay();
    // 0 is Sunday, 6 is Saturday
    if (day === 0 || day === 6) {
        return true;
    }
    const dateString = (0, date_fns_tz_1.format)(zonedDate, 'yyyy-MM-dd', { timeZone: TIMEZONE });
    return constants_1.INDIAN_MARKET_HOLIDAYS_2025.includes(dateString);
}
