/**
 * Bible API routes
 */

import { Router } from 'express';
import {
  getTranslations,
  getBooks,
  getChapters,
  getChapter,
  searchBible,
  getVerseOfTheDay,
  getReadingPlan,
  getBibleStats,
} from '../controllers/bibleController';
import {
  validateParams,
  validateQuery,
  validateBookName,
  validateTranslation,
  validateChapterNumber,
  schemas,
} from '../middleware/validation';
import { rateLimiters } from '../middleware/security';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Bible
 *   description: Bible text and metadata API endpoints
 */

/**
 * @swagger
 * /api/translations:
 *   get:
 *     summary: Get list of available Bible translations
 *     tags: [Bible]
 *     responses:
 *       200:
 *         description: List of available translations
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
 *                     translations:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Translation'
 */
router.get('/translations', getTranslations);

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Get list of all Bible books with metadata
 *     tags: [Bible]
 *     responses:
 *       200:
 *         description: List of Bible books
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
 *                     books:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/BookMetadata'
 */
router.get('/books', getBooks);

/**
 * @swagger
 * /api/books/{book}/chapters:
 *   get:
 *     summary: Get chapters for a specific book
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: book
 *         required: true
 *         schema:
 *           type: string
 *         description: Bible book name
 *     responses:
 *       200:
 *         description: List of chapters for the book
 *       404:
 *         description: Book not found
 */
router.get(
  '/books/:book/chapters',
  validateBookName,
  getChapters
);

/**
 * @swagger
 * /api/translations/{translation}/{book}/{chapter}:
 *   get:
 *     summary: Get specific chapter data with verses
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: translation
 *         required: true
 *         schema:
 *           type: string
 *           enum: [KJV, NLT, NIV, CSB]
 *       - in: path
 *         name: book
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chapter
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Chapter data with verses
 *       404:
 *         description: Chapter not found
 */
router.get(
  '/translations/:translation/:book/:chapter',
  validateParams(schemas.getChapter),
  validateTranslation,
  validateBookName,
  validateChapterNumber,
  getChapter
);

/**
 * @swagger
 * /api/search/{translation}:
 *   get:
 *     summary: Search Bible text
 *     tags: [Bible]
 *     parameters:
 *       - in: path
 *         name: translation
 *         required: true
 *         schema:
 *           type: string
 *           enum: [KJV, NLT, NIV, CSB]
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *       - in: query
 *         name: book
 *         schema:
 *           type: string
 *       - in: query
 *         name: testament
 *         schema:
 *           type: string
 *           enum: [Old Testament, New Testament]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid search parameters
 */
router.get(
  '/search/:translation',
  rateLimiters.search,
  validateTranslation,
  validateQuery(schemas.searchBible),
  searchBible
);

/**
 * @swagger
 * /api/verse-of-the-day:
 *   get:
 *     summary: Get verse of the day
 *     tags: [Bible]
 *     parameters:
 *       - in: query
 *         name: translation
 *         schema:
 *           type: string
 *           enum: [KJV, NLT, NIV, CSB]
 *           default: KJV
 *     responses:
 *       200:
 *         description: Daily verse
 */
router.get('/verse-of-the-day', getVerseOfTheDay);

/**
 * @swagger
 * /api/reading-plan:
 *   get:
 *     summary: Get reading plan suggestions
 *     tags: [Bible]
 *     parameters:
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *           enum: [chronological, newTestament]
 *           default: chronological
 *       - in: query
 *         name: day
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *     responses:
 *       200:
 *         description: Reading plan data
 */
router.get('/reading-plan', getReadingPlan);

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get Bible statistics
 *     tags: [Bible]
 *     responses:
 *       200:
 *         description: Bible statistics
 */
router.get('/stats', getBibleStats);

export default router;