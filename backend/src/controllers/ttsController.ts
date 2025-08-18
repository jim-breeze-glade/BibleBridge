/**
 * Text-to-Speech API route controllers
 */

import { Request, Response } from 'express';
import { ttsService } from '../services/ttsService';
import { pronunciationService } from '../services/pronunciationService';
import { asyncHandler } from '../utils/errors';
import { logger } from '../utils/logger';
import { ValidationError, ServiceUnavailableError } from '../utils/errors';

/**
 * Generate TTS audio for biblical name pronunciation
 * POST /api/tts/generate
 */
export const generateTTS = asyncHandler(async (req: Request, res: Response) => {
  const { name, phonetic, ipa, phoneme, voice_settings } = req.body;
  
  logger.info('API: Generate TTS', { name, hasPhonetic: !!phonetic });
  
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Name is required for TTS generation');
  }
  
  // If no pronunciation data provided, try to get it from our database
  let pronunciationData = { phonetic, ipa, phoneme };
  
  if (!phonetic && !ipa && !phoneme) {
    const storedPronunciation = await pronunciationService.getPronunciation(name);
    if (storedPronunciation) {
      pronunciationData = storedPronunciation;
    } else {
      // If no pronunciation data available, use the name itself
      pronunciationData = { phonetic: name };
    }
  }
  
  try {
    const audioResult = await ttsService.generateAudio(name, pronunciationData, voice_settings);
    
    // Set appropriate headers for audio response
    res.setHeader('Content-Type', audioResult.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${audioResult.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Content-Length', audioResult.audio.length);
    
    // Send the audio data
    res.send(audioResult.audio);
  } catch (error) {
    logger.error('TTS generation failed', { error: error.message, name });
    throw error;
  }
});

/**
 * Generate TTS audio for a biblical name (simpler endpoint)
 * GET /api/tts/audio/:name
 */
export const getAudioForName = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;
  const { format = 'phonetic', speed, speaker_id } = req.query as any;
  
  logger.info('API: Get audio for name', { name, format });
  
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Name parameter is required');
  }
  
  // Get pronunciation data from our database
  const pronunciation = await pronunciationService.getPronunciation(name);
  
  if (!pronunciation) {
    return res.status(404).json({
      success: false,
      error: `No pronunciation data found for "${name}"`,
      suggestion: 'Try the POST /api/tts/generate endpoint with custom pronunciation data',
    });
  }
  
  const voiceSettings = {
    ...(speed && { speed: parseFloat(speed) }),
    ...(speaker_id && { speaker_id: parseInt(speaker_id) }),
  };
  
  try {
    const audioResult = await ttsService.generateAudioFromBestFormat(
      name,
      pronunciation,
      format as 'phonetic' | 'ipa' | 'phoneme',
      voiceSettings
    );
    
    // Set appropriate headers for audio response
    res.setHeader('Content-Type', audioResult.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${audioResult.filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Content-Length', audioResult.audio.length);
    
    // Send the audio data
    res.send(audioResult.audio);
  } catch (error) {
    logger.error('TTS generation failed for name', { error: error.message, name });
    throw error;
  }
});

/**
 * Check if cached audio exists for a name
 * HEAD /api/tts/audio/:name
 */
export const checkCachedAudio = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;
  const { format = 'phonetic' } = req.query as any;
  
  const pronunciation = await pronunciationService.getPronunciation(name);
  
  if (!pronunciation) {
    return res.status(404).end();
  }
  
  const cachedAudio = await ttsService.getCachedAudio(name, pronunciation);
  
  if (cachedAudio) {
    res.setHeader('Content-Type', cachedAudio.contentType);
    res.setHeader('Content-Length', cachedAudio.audio.length);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).end();
  } else {
    res.status(404).end();
  }
});

/**
 * Get TTS service health and statistics
 * GET /api/tts/health
 */
export const getTTSHealth = asyncHandler(async (req: Request, res: Response) => {
  logger.info('API: Get TTS health');
  
  const health = await ttsService.checkHealth();
  const stats = await ttsService.getServiceStats();
  
  res.json({
    success: true,
    data: {
      health,
      statistics: stats,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Test TTS generation with a simple phrase
 * GET /api/tts/test
 */
export const testTTSGeneration = asyncHandler(async (req: Request, res: Response) => {
  logger.info('API: Test TTS generation');
  
  const testResult = await ttsService.testGeneration();
  
  res.json({
    success: testResult.success,
    data: {
      test: 'Abraham pronunciation generation',
      result: testResult,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Clear TTS audio cache
 * DELETE /api/tts/cache
 */
export const clearTTSCache = asyncHandler(async (req: Request, res: Response) => {
  logger.info('API: Clear TTS cache');
  
  ttsService.clearCache();
  
  res.json({
    success: true,
    message: 'TTS cache cleared successfully',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Preload audio for common biblical names
 * POST /api/tts/preload
 */
export const preloadCommonNames = asyncHandler(async (req: Request, res: Response) => {
  const { names } = req.body;
  
  logger.info('API: Preload TTS audio', { nameCount: names?.length });
  
  if (!Array.isArray(names) || names.length === 0) {
    throw new ValidationError('Names array is required and must not be empty');
  }
  
  if (names.length > 100) {
    throw new ValidationError('Cannot preload more than 100 names at once');
  }
  
  // Get pronunciation data for all names
  const pronunciationMap = new Map();
  for (const name of names) {
    const pronunciation = await pronunciationService.getPronunciation(name);
    if (pronunciation) {
      pronunciationMap.set(name, pronunciation);
    }
  }
  
  // Start preloading (this runs in background)
  ttsService.preloadCommonNames(names, pronunciationMap);
  
  res.json({
    success: true,
    message: 'TTS preloading started',
    data: {
      requestedNames: names.length,
      foundPronunciations: pronunciationMap.size,
      startedAt: new Date().toISOString(),
    },
  });
});

/**
 * Get supported voice settings and options
 * GET /api/tts/options
 */
export const getTTSOptions = asyncHandler(async (req: Request, res: Response) => {
  logger.info('API: Get TTS options');
  
  const options = {
    voiceSettings: {
      speed: {
        description: 'Speech speed multiplier',
        min: 0.1,
        max: 3.0,
        default: 0.8,
      },
      speaker_id: {
        description: 'Voice speaker ID',
        min: 0,
        max: 10,
        default: 0,
      },
    },
    formats: {
      supported: ['phonetic', 'ipa', 'phoneme'],
      default: 'phonetic',
      descriptions: {
        phonetic: 'Human-readable pronunciation (e.g., AY-bruh-ham)',
        ipa: 'International Phonetic Alphabet (e.g., /ˈeɪbrəˌhæm/)',
        phoneme: 'Phoneme representation for TTS engines (e.g., aee bruh ham)',
      },
    },
    audioFormat: {
      type: 'WAV',
      bitRate: '16-bit',
      sampleRate: '22050 Hz',
      channels: 'Mono',
    },
    limits: {
      nameLength: 100,
      cacheTime: '1 hour',
      rateLimits: {
        general: '10 requests per 5 minutes',
        preload: '1 request per hour (max 100 names)',
      },
    },
  };
  
  res.json({
    success: true,
    data: options,
  });
});

/**
 * Get cached audio statistics
 * GET /api/tts/cache/stats
 */
export const getCacheStats = asyncHandler(async (req: Request, res: Response) => {
  logger.info('API: Get TTS cache stats');
  
  const stats = await ttsService.getServiceStats();
  
  res.json({
    success: true,
    data: {
      cache: stats.cacheStats,
      service: {
        available: stats.available,
        lastHealthCheck: stats.lastHealthCheck,
        responseTime: stats.responseTime,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Batch generate TTS for multiple names
 * POST /api/tts/batch
 */
export const batchGenerateTTS = asyncHandler(async (req: Request, res: Response) => {
  const { names, voice_settings } = req.body;
  
  logger.info('API: Batch generate TTS', { nameCount: names?.length });
  
  if (!Array.isArray(names) || names.length === 0) {
    throw new ValidationError('Names array is required and must not be empty');
  }
  
  if (names.length > 20) {
    throw new ValidationError('Cannot generate TTS for more than 20 names at once');
  }
  
  const results = [];
  const errors = [];
  
  for (const name of names) {
    try {
      const pronunciation = await pronunciationService.getPronunciation(name);
      if (pronunciation) {
        // Check if audio is already cached
        const cached = await ttsService.getCachedAudio(name, pronunciation, voice_settings);
        results.push({
          name,
          cached: !!cached,
          available: true,
        });
        
        // If not cached, generate it
        if (!cached) {
          await ttsService.generateAudio(name, pronunciation, voice_settings);
        }
      } else {
        results.push({
          name,
          cached: false,
          available: false,
          error: 'No pronunciation data available',
        });
      }
    } catch (error: any) {
      errors.push({
        name,
        error: error.message,
      });
    }
  }
  
  res.json({
    success: true,
    data: {
      results,
      errors,
      summary: {
        total: names.length,
        successful: results.filter(r => r.available).length,
        cached: results.filter(r => r.cached).length,
        errors: errors.length,
      },
    },
  });
});