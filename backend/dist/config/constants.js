"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDIAN_MARKET_HOLIDAYS_2025 = exports.INDICATOR_WEIGHTS = exports.NIFTY_50_SYMBOLS = void 0;
const analysis_schema_1 = require("../schemas/analysis.schema");
Object.defineProperty(exports, "NIFTY_50_SYMBOLS", { enumerable: true, get: function () { return analysis_schema_1.NIFTY_50_SYMBOLS; } });
exports.INDICATOR_WEIGHTS = {
    RSI: 20,
    MACD: 20,
    MOVING_AVERAGES: 20, // 5 pts each across SMA50, SMA200, EMA50, EMA200
    ADX: 15,
    BOLLINGER: 10,
    STOCH_RSI: 10,
    OBV: 5,
};
exports.INDIAN_MARKET_HOLIDAYS_2025 = [
    '2025-01-26', // Republic Day
    '2025-02-26', // Mahashivratri
    '2025-03-14', // Holi
    '2025-04-14', // Dr. Babasaheb Ambedkar Jayanti
    '2025-04-18', // Good Friday
    '2025-05-01', // Maharashtra Day
    '2025-06-05', // Id-Ul-Zuha (Bakri Id)
    '2025-07-05', // Moharram
    '2025-08-15', // Independence Day
    '2025-09-05', // Ganesh Chaturthi
    '2025-10-02', // Mahatma Gandhi Jayanti
    '2025-10-20', // Diwali / Laxmi Puja
    '2025-11-05', // Gurunanak Jayanti
    '2025-12-25', // Christmas
];
