/**
 * Configuration management for BibleBridge Backend
 */

import dotenv from 'dotenv';
import path from 'path';
import { ServerConfig } from '../types';

dotenv.config();

/**
 * Parse comma-separated string to array
 */
function parseStringArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Parse integer with default
 */
function parseInt(value: string | undefined, defaultValue: number): number {
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get configuration from environment variables
 */
export const config: ServerConfig = {
  port: parseInt(process.env['PORT'], 3000),
  host: process.env['HOST'] || 'localhost',
  env: process.env['NODE_ENV'] || 'development',
  
  cors: {
    origin: parseStringArray(
      process.env['CORS_ORIGIN'],
      ['http://localhost:3001', 'http://localhost:3000']
    ),
  },
  
  tts: {
    serviceUrl: process.env['TTS_SERVICE_URL'] || 'http://localhost:5001',
    timeout: parseInt(process.env['TTS_TIMEOUT_MS'], 30000),
  },
  
  cache: {
    ttl: parseInt(process.env['CACHE_TTL_SECONDS'], 3600),
    maxSize: parseInt(process.env['MAX_CACHE_SIZE_MB'], 100) * 1024 * 1024, // Convert MB to bytes
  },
  
  rateLimit: {
    windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'], 15 * 60 * 1000), // 15 minutes
    maxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'], 100),
  },
  
  paths: {
    translations: path.resolve(process.env['TRANSLATIONS_PATH'] || '../translations'),
    pronunciations: path.resolve(process.env['PRONUNCIATIONS_PATH'] || '../data/pronunciations'),
    userData: path.resolve(process.env['USER_DATA_PATH'] || './data/users'),
  },
};

/**
 * Validate configuration
 */
export function validateConfig(): void {
  const errors: string[] = [];
  
  if (config.port < 1 || config.port > 65535) {
    errors.push('PORT must be between 1 and 65535');
  }
  
  if (!config.host) {
    errors.push('HOST is required');
  }
  
  if (!['development', 'production', 'test'].includes(config.env)) {
    errors.push('NODE_ENV must be development, production, or test');
  }
  
  if (config.cache.ttl < 0) {
    errors.push('CACHE_TTL_SECONDS must be non-negative');
  }
  
  if (config.cache.maxSize < 0) {
    errors.push('MAX_CACHE_SIZE_MB must be non-negative');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Environment-specific settings
 */
export const isDevelopment = config.env === 'development';
export const isProduction = config.env === 'production';
export const isTest = config.env === 'test';

/**
 * Feature flags based on environment
 */
export const features = {
  enableApiDocs: process.env['ENABLE_API_DOCS'] !== 'false' && !isProduction,
  enableDetailedErrors: isDevelopment,
  enableRequestLogging: !isTest,
};