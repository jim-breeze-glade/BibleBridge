/**
 * Pronunciation API routes
 */

import { Router } from 'express';
import {
  getAllPronunciations,
  getPronunciation,
  searchPronunciations,
  getNamesByLetter,
  getPronunciationFormat,
  detectBiblicalNames,
  getPronunciationStats,
  getPronunciationIndex,
  checkPronunciationExists,
  refreshPronunciationData,
  getPopularNames,
} from '../controllers/pronunciationController';
import {
  validateParams,
  validateQuery,
  validateBody,
  schemas,
} from '../middleware/validation';
import { requestSizeLimit } from '../middleware/security';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Pronunciations
 *   description: Biblical name pronunciation API endpoints
 */

/**
 * @swagger
 * /api/pronunciations:
 *   get:
 *     summary: Get all biblical name pronunciations
 *     tags: [Pronunciations]
 *     responses:
 *       200:
 *         description: All pronunciation data with statistics
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
 *                     pronunciations:
 *                       type: object
 *                       additionalProperties:
 *                         $ref: '#/components/schemas/PronunciationData'
 */
router.get('/', getAllPronunciations);

/**
 * @swagger
 * /api/pronunciations/search:
 *   get:
 *     summary: Search biblical names by partial match
 *     tags: [Pronunciations]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid search parameters
 */
router.get(
  '/search',
  validateQuery(schemas.searchPronunciations),
  searchPronunciations
);

/**
 * @swagger
 * /api/pronunciations/letter/{letter}:
 *   get:
 *     summary: Get biblical names by first letter
 *     tags: [Pronunciations]
 *     parameters:
 *       - in: path
 *         name: letter
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[A-Za-z]$'
 *         description: Single letter (A-Z)
 *     responses:
 *       200:
 *         description: Names starting with the specified letter
 *       400:
 *         description: Invalid letter parameter
 */
router.get(
  '/letter/:letter',
  validateParams(schemas.getNamesByLetter),
  getNamesByLetter
);

/**
 * @swagger
 * /api/pronunciations/stats:
 *   get:
 *     summary: Get pronunciation statistics
 *     tags: [Pronunciations]
 *     responses:
 *       200:
 *         description: Pronunciation database statistics
 */
router.get('/stats', getPronunciationStats);

/**
 * @swagger
 * /api/pronunciations/index:
 *   get:
 *     summary: Get alphabetical index of all names
 *     tags: [Pronunciations]
 *     responses:
 *       200:
 *         description: Alphabetical index grouped by first letter
 */
router.get('/index', getPronunciationIndex);

/**
 * @swagger
 * /api/pronunciations/popular:
 *   get:
 *     summary: Get popular biblical names
 *     tags: [Pronunciations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *     responses:
 *       200:
 *         description: List of popular biblical names with pronunciations
 */
router.get('/popular', getPopularNames);

/**
 * @swagger
 * /api/pronunciations/detect:
 *   post:
 *     summary: Detect biblical names in text
 *     tags: [Pronunciations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 maxLength: 10000
 *                 description: Text to analyze for biblical names
 *     responses:
 *       200:
 *         description: Detected biblical names with positions
 *       400:
 *         description: Invalid text input
 */
router.post(
  '/detect',
  requestSizeLimit('1mb'),
  detectBiblicalNames
);

/**
 * @swagger
 * /api/pronunciations/refresh:
 *   post:
 *     summary: Refresh pronunciation data from file
 *     tags: [Pronunciations]
 *     responses:
 *       200:
 *         description: Data refreshed successfully
 *       500:
 *         description: Error refreshing data
 */
router.post('/refresh', refreshPronunciationData);

/**
 * @swagger
 * /api/pronunciations/{name}:
 *   get:
 *     summary: Get pronunciation for a specific biblical name
 *     tags: [Pronunciations]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Biblical name
 *     responses:
 *       200:
 *         description: Pronunciation data for the name
 *       404:
 *         description: No pronunciation found for the name
 */
router.get(
  '/:name',
  validateParams(schemas.getPronunciation),
  getPronunciation
);

/**
 * @swagger
 * /api/pronunciations/{name}:
 *   head:
 *     summary: Check if pronunciation exists for a name
 *     tags: [Pronunciations]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Biblical name
 *     responses:
 *       200:
 *         description: Pronunciation exists
 *       404:
 *         description: Pronunciation not found
 */
router.head(
  '/:name',
  validateParams(schemas.getPronunciation),
  checkPronunciationExists
);

/**
 * @swagger
 * /api/pronunciations/{name}/{format}:
 *   get:
 *     summary: Get pronunciation in specific format
 *     tags: [Pronunciations]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Biblical name
 *       - in: path
 *         name: format
 *         required: true
 *         schema:
 *           type: string
 *           enum: [phonetic, ipa, phoneme]
 *         description: Pronunciation format
 *     responses:
 *       200:
 *         description: Pronunciation in the specified format
 *       400:
 *         description: Invalid format
 *       404:
 *         description: Pronunciation not found in the specified format
 */
router.get(
  '/:name/:format',
  getPronunciationFormat
);

export default router;