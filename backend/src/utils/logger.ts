/**
 * Centralized logging utility for BibleBridge Backend
 */

import winston from 'winston';
import { isDevelopment } from './config';

/**
 * Custom log format for development
 */
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

/**
 * Custom log format for production
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: isDevelopment ? developmentFormat : productionFormat,
  defaultMeta: { service: 'biblebridge-backend' },
  transports: [
    new winston.transports.Console({
      silent: process.env['NODE_ENV'] === 'test',
    }),
  ],
});

/**
 * Add file logging in production
 */
if (!isDevelopment) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

/**
 * Create request logger middleware
 */
export function createRequestLogger() {
  return winston.format.printf(({ timestamp, level, message, meta }) => {
    if (meta && (meta as any).req) {
      const { method, url, ip, userAgent } = (meta as any).req;
      const { statusCode, responseTime } = (meta as any).res || {};
      return `${timestamp} [${level}] ${method} ${url} - ${statusCode || 'pending'} - ${responseTime || 0}ms - ${ip} - ${userAgent}`;
    }
    return `${timestamp} [${level}] ${message}`;
  });
}

/**
 * Request logging middleware
 */
export function logRequest(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    
    logger.log(logLevel, 'HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: duration,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'unknown',
    });
  });
  
  next();
}

/**
 * Error logging helper
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

/**
 * Performance logging helper
 */
export function logPerformance(operation: string, duration: number, context?: Record<string, any>) {
  const level = duration > 1000 ? 'warn' : 'info'; // Warn if operation takes >1s
  
  logger.log(level, `Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...context,
  });
}

/**
 * API operation logging helper
 */
export function logApiCall(endpoint: string, method: string, params?: Record<string, any>) {
  logger.info(`API Call: ${method} ${endpoint}`, params);
}