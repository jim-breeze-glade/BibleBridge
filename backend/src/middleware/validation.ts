/**
 * Request validation middleware using Joi
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

/**
 * Validation schemas for different endpoints
 */
export const schemas = {
  // Bible endpoints
  getChapter: Joi.object({
    translation: Joi.string().valid('KJV', 'NLT', 'NIV', 'CSB').required(),
    book: Joi.string().min(2).max(50).required(),
    chapter: Joi.number().integer().min(1).max(150).required(),
  }),

  searchBible: Joi.object({
    query: Joi.string().min(2).max(200).required(),
    translation: Joi.string().valid('KJV', 'NLT', 'NIV', 'CSB').required(),
    book: Joi.string().min(2).max(50).optional(),
    testament: Joi.string().valid('Old Testament', 'New Testament').optional(),
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0),
  }),

  // Pronunciation endpoints
  getPronunciation: Joi.object({
    name: Joi.string().min(1).max(100).required(),
  }),

  searchPronunciations: Joi.object({
    query: Joi.string().min(2).max(100).required(),
    limit: Joi.number().integer().min(1).max(50).default(20),
  }),

  getNamesByLetter: Joi.object({
    letter: Joi.string().length(1).pattern(/[A-Za-z]/).required(),
  }),

  // TTS endpoints
  generateTTS: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    phonetic: Joi.string().max(200).optional(),
    ipa: Joi.string().max(200).optional(),
    phoneme: Joi.string().max(200).optional(),
    voice_settings: Joi.object({
      speed: Joi.number().min(0.1).max(3.0).optional(),
      speaker_id: Joi.number().integer().min(0).max(10).optional(),
    }).optional(),
  }),

  // User endpoints
  savePosition: Joi.object({
    book: Joi.string().min(2).max(50).required(),
    chapter: Joi.number().integer().min(1).max(150).required(),
    verse: Joi.number().integer().min(1).max(200).optional(),
    translation: Joi.string().valid('KJV', 'NLT', 'NIV', 'CSB').optional(),
  }),

  saveSettings: Joi.object({
    theme: Joi.string().valid('dark', 'light').optional(),
    fontSize: Joi.number().integer().min(8).max(72).optional(),
    fontFamily: Joi.string().max(50).optional(),
    showRedLetters: Joi.boolean().optional(),
    redLetterBrightness: Joi.number().integer().min(0).max(100).optional(),
    textBrightness: Joi.number().integer().min(0).max(100).optional(),
    rgbWaveEnabled: Joi.boolean().optional(),
    rgbWaveSpeed: Joi.number().min(0.1).max(10).optional(),
    showPronunciations: Joi.boolean().optional(),
    pronunciationStyle: Joi.string().valid('phonetic', 'ipa').optional(),
    ttsEnabled: Joi.boolean().optional(),
    leftTranslation: Joi.string().valid('KJV', 'NLT', 'NIV', 'CSB').optional(),
    rightTranslation: Joi.string().valid('KJV', 'NLT', 'NIV', 'CSB').optional(),
  }),

  // Common query parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
};

/**
 * Create validation middleware for request parameters
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ValidationError(`Invalid parameters: ${errorMessage}`));
    }

    req.params = value;
    next();
  };
}

/**
 * Create validation middleware for request body
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ValidationError(`Invalid request body: ${errorMessage}`));
    }

    req.body = value;
    next();
  };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new ValidationError(`Invalid query parameters: ${errorMessage}`));
    }

    req.query = value;
    next();
  };
}

/**
 * Validate that a book name exists
 */
export function validateBookName(req: Request, res: Response, next: NextFunction) {
  const { book } = req.params;
  
  // List of valid Bible book names
  const validBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Songs', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
    '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation'
  ];

  if (!validBooks.includes(book)) {
    return next(new ValidationError(`Invalid book name: ${book}`));
  }

  next();
}

/**
 * Validate translation parameter
 */
export function validateTranslation(req: Request, res: Response, next: NextFunction) {
  const { translation } = req.params;
  const validTranslations = ['KJV', 'NLT', 'NIV', 'CSB'];

  if (!validTranslations.includes(translation)) {
    return next(new ValidationError(`Invalid translation: ${translation}. Valid options: ${validTranslations.join(', ')}`));
  }

  next();
}

/**
 * Validate chapter number against book metadata
 */
export function validateChapterNumber(req: Request, res: Response, next: NextFunction) {
  const { chapter, book } = req.params;
  const chapterNum = parseInt(chapter);

  if (isNaN(chapterNum) || chapterNum < 1) {
    return next(new ValidationError('Chapter must be a positive number'));
  }

  // Book-specific chapter validation (you could make this more comprehensive)
  const chapterCounts: Record<string, number> = {
    'Genesis': 50, 'Exodus': 40, 'Psalms': 150, 'Proverbs': 31,
    'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21,
    'Acts': 28, 'Romans': 16, 'Revelation': 22,
    // Add more as needed
  };

  const maxChapters = chapterCounts[book];
  if (maxChapters && chapterNum > maxChapters) {
    return next(new ValidationError(`${book} only has ${maxChapters} chapters`));
  }

  next();
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Basic sanitization for common injection patterns
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[sanitizeString(key)] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Validate user ID format (if using custom user IDs)
 */
export function validateUserId(req: Request, res: Response, next: NextFunction) {
  const userId = req.params.userId || req.headers['x-user-id'] || 'default';
  
  // Basic validation for user ID
  if (typeof userId !== 'string' || userId.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
    return next(new ValidationError('Invalid user ID format'));
  }

  // Store validated user ID in request for use by controllers
  (req as any).userId = userId;
  next();
}