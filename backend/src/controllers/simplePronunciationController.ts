/**
 * Simplified Pronunciation API controllers for BibleBridge
 */

import { Request, Response } from 'express';
import { pronunciationService } from '../services/pronunciationService';
import { asyncHandler } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get all pronunciation data
 * GET /api/pronunciations
 */
export const getAllPronunciations = asyncHandler(async (_req: Request, res: Response) => {
  logger.info('API: Get all pronunciations');
  
  const pronunciations = await pronunciationService.getAllPronunciations();
  
  res.json({
    success: true,
    data: pronunciations
  });
});

/**
 * Get pronunciation for a specific name
 * GET /api/pronunciations/:name
 */
export const getPronunciation = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Name parameter is required'
    });
  }
  
  logger.info('API: Get pronunciation', { name });
  
  const pronunciation = await pronunciationService.getPronunciation(name);
  
  if (!pronunciation) {
    return res.status(404).json({
      success: false,
      error: `No pronunciation found for '${name}'`
    });
  }
  
  res.json({
    success: true,
    data: {
      name,
      ...pronunciation
    }
  });
});

/**
 * Search pronunciations by partial name match
 * GET /api/pronunciations/search?q=searchterm
 */
export const searchPronunciations = asyncHandler(async (req: Request, res: Response) => {
  const { q: query } = req.query;
  
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query (q) must be at least 2 characters long'
    });
  }
  
  logger.info('API: Search pronunciations', { query });
  
  const results = await pronunciationService.searchNames(query.trim());
  
  res.json({
    success: true,
    data: {
      query: query.trim(),
      results
    }
  });
});