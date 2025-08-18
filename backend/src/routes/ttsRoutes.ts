/**
 * Text-to-Speech API routes
 */

import { Router } from 'express';
import {
  generateTTS,
  getAudioForName,
  checkCachedAudio,
  getTTSHealth,
  testTTSGeneration,
  clearTTSCache,
  preloadCommonNames,
  getTTSOptions,
  getCacheStats,
  batchGenerateTTS,
} from '../controllers/ttsController';
import {
  validateParams,
  validateBody,
  schemas,
} from '../middleware/validation';
import { rateLimiters, requestSizeLimit } from '../middleware/security';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: TTS
 *   description: Text-to-Speech API endpoints for biblical name pronunciations
 */

/**
 * @swagger
 * /api/tts/generate:
 *   post:
 *     summary: Generate TTS audio for biblical name pronunciation
 *     tags: [TTS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TTSRequest'
 *     responses:
 *       200:
 *         description: Generated audio file
 *         content:
 *           audio/wav:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid request parameters
 *       503:
 *         description: TTS service unavailable
 */
router.post(
  '/generate',
  rateLimiters.tts,
  requestSizeLimit('100kb'),
  validateBody(schemas.generateTTS),
  generateTTS
);

/**
 * @swagger
 * /api/tts/audio/{name}:
 *   get:
 *     summary: Get TTS audio for a biblical name
 *     tags: [TTS]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Biblical name
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [phonetic, ipa, phoneme]
 *           default: phonetic
 *         description: Preferred pronunciation format
 *       - in: query
 *         name: speed
 *         schema:
 *           type: number
 *           minimum: 0.1
 *           maximum: 3.0
 *         description: Speech speed multiplier
 *       - in: query
 *         name: speaker_id
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 10
 *         description: Voice speaker ID
 *     responses:
 *       200:
 *         description: Audio file for the biblical name
 *         content:
 *           audio/wav:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: No pronunciation data found for the name
 *       503:
 *         description: TTS service unavailable
 */
router.get(
  '/audio/:name',
  rateLimiters.tts,
  getAudioForName
);

/**
 * @swagger
 * /api/tts/audio/{name}:
 *   head:
 *     summary: Check if cached audio exists for a name
 *     tags: [TTS]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Biblical name
 *     responses:
 *       200:
 *         description: Cached audio exists
 *       404:
 *         description: No cached audio found
 */
router.head(
  '/audio/:name',
  checkCachedAudio
);

/**
 * @swagger
 * /api/tts/batch:
 *   post:
 *     summary: Batch generate TTS for multiple names
 *     tags: [TTS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - names
 *             properties:
 *               names:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 20
 *                 description: Array of biblical names (max 20)
 *               voice_settings:
 *                 type: object
 *                 properties:
 *                   speed:
 *                     type: number
 *                     minimum: 0.1
 *                     maximum: 3.0
 *                   speaker_id:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 10
 *     responses:
 *       200:
 *         description: Batch generation results
 *       400:
 *         description: Invalid request parameters
 */
router.post(
  '/batch',
  rateLimiters.tts,
  requestSizeLimit('100kb'),
  batchGenerateTTS
);

/**
 * @swagger
 * /api/tts/preload:
 *   post:
 *     summary: Preload audio for common biblical names
 *     tags: [TTS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - names
 *             properties:
 *               names:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 100
 *                 description: Array of biblical names to preload (max 100)
 *     responses:
 *       200:
 *         description: Preloading started successfully
 *       400:
 *         description: Invalid request parameters
 */
router.post(
  '/preload',
  rateLimiters.general, // More restrictive than regular TTS
  requestSizeLimit('100kb'),
  preloadCommonNames
);

/**
 * @swagger
 * /api/tts/health:
 *   get:
 *     summary: Get TTS service health and statistics
 *     tags: [TTS]
 *     responses:
 *       200:
 *         description: TTS service health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     health:
 *                       type: object
 *                       properties:
 *                         available:
 *                           type: boolean
 *                         responseTime:
 *                           type: number
 */
router.get('/health', getTTSHealth);

/**
 * @swagger
 * /api/tts/test:
 *   get:
 *     summary: Test TTS generation with a simple phrase
 *     tags: [TTS]
 *     responses:
 *       200:
 *         description: Test results
 */
router.get('/test', testTTSGeneration);

/**
 * @swagger
 * /api/tts/options:
 *   get:
 *     summary: Get supported TTS options and settings
 *     tags: [TTS]
 *     responses:
 *       200:
 *         description: Available TTS options and configuration
 */
router.get('/options', getTTSOptions);

/**
 * @swagger
 * /api/tts/cache/stats:
 *   get:
 *     summary: Get TTS cache statistics
 *     tags: [TTS]
 *     responses:
 *       200:
 *         description: Cache statistics and performance metrics
 */
router.get('/cache/stats', getCacheStats);

/**
 * @swagger
 * /api/tts/cache:
 *   delete:
 *     summary: Clear TTS audio cache
 *     tags: [TTS]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.delete('/cache', clearTTSCache);

export default router;