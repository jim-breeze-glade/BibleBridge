/**
 * Simplified Bible API controllers for BibleBridge
 */

import { Request, Response } from 'express';
import { bibleService } from '../services/bibleService';
import { asyncHandler } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get list of available Bible translations
 * GET /api/translations
 */
export const getTranslations = asyncHandler(async (_req: Request, res: Response) => {
  logger.info('API: Get translations');
  
  const translations = await bibleService.getTranslations();
  
  res.json({
    success: true,
    data: translations
  });
});

/**
 * Get list of all Bible books with metadata
 * GET /api/books
 */
export const getBooks = asyncHandler(async (_req: Request, res: Response) => {
  logger.info('API: Get books');
  
  const books = await bibleService.getBooks();
  
  // Group by testament
  const oldTestament = books.filter(book => book.testament === 'Old Testament');
  const newTestament = books.filter(book => book.testament === 'New Testament');
  
  res.json({
    success: true,
    data: {
      books,
      grouped: {
        'Old Testament': oldTestament,
        'New Testament': newTestament,
      }
    }
  });
});

/**
 * Get specific chapter data with verses
 * GET /api/translations/:translation/:book/:chapter
 */
export const getChapter = asyncHandler(async (req: Request, res: Response) => {
  const { translation, book, chapter } = req.params;
  
  if (!translation || !book || !chapter) {
    return res.status(400).json({
      success: false,
      error: 'Translation, book, and chapter parameters are required',
    });
  }
  
  const chapterNum = parseInt(chapter);
  
  if (isNaN(chapterNum) || chapterNum < 1) {
    return res.status(400).json({
      success: false,
      error: 'Chapter must be a positive number',
    });
  }
  
  logger.info('API: Get chapter', { translation, book, chapter: chapterNum });
  
  const chapterData = await bibleService.getChapter(translation, book, chapterNum);
  
  res.json({
    success: true,
    data: chapterData
  });
});

/**
 * Search Bible text
 * GET /api/search/:translation?q=searchterm
 */
export const searchBible = asyncHandler(async (req: Request, res: Response) => {
  const { translation } = req.params;
  const { q: query, limit = '50', offset = '0' } = req.query;
  
  if (!translation) {
    return res.status(400).json({
      success: false,
      error: 'Translation parameter is required',
    });
  }
  
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query (q) must be at least 2 characters long',
    });
  }
  
  const searchQuery = {
    query: query.trim(),
    translation,
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  };
  
  const results = await bibleService.searchBible(searchQuery);
  
  res.json({
    success: true,
    data: results
  });
});