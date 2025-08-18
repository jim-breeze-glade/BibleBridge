/**
 * User data API route controllers
 */

import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { asyncHandler } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get user's last reading position
 * GET /api/user/position
 */
export const getUserPosition = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  
  logger.info('API: Get user position', { userId });
  
  const position = await userService.getUserPosition(userId);
  
  res.json({
    success: true,
    data: {
      position,
    },
  });
});

/**
 * Save user's reading position
 * POST /api/user/position
 */
export const saveUserPosition = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  const positionData = req.body;
  
  logger.info('API: Save user position', { userId, book: positionData.book, chapter: positionData.chapter });
  
  const updatedPosition = await userService.saveUserPosition(positionData, userId);
  
  res.json({
    success: true,
    message: 'Reading position saved successfully',
    data: {
      position: updatedPosition,
    },
  });
});

/**
 * Get user settings
 * GET /api/user/settings
 */
export const getUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  
  logger.info('API: Get user settings', { userId });
  
  const settings = await userService.getUserSettings(userId);
  
  res.json({
    success: true,
    data: {
      settings,
    },
  });
});

/**
 * Save user settings
 * POST /api/user/settings
 */
export const saveUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  const settingsData = req.body;
  
  logger.info('API: Save user settings', { userId, theme: settingsData.theme });
  
  const updatedSettings = await userService.saveUserSettings(settingsData, userId);
  
  res.json({
    success: true,
    message: 'User settings saved successfully',
    data: {
      settings: updatedSettings,
    },
  });
});

/**
 * Get complete user profile (position + settings)
 * GET /api/user/profile
 */
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  
  logger.info('API: Get user profile', { userId });
  
  const profile = await userService.getUserProfile(userId);
  
  res.json({
    success: true,
    data: {
      userId,
      profile,
    },
  });
});

/**
 * Update user profile (position and/or settings)
 * PUT /api/user/profile
 */
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  const updates = req.body;
  
  logger.info('API: Update user profile', { userId, hasPosition: !!updates.position, hasSettings: !!updates.settings });
  
  const updatedProfile = await userService.updateUserProfile(updates, userId);
  
  res.json({
    success: true,
    message: 'User profile updated successfully',
    data: {
      userId,
      profile: updatedProfile,
    },
  });
});

/**
 * Reset user settings to defaults
 * POST /api/user/settings/reset
 */
export const resetUserSettings = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  
  logger.info('API: Reset user settings', { userId });
  
  const defaultSettings = await userService.resetUserSettings(userId);
  
  res.json({
    success: true,
    message: 'User settings reset to defaults',
    data: {
      settings: defaultSettings,
    },
  });
});

/**
 * Reset user position to defaults
 * POST /api/user/position/reset
 */
export const resetUserPosition = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  
  logger.info('API: Reset user position', { userId });
  
  const defaultPosition = await userService.resetUserPosition(userId);
  
  res.json({
    success: true,
    message: 'Reading position reset to defaults',
    data: {
      position: defaultPosition,
    },
  });
});

/**
 * Export user data
 * GET /api/user/export
 */
export const exportUserData = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  
  logger.info('API: Export user data', { userId });
  
  const exportData = await userService.exportUserData(userId);
  
  // Set headers for file download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="biblebridge-user-${userId}-${Date.now()}.json"`);
  
  res.json(exportData);
});

/**
 * Import user data
 * POST /api/user/import
 */
export const importUserData = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  const importData = req.body;
  
  logger.info('API: Import user data', { userId, hasPosition: !!importData.position, hasSettings: !!importData.settings });
  
  const updatedProfile = await userService.importUserData(importData, userId);
  
  res.json({
    success: true,
    message: 'User data imported successfully',
    data: {
      userId,
      profile: updatedProfile,
    },
  });
});

/**
 * Get user reading history/statistics
 * GET /api/user/stats
 */
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  
  logger.info('API: Get user stats', { userId });
  
  const profile = await userService.getUserProfile(userId);
  
  // Calculate some basic statistics
  const stats = {
    currentPosition: profile.position,
    preferences: {
      theme: profile.settings.theme,
      fontSize: profile.settings.fontSize,
      preferredTranslations: [
        profile.settings.leftTranslation,
        profile.settings.rightTranslation,
      ],
      pronunciationsEnabled: profile.settings.showPronunciations,
      ttsEnabled: profile.settings.ttsEnabled,
    },
    activity: {
      lastUpdate: profile.position.timestamp,
      // Add more activity tracking as needed
    },
  };
  
  res.json({
    success: true,
    data: {
      userId,
      statistics: stats,
    },
  });
});

/**
 * Clear user cache
 * DELETE /api/user/cache
 */
export const clearUserCache = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  
  logger.info('API: Clear user cache', { userId });
  
  userService.clearUserCache(userId);
  
  res.json({
    success: true,
    message: 'User cache cleared successfully',
    data: {
      userId,
      clearedAt: new Date().toISOString(),
    },
  });
});

/**
 * Get user preferences for a specific feature
 * GET /api/user/preferences/:feature
 */
export const getUserPreference = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  const { feature } = req.params;
  
  logger.info('API: Get user preference', { userId, feature });
  
  const settings = await userService.getUserSettings(userId);
  
  const featurePreferences: Record<string, any> = {
    theme: {
      current: settings.theme,
      options: ['dark', 'light'],
    },
    display: {
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      textBrightness: settings.textBrightness,
    },
    redLetters: {
      enabled: settings.showRedLetters,
      brightness: settings.redLetterBrightness,
      rgbWave: {
        enabled: settings.rgbWaveEnabled,
        speed: settings.rgbWaveSpeed,
      },
    },
    pronunciations: {
      enabled: settings.showPronunciations,
      style: settings.pronunciationStyle,
      ttsEnabled: settings.ttsEnabled,
    },
    translations: {
      left: settings.leftTranslation,
      right: settings.rightTranslation,
    },
  };
  
  const preference = featurePreferences[feature];
  
  if (!preference) {
    return res.status(404).json({
      success: false,
      error: `Feature '${feature}' not found`,
      availableFeatures: Object.keys(featurePreferences),
    });
  }
  
  res.json({
    success: true,
    data: {
      feature,
      preferences: preference,
    },
  });
});

/**
 * Update user preference for a specific feature
 * PUT /api/user/preferences/:feature
 */
export const updateUserPreference = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId || 'default';
  const { feature } = req.params;
  const updates = req.body;
  
  logger.info('API: Update user preference', { userId, feature, updates });
  
  // Map feature updates to settings format
  let settingsUpdates: any = {};
  
  switch (feature) {
    case 'theme':
      settingsUpdates = { theme: updates.theme };
      break;
    case 'display':
      settingsUpdates = {
        fontSize: updates.fontSize,
        fontFamily: updates.fontFamily,
        textBrightness: updates.textBrightness,
      };
      break;
    case 'redLetters':
      settingsUpdates = {
        showRedLetters: updates.enabled,
        redLetterBrightness: updates.brightness,
        rgbWaveEnabled: updates.rgbWave?.enabled,
        rgbWaveSpeed: updates.rgbWave?.speed,
      };
      break;
    case 'pronunciations':
      settingsUpdates = {
        showPronunciations: updates.enabled,
        pronunciationStyle: updates.style,
        ttsEnabled: updates.ttsEnabled,
      };
      break;
    case 'translations':
      settingsUpdates = {
        leftTranslation: updates.left,
        rightTranslation: updates.right,
      };
      break;
    default:
      return res.status(400).json({
        success: false,
        error: `Unknown feature '${feature}'`,
      });
  }
  
  // Filter out undefined values
  settingsUpdates = Object.fromEntries(
    Object.entries(settingsUpdates).filter(([_, value]) => value !== undefined)
  );
  
  const updatedSettings = await userService.saveUserSettings(settingsUpdates, userId);
  
  res.json({
    success: true,
    message: `${feature} preferences updated successfully`,
    data: {
      feature,
      settings: updatedSettings,
    },
  });
});