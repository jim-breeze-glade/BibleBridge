/**
 * User data service for managing user positions and settings
 */

import fs from 'fs/promises';
import path from 'path';
import { UserPosition, UserSettings } from '../types';
import { config } from '../utils/config';
import { cache, cacheKeys } from '../utils/cache';
import { logger, logPerformance } from '../utils/logger';
import { ValidationError, ServiceUnavailableError } from '../utils/errors';
import { safeJsonParse } from '../utils/errors';

/**
 * Default user settings
 */
const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'dark',
  fontSize: 22,
  fontFamily: 'Georgia',
  showRedLetters: true,
  redLetterBrightness: 100,
  textBrightness: 100,
  rgbWaveEnabled: false,
  rgbWaveSpeed: 2.0,
  showPronunciations: true,
  pronunciationStyle: 'phonetic',
  ttsEnabled: true,
  leftTranslation: 'KJV',
  rightTranslation: 'NLT',
};

/**
 * Default user position
 */
const DEFAULT_USER_POSITION: UserPosition = {
  book: 'John',
  chapter: 3,
  timestamp: new Date().toISOString(),
};

export class UserService {
  private userDataDir: string;

  constructor() {
    this.userDataDir = config.paths.userData;
    this.ensureUserDataDirectory();
  }

  /**
   * Ensure user data directory exists
   */
  private async ensureUserDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.userDataDir, { recursive: true });
    } catch (error: any) {
      logger.error('Failed to create user data directory', {
        directory: this.userDataDir,
        error: error.message,
      });
    }
  }

  /**
   * Get user's last reading position
   */
  async getUserPosition(userId: string = 'default'): Promise<UserPosition> {
    const start = Date.now();
    const cacheKey = cacheKeys.user(userId, 'position');

    return cache.getOrSet(cacheKey, async () => {
      try {
        const filePath = this.getUserPositionFilePath(userId);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const position = safeJsonParse<UserPosition>(fileContent, DEFAULT_USER_POSITION);
        
        // Validate position data
        if (!position.book || !position.chapter || position.chapter < 1) {
          logger.warn(`Invalid position data for user ${userId}, using defaults`);
          return DEFAULT_USER_POSITION;
        }

        logPerformance(`getUserPosition:${userId}`, Date.now() - start);
        return position;
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, return default position
          logger.debug(`No position file found for user ${userId}, using defaults`);
          return DEFAULT_USER_POSITION;
        }
        
        logger.error(`Error loading position for user ${userId}`, { error: error.message });
        return DEFAULT_USER_POSITION;
      }
    }, 300); // Cache for 5 minutes
  }

  /**
   * Save user's reading position
   */
  async saveUserPosition(position: Partial<UserPosition>, userId: string = 'default'): Promise<UserPosition> {
    const start = Date.now();

    // Validate required fields
    if (!position.book || !position.chapter) {
      throw new ValidationError('Book and chapter are required for position');
    }

    if (position.chapter < 1) {
      throw new ValidationError('Chapter must be a positive number');
    }

    // Get current position and merge with updates
    const currentPosition = await this.getUserPosition(userId);
    const updatedPosition: UserPosition = {
      ...currentPosition,
      ...position,
      timestamp: new Date().toISOString(),
    };

    try {
      const filePath = this.getUserPositionFilePath(userId);
      await fs.writeFile(filePath, JSON.stringify(updatedPosition, null, 2), 'utf-8');
      
      // Update cache
      const cacheKey = cacheKeys.user(userId, 'position');
      cache.set(cacheKey, updatedPosition, 300); // Cache for 5 minutes
      
      logPerformance(`saveUserPosition:${userId}`, Date.now() - start);
      logger.info(`Saved position for user ${userId}`, { 
        book: updatedPosition.book, 
        chapter: updatedPosition.chapter 
      });
      
      return updatedPosition;
    } catch (error: any) {
      logger.error(`Error saving position for user ${userId}`, { error: error.message });
      throw new ServiceUnavailableError(`Failed to save reading position: ${error.message}`);
    }
  }

  /**
   * Get user settings
   */
  async getUserSettings(userId: string = 'default'): Promise<UserSettings> {
    const start = Date.now();
    const cacheKey = cacheKeys.user(userId, 'settings');

    return cache.getOrSet(cacheKey, async () => {
      try {
        const filePath = this.getUserSettingsFilePath(userId);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const settings = safeJsonParse<UserSettings>(fileContent, DEFAULT_USER_SETTINGS);
        
        // Merge with defaults to ensure all properties exist
        const mergedSettings: UserSettings = {
          ...DEFAULT_USER_SETTINGS,
          ...settings,
        };

        logPerformance(`getUserSettings:${userId}`, Date.now() - start);
        return mergedSettings;
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, return default settings
          logger.debug(`No settings file found for user ${userId}, using defaults`);
          return DEFAULT_USER_SETTINGS;
        }
        
        logger.error(`Error loading settings for user ${userId}`, { error: error.message });
        return DEFAULT_USER_SETTINGS;
      }
    }, 600); // Cache for 10 minutes
  }

  /**
   * Save user settings
   */
  async saveUserSettings(settings: Partial<UserSettings>, userId: string = 'default'): Promise<UserSettings> {
    const start = Date.now();

    // Get current settings and merge with updates
    const currentSettings = await this.getUserSettings(userId);
    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...settings,
    };

    // Validate settings
    this.validateUserSettings(updatedSettings);

    try {
      const filePath = this.getUserSettingsFilePath(userId);
      await fs.writeFile(filePath, JSON.stringify(updatedSettings, null, 2), 'utf-8');
      
      // Update cache
      const cacheKey = cacheKeys.user(userId, 'settings');
      cache.set(cacheKey, updatedSettings, 600); // Cache for 10 minutes
      
      logPerformance(`saveUserSettings:${userId}`, Date.now() - start);
      logger.info(`Saved settings for user ${userId}`, { 
        theme: updatedSettings.theme,
        fontSize: updatedSettings.fontSize,
      });
      
      return updatedSettings;
    } catch (error: any) {
      logger.error(`Error saving settings for user ${userId}`, { error: error.message });
      throw new ServiceUnavailableError(`Failed to save user settings: ${error.message}`);
    }
  }

  /**
   * Reset user settings to defaults
   */
  async resetUserSettings(userId: string = 'default'): Promise<UserSettings> {
    logger.info(`Resetting settings to defaults for user ${userId}`);
    return this.saveUserSettings(DEFAULT_USER_SETTINGS, userId);
  }

  /**
   * Reset user position to defaults
   */
  async resetUserPosition(userId: string = 'default'): Promise<UserPosition> {
    logger.info(`Resetting position to defaults for user ${userId}`);
    return this.saveUserPosition(DEFAULT_USER_POSITION, userId);
  }

  /**
   * Get user profile (position + settings)
   */
  async getUserProfile(userId: string = 'default'): Promise<{
    position: UserPosition;
    settings: UserSettings;
  }> {
    const [position, settings] = await Promise.all([
      this.getUserPosition(userId),
      this.getUserSettings(userId),
    ]);

    return { position, settings };
  }

  /**
   * Update user profile (position + settings)
   */
  async updateUserProfile(
    updates: {
      position?: Partial<UserPosition>;
      settings?: Partial<UserSettings>;
    },
    userId: string = 'default'
  ): Promise<{
    position: UserPosition;
    settings: UserSettings;
  }> {
    const promises: Promise<any>[] = [];

    if (updates.position) {
      promises.push(this.saveUserPosition(updates.position, userId));
    }

    if (updates.settings) {
      promises.push(this.saveUserSettings(updates.settings, userId));
    }

    if (promises.length === 0) {
      return this.getUserProfile(userId);
    }

    await Promise.all(promises);
    return this.getUserProfile(userId);
  }

  /**
   * Export user data
   */
  async exportUserData(userId: string = 'default'): Promise<{
    position: UserPosition;
    settings: UserSettings;
    exportedAt: string;
  }> {
    const profile = await this.getUserProfile(userId);
    
    return {
      ...profile,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import user data
   */
  async importUserData(
    data: {
      position?: UserPosition;
      settings?: UserSettings;
    },
    userId: string = 'default'
  ): Promise<{
    position: UserPosition;
    settings: UserSettings;
  }> {
    logger.info(`Importing user data for user ${userId}`);

    const updates: {
      position?: Partial<UserPosition>;
      settings?: Partial<UserSettings>;
    } = {};

    if (data.position) {
      updates.position = data.position;
    }

    if (data.settings) {
      updates.settings = data.settings;
    }

    return this.updateUserProfile(updates, userId);
  }

  /**
   * Get file path for user position data
   */
  private getUserPositionFilePath(userId: string): string {
    return path.join(this.userDataDir, `${userId}_position.json`);
  }

  /**
   * Get file path for user settings data
   */
  private getUserSettingsFilePath(userId: string): string {
    return path.join(this.userDataDir, `${userId}_settings.json`);
  }

  /**
   * Validate user settings
   */
  private validateUserSettings(settings: UserSettings): void {
    const errors: string[] = [];

    if (!['dark', 'light'].includes(settings.theme)) {
      errors.push('Theme must be "dark" or "light"');
    }

    if (settings.fontSize < 8 || settings.fontSize > 72) {
      errors.push('Font size must be between 8 and 72');
    }

    if (settings.redLetterBrightness < 0 || settings.redLetterBrightness > 100) {
      errors.push('Red letter brightness must be between 0 and 100');
    }

    if (settings.textBrightness < 0 || settings.textBrightness > 100) {
      errors.push('Text brightness must be between 0 and 100');
    }

    if (settings.rgbWaveSpeed < 0.1 || settings.rgbWaveSpeed > 10) {
      errors.push('RGB wave speed must be between 0.1 and 10');
    }

    if (!['phonetic', 'ipa'].includes(settings.pronunciationStyle)) {
      errors.push('Pronunciation style must be "phonetic" or "ipa"');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Invalid settings: ${errors.join(', ')}`);
    }
  }

  /**
   * Clear user cache
   */
  clearUserCache(userId: string = 'default'): void {
    const positionKey = cacheKeys.user(userId, 'position');
    const settingsKey = cacheKeys.user(userId, 'settings');
    
    cache.del(positionKey);
    cache.del(settingsKey);
    
    logger.info(`Cleared cache for user ${userId}`);
  }
}

// Export singleton instance
export const userService = new UserService();