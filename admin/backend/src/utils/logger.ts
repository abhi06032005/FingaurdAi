import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, symbol, durationMs, ...meta }) => {
    let logMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    if (symbol) logMessage += ` | Symbol: ${symbol}`;
    if (durationMs !== undefined) logMessage += ` | Duration: ${durationMs}ms`;
    if (Object.keys(meta).length > 0) {
      logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
    return logMessage;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ]
});
