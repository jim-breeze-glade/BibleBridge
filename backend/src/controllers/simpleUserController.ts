/**
 * Simplified User API controllers for BibleBridge
 */

import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { asyncHandler } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get user's current position
 * GET /api/user/position
 */
export const getUserPosition = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'default';
  
  logger.info('API: Get user position', { userId });
  
  const position = await userService.getUserPosition(userId);
  
  res.json({
    success: true,
    data: position
  });
});

/**
 * Save user's current position
 * POST /api/user/position
 */
export const saveUserPosition = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'default';
  const { book, chapter, verse, translation } = req.body;
  
  if (!book || !chapter) {
    return res.status(400).json({
      success: false,
      error: 'Book and chapter are required'
    });
  }
  
  logger.info('API: Save user position', { userId, book, chapter });
  
  const position = await userService.saveUserPosition({
    book,
    chapter: parseInt(chapter),
    verse: verse ? parseInt(verse) : undefined,
    translation
  }, userId);
  
  res.json({
    success: true,
    data: position
  });
});

/**
 * Get user settings
 * GET /api/user/settings
 */
export const getUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'default';
  
  logger.info('API: Get user settings', { userId });
  
  const settings = await userService.getUserSettings(userId);
  
  res.json({
    success: true,
    data: settings
  });
});

/**
 * Save user settings
 * POST /api/user/settings
 */
export const saveUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string || 'default';
  
  logger.info('API: Save user settings', { userId });
  
  const settings = await userService.saveUserSettings(req.body, userId);
  
  res.json({
    success: true,
    data: settings
  });
});