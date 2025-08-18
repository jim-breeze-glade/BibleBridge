/**
 * Simplified TTS API controllers for BibleBridge
 */

import { Request, Response } from 'express';
import { ttsService } from '../services/ttsService';
import { pronunciationService } from '../services/pronunciationService';
import { asyncHandler } from '../utils/errors';
import { logger } from '../utils/logger';
import { PronunciationData } from '../types';

/**
 * Generate TTS audio for a biblical name
 * POST /api/tts/generate
 */
export const generateTtsAudio = asyncHandler(async (req: Request, res: Response) => {
  const { name, phonetic, ipa, phoneme, voice_settings } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Name is required and must be a string'
    });
  }
  
  logger.info('API: Generate TTS audio', { name });
  
  // Use provided pronunciation data or look it up
  let pronunciationData: PronunciationData = { 
    phonetic: phonetic || undefined, 
    ipa: ipa || undefined, 
    phoneme: phoneme || undefined 
  };
  
  if (!phonetic && !ipa && !phoneme) {
    const lookupData = await pronunciationService.getPronunciation(name);
    if (lookupData) {
      pronunciationData = lookupData;
    }
  }
  
  try {
    const audioData = await ttsService.generateAudio(name, pronunciationData, voice_settings);
    
    res.setHeader('Content-Type', audioData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${audioData.filename}"`);
    res.send(audioData.audio);
  } catch (error: any) {
    logger.error('TTS generation failed', { name, error: error.message });
    
    res.status(503).json({
      success: false,
      error: 'TTS service unavailable',
      message: error.message
    });
  }
});

/**
 * Get TTS service health status
 * GET /api/tts/health
 */
export const getTtsHealth = asyncHandler(async (_req: Request, res: Response) => {
  logger.info('API: Get TTS health');
  
  const healthCheck = await ttsService.checkHealth();
  
  res.json({
    success: true,
    data: healthCheck
  });
});