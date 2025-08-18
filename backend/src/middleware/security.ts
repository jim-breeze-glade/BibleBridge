/**
 * Security middleware for BibleBridge Backend
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from '../utils/config';
import { RateLimitError, AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Rate limiting middleware
 */
export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || config.rateLimit.windowMs,
    max: options?.max || config.rateLimit.maxRequests,
    message: {
      error: options?.message || 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil((options?.windowMs || config.rateLimit.windowMs) / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options?.skipSuccessfulRequests || false,
    handler: (req: Request, res: Response, next: NextFunction) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
      });
      
      next(new RateLimitError());
    },
  });
};

/**
 * Different rate limits for different endpoints
 */
export const rateLimiters = {
  // General API rate limit
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  }),

  // Stricter rate limit for TTS generation (resource intensive)
  tts: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 TTS requests per window
    message: 'Too many TTS requests, please wait before requesting more audio',
  }),

  // Search rate limit
  search: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 search requests per minute
    message: 'Too many search requests, please slow down',
  }),

  // More lenient for static content
  static: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    skipSuccessfulRequests: true,
  }),
};

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow audio embedding
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for audio files
});

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (config.cors.origin.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow localhost on any port
    if (config.env === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    logger.warn('CORS request blocked', { origin });
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-User-ID',
    'X-API-Key',
    'Cache-Control',
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Per-Page',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],
  maxAge: 86400, // 24 hours
};

/**
 * API Key authentication middleware (optional)
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  const configuredApiKey = process.env.API_KEY;
  
  // If no API key is configured, skip authentication
  if (!configuredApiKey) {
    return next();
  }
  
  if (!apiKey || apiKey !== configuredApiKey) {
    logger.warn('Invalid API key attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      providedKey: apiKey ? '***' : 'none',
    });
    
    return next(new AuthenticationError('Invalid or missing API key'));
  }
  
  next();
}

/**
 * Request size limiting middleware
 */
export function requestSizeLimit(maxSize: string = '10mb') {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseMaxSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        logger.warn('Request size limit exceeded', {
          ip: req.ip,
          size: sizeInBytes,
          maxSize: maxSizeInBytes,
          endpoint: req.originalUrl,
        });
        
        return res.status(413).json({
          error: 'Request too large',
          maxSize,
          receivedSize: `${Math.round(sizeInBytes / 1024)}KB`,
        });
      }
    }
    
    next();
  };
}

/**
 * IP-based blocking middleware (for abuse prevention)
 */
export function ipBlocklist(blockedIPs: string[] = []) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip;
    
    if (blockedIPs.includes(clientIP)) {
      logger.warn('Blocked IP attempted access', {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
      });
      
      return res.status(403).json({
        error: 'Access forbidden',
      });
    }
    
    next();
  };
}

/**
 * Security logging middleware
 */
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  // Log suspicious activity
  const suspiciousPatterns = [
    /\.\./,           // Path traversal
    /<script/i,       // XSS attempts
    /union.*select/i, // SQL injection
    /exec\(/i,        // Code injection
    /eval\(/i,        // Code injection
  ];
  
  const url = req.originalUrl;
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body) || pattern.test(query)
  );
  
  if (isSuspicious) {
    logger.warn('Suspicious request detected', {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
    });
  }
  
  next();
}

/**
 * Slow down middleware for repeated failed requests
 */
const failedAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export function slowDown(req: Request, res: Response, next: NextFunction) {
  const key = req.ip;
  const now = new Date();
  const resetTime = 15 * 60 * 1000; // 15 minutes
  
  // Clean old entries
  for (const [ip, data] of failedAttempts.entries()) {
    if (now.getTime() - data.lastAttempt.getTime() > resetTime) {
      failedAttempts.delete(ip);
    }
  }
  
  const attempts = failedAttempts.get(key);
  
  if (attempts && attempts.count > 5) {
    const delay = Math.min(attempts.count * 1000, 10000); // Max 10 second delay
    
    logger.warn('Slowing down repeated requests', {
      ip: req.ip,
      attempts: attempts.count,
      delay,
    });
    
    setTimeout(() => next(), delay);
  } else {
    next();
  }
  
  // Track failed requests
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const current = failedAttempts.get(key) || { count: 0, lastAttempt: now };
      current.count++;
      current.lastAttempt = now;
      failedAttempts.set(key, current);
    } else {
      // Reset on successful request
      failedAttempts.delete(key);
    }
  });
}

/**
 * Helper function to parse size strings like "10mb", "500kb"
 */
function parseMaxSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+)([kmg]?b?)$/i);
  if (!match) return 1024 * 1024; // Default 1MB
  
  const [, num, unit] = match;
  const size = parseInt(num);
  
  switch (unit.toLowerCase()) {
    case 'kb': return size * 1024;
    case 'mb': return size * 1024 * 1024;
    case 'gb': return size * 1024 * 1024 * 1024;
    default: return size; // bytes
  }
}