/**
 * Error handling utilities for BibleBridge Backend
 */

import { Response } from 'express';
import { logger } from './logger';
import { features } from './config';

/**
 * Custom application error classes
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, _details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`${service} service is currently unavailable`, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Error response formatter
 */
export function formatErrorResponse(error: Error): any {
  const baseResponse = {
    success: false,
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AppError) {
    return {
      ...baseResponse,
      code: error.code,
      ...(features.enableDetailedErrors && { stack: error.stack }),
    };
  }

  // Handle common errors
  if (error.name === 'ValidationError') {
    return {
      ...baseResponse,
      code: 'VALIDATION_ERROR',
      ...(features.enableDetailedErrors && { details: error }),
    };
  }

  if (error.name === 'CastError') {
    return {
      ...baseResponse,
      code: 'INVALID_ID',
      message: 'Invalid resource ID format',
    };
  }

  // Generic error response
  return {
    ...baseResponse,
    code: 'INTERNAL_ERROR',
    message: features.enableDetailedErrors ? error.message : 'Internal server error',
    ...(features.enableDetailedErrors && { stack: error.stack }),
  };
}

/**
 * Send error response
 */
export function sendErrorResponse(res: Response, error: Error): void {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const errorResponse = formatErrorResponse(error);

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error', {
      error: error.message,
      stack: error.stack,
      statusCode,
    });
  } else {
    logger.warn('Client Error', {
      error: error.message,
      statusCode,
    });
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Express error handler middleware
 */
export function errorHandler(error: Error, _req: any, res: Response, next: any): void {
  // Don't handle response if already sent
  if (res.headersSent) {
    return next(error);
  }

  sendErrorResponse(res, error);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle unhandled promise rejections
 */
export function handleUnhandledRejections(): void {
  process.on('unhandledRejection', (reason: any, _promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.toString(),
      stack: reason?.stack,
    });
    
    // In production, exit gracefully
    if (process.env['NODE_ENV'] === 'production') {
      process.exit(1);
    }
  });
}

/**
 * Handle uncaught exceptions
 */
export function handleUncaughtExceptions(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });
    
    // Exit immediately on uncaught exceptions
    process.exit(1);
  });
}

/**
 * Validation helper for required fields
 */
export function requireFields(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch (error: any) {
    logger.warn('JSON parse error', { json, error: error.message });
    return defaultValue;
  }
}