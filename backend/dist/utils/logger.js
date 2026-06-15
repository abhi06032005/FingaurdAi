"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, symbol, durationMs, ...meta }) => {
    let logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    if (symbol)
        logMessage += ` | Symbol: ${symbol}`;
    if (durationMs !== undefined)
        logMessage += ` | Duration: ${durationMs}ms`;
    if (Object.keys(meta).length > 0) {
        logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
    return logMessage;
}));
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat)
        })
    ]
});
