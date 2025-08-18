/**
 * Pronunciation API route controllers
 */

import { Request, Response } from 'express';
import { pronunciationService } from '../services/pronunciationService';
import { asyncHandler } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get all biblical name pronunciations
 * GET /api/pronunciations
 */
export const getAllPronunciations = asyncHandler(async (req: Request, res: Response) => {
  logger.info('API: Get all pronunciations');
  
  const pronunciations = await pronunciationService.getAllPronunciations();
  const stats = await pronunciationService.getStatistics();
  
  res.json({
    success: true,
    data: {
      pronunciations: pronunciations.names,
      statistics: stats,
    },
    meta: {
      totalNames: stats.totalNames,
      lastUpdated: new Date().toISOString(),
    },
  });
});

/**
 * Get pronunciation for a specific biblical name
 * GET /api/pronunciations/:name
 */
export const getPronunciation = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;
  
  logger.info('API: Get pronunciation', { name });
  
  const pronunciation = await pronunciationService.getPronunciation(name);
  
  if (!pronunciation) {
    return res.status(404).json({
      success: false,
      error: `No pronunciation found for "${name}"`,
      suggestions: await getSuggestions(name),
    });
  }
  
  res.json({
    success: true,
    data: {
      name,
      pronunciation,
    },
  });
});

/**
 * Search biblical names by partial match
 * GET /api/pronunciations/search?query=...
 */
export const searchPronunciations = asyncHandler(async (req: Request, res: Response) => {
  const { query, limit = 20 } = req.query as any;
  
  logger.info('API: Search pronunciations', { query, limit });
  
  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters long',
    });
  }
  
  const results = await pronunciationService.searchNames(query.trim(), parseInt(limit));
  
  res.json({
    success: true,
    data: {
      query: query.trim(),
      results,
    },
    meta: {
      totalResults: results.length,
      limit: parseInt(limit),
    },
  });
});

/**
 * Get biblical names by first letter (for alphabetical browsing)
 * GET /api/pronunciations/letter/:letter
 */
export const getNamesByLetter = asyncHandler(async (req: Request, res: Response) => {
  const { letter } = req.params;
  
  logger.info('API: Get names by letter', { letter });
  
  const results = await pronunciationService.getNamesByLetter(letter);
  
  res.json({
    success: true,
    data: {
      letter: letter.toUpperCase(),
      names: results,
    },
    meta: {
      count: results.length,
    },
  });
});

/**
 * Get pronunciation in specific format
 * GET /api/pronunciations/:name/:format
 */
export const getPronunciationFormat = asyncHandler(async (req: Request, res: Response) => {
  const { name, format } = req.params;
  
  logger.info('API: Get pronunciation format', { name, format });
  
  if (!['phonetic', 'ipa', 'phoneme'].includes(format)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid format. Must be one of: phonetic, ipa, phoneme',
    });
  }
  
  const pronunciation = await pronunciationService.getPronunciationFormat(
    name, 
    format as 'phonetic' | 'ipa' | 'phoneme'
  );
  
  if (!pronunciation) {
    return res.status(404).json({
      success: false,
      error: `No ${format} pronunciation found for "${name}"`,
    });
  }
  
  res.json({
    success: true,
    data: {
      name,
      format,
      pronunciation,
    },
  });
});

/**
 * Detect biblical names in text
 * POST /api/pronunciations/detect
 */
export const detectBiblicalNames = asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;
  
  logger.info('API: Detect biblical names', { textLength: text?.length });
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Text is required and must be a string',
    });
  }
  
  if (text.length > 10000) {
    return res.status(400).json({
      success: false,
      error: 'Text too long. Maximum 10,000 characters allowed.',
    });
  }
  
  const detectedNames = await pronunciationService.detectBiblicalNames(text);
  
  res.json({
    success: true,
    data: {
      originalText: text,
      detectedNames,
      summary: {
        totalNames: detectedNames.length,
        uniqueNames: [...new Set(detectedNames.map(n => n.name))].length,
      },
    },
  });
});

/**
 * Get pronunciation statistics
 * GET /api/pronunciations/stats
 */
export const getPronunciationStats = asyncHandler(async (req: Request, res: Response) => {
  logger.info('API: Get pronunciation statistics');
  
  const stats = await pronunciationService.getStatistics();
  
  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Get alphabetical index of all names
 * GET /api/pronunciations/index
 */
export const getPronunciationIndex = asyncHandler(async (req: Request, res: Response) => {
  logger.info('API: Get pronunciation index');
  
  const pronunciations = await pronunciationService.getAllPronunciations();
  const names = Object.keys(pronunciations.names);
  
  // Group names by first letter
  const index: Record<string, string[]> = {};
  
  names.forEach(name => {
    const firstLetter = name.charAt(0).toUpperCase();
    if (!index[firstLetter]) {
      index[firstLetter] = [];
    }
    index[firstLetter].push(name);
  });
  
  // Sort names within each letter group
  Object.keys(index).forEach(letter => {
    index[letter].sort();
  });
  
  res.json({
    success: true,
    data: {
      index,
      letters: Object.keys(index).sort(),
      summary: Object.keys(index).map(letter => ({
        letter,
        count: index[letter].length,
      })),
    },
    meta: {
      totalNames: names.length,
      totalLetters: Object.keys(index).length,
    },
  });
});

/**
 * Check if pronunciation exists for a name
 * HEAD /api/pronunciations/:name
 */
export const checkPronunciationExists = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;
  
  const exists = await pronunciationService.hasPronunciation(name);
  
  if (exists) {
    res.status(200).end();
  } else {
    res.status(404).end();
  }
});

/**
 * Refresh pronunciation data from file
 * POST /api/pronunciations/refresh
 */
export const refreshPronunciationData = asyncHandler(async (req: Request, res: Response) => {
  logger.info('API: Refresh pronunciation data');
  
  await pronunciationService.refreshData();
  const stats = await pronunciationService.getStatistics();
  
  res.json({
    success: true,
    message: 'Pronunciation data refreshed successfully',
    data: {
      statistics: stats,
      refreshedAt: new Date().toISOString(),
    },
  });
});

/**
 * Get popular biblical names (most commonly searched)
 * GET /api/pronunciations/popular
 */
export const getPopularNames = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 20 } = req.query as any;
  
  logger.info('API: Get popular names', { limit });
  
  // Common biblical names that users frequently search for
  const popularNames = [
    'Abraham', 'Moses', 'David', 'Jesus', 'Mary', 'Peter', 'Paul', 'John',
    'Matthew', 'Luke', 'Mark', 'Joshua', 'Daniel', 'Isaiah', 'Jeremiah',
    'Ezekiel', 'Samuel', 'Solomon', 'Jacob', 'Isaac', 'Noah', 'Adam',
    'Eve', 'Sarah', 'Rebecca', 'Rachel', 'Leah', 'Joseph', 'Benjamin',
    'Judah', 'Gideon', 'Ruth', 'Esther', 'Job', 'Elijah', 'Elisha',
  ];
  
  const results = [];
  for (const name of popularNames.slice(0, parseInt(limit))) {
    const pronunciation = await pronunciationService.getPronunciation(name);
    if (pronunciation) {
      results.push({ name, pronunciation });
    }
  }
  
  res.json({
    success: true,
    data: {
      popularNames: results,
    },
    meta: {
      count: results.length,
      limit: parseInt(limit),
    },
  });
});

/**
 * Helper function to get suggestions for similar names
 */
async function getSuggestions(name: string): Promise<string[]> {
  try {
    // Simple similarity search - in production, you might want a more sophisticated algorithm
    const searchResults = await pronunciationService.searchNames(name.substring(0, 3), 5);
    return searchResults.map(result => result.name);
  } catch (error) {
    return [];
  }
}