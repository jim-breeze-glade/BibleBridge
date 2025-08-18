/**
 * Main API routes index
 */

import { Router } from 'express';
import bibleRoutes from './bibleRoutes';
import pronunciationRoutes from './pronunciationRoutes';
import ttsRoutes from './ttsRoutes';
import userRoutes from './userRoutes';
import { asyncHandler } from '../utils/errors';
import { cache } from '../utils/cache';
import { bibleService } from '../services/bibleService';
import { ttsService } from '../services/ttsService';
import { pronunciationService } from '../services/pronunciationService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     tts:
 *                       type: object
 *                       properties:
 *                         available:
 *                           type: boolean
 *                         responseTime:
 *                           type: number
 *                     database:
 *                       type: object
 *                       properties:
 *                         available:
 *                           type: boolean
 *                         translations:
 *                           type: number
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 */
router.get('/health', asyncHandler(async (req, res) => {
  logger.info('API: Health check');
  
  const startTime = process.hrtime.bigint();
  
  // Check services
  const [ttsHealth, translations, pronunciationStats] = await Promise.allSettled([
    ttsService.checkHealth(),
    bibleService.getTranslations(),
    pronunciationService.getStatistics(),
  ]);
  
  const ttsHealthResult = ttsHealth.status === 'fulfilled' ? ttsHealth.value : { available: false };
  const translationsResult = translations.status === 'fulfilled' ? translations.value : [];
  const pronunciationStatsResult = pronunciationStats.status === 'fulfilled' ? pronunciationStats.value : { totalNames: 0 };
  
  const healthCheck = {
    status: 'healthy' as const,
    timestamp: new Date().toISOString(),
    services: {
      tts: {
        available: ttsHealthResult.available,
        responseTime: ttsHealthResult.responseTime,
      },
      database: {
        available: translationsResult.length > 0,
        translations: translationsResult.filter((t: any) => t.available).length,
      },
      pronunciations: {
        available: pronunciationStatsResult.totalNames > 0,
        totalNames: pronunciationStatsResult.totalNames,
      },
    },
    uptime: Number(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    cache: cache.getStats(),
  };
  
  const endTime = process.hrtime.bigint();
  const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
  
  res.json({
    success: true,
    data: healthCheck,
    meta: {
      responseTime: Math.round(responseTime * 100) / 100, // Round to 2 decimal places
    },
  });
}));

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Simple status endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'BibleBridge Backend API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Cache performance statistics
 */
router.get('/cache/stats', (req, res) => {
  const stats = cache.getStats();
  
  res.json({
    success: true,
    data: {
      cache: stats,
      performance: {
        hitRate: `${stats.hitRate}%`,
        efficiency: stats.hits > 0 ? 'good' : 'warming up',
      },
    },
  });
});

/**
 * @swagger
 * /api/cache/clear:
 *   delete:
 *     summary: Clear all cache entries
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.delete('/cache/clear', (req, res) => {
  logger.info('API: Clear cache requested');
  
  cache.clear();
  
  res.json({
    success: true,
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/info:
 *   get:
 *     summary: Get API information and capabilities
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information
 */
router.get('/info', asyncHandler(async (req, res) => {
  const [translations, pronunciationStats] = await Promise.all([
    bibleService.getTranslations(),
    pronunciationService.getStatistics(),
  ]);
  
  const info = {
    name: 'BibleBridge Backend API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'Comprehensive Bible study platform backend with TTS and pronunciation support',
    capabilities: {
      translations: {
        supported: translations.filter(t => t.available).map(t => t.code),
        total: translations.length,
      },
      features: [
        'Bible text retrieval',
        'Cross-translation search',
        'Biblical name pronunciations',
        'Text-to-speech generation',
        'User data persistence',
        'Reading position tracking',
        'Customizable settings',
      ],
      pronunciations: {
        totalNames: pronunciationStats.totalNames,
        formats: ['phonetic', 'ipa', 'phoneme'],
      },
      tts: {
        enabled: true,
        formats: ['wav'],
        voiceSettings: ['speed', 'speaker_id'],
      },
    },
    endpoints: {
      bible: '/api/*',
      pronunciations: '/api/pronunciations/*',
      tts: '/api/tts/*',
      user: '/api/user/*',
      system: '/api/health, /api/status, /api/info',
    },
    documentation: {
      swagger: '/api-docs',
      openapi: '/api-docs.json',
    },
  };
  
  res.json({
    success: true,
    data: info,
  });
}));

// Mount route modules
router.use('/', bibleRoutes);
router.use('/pronunciations', pronunciationRoutes);
router.use('/tts', ttsRoutes);
router.use('/user', userRoutes);

export default router;