/**
 * User data API routes
 */

import { Router } from 'express';
import {
  getUserPosition,
  saveUserPosition,
  getUserSettings,
  saveUserSettings,
  getUserProfile,
  updateUserProfile,
  resetUserSettings,
  resetUserPosition,
  exportUserData,
  importUserData,
  getUserStats,
  clearUserCache,
  getUserPreference,
  updateUserPreference,
} from '../controllers/userController';
import {
  validateBody,
  validateUserId,
  schemas,
} from '../middleware/validation';
import { requestSizeLimit } from '../middleware/security';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User data management API endpoints
 */

// Apply user ID validation to all routes
router.use(validateUserId);

/**
 * @swagger
 * /api/user/position:
 *   get:
 *     summary: Get user's last reading position
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     responses:
 *       200:
 *         description: User's current reading position
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
 *                     position:
 *                       $ref: '#/components/schemas/UserPosition'
 */
router.get('/position', getUserPosition);

/**
 * @swagger
 * /api/user/position:
 *   post:
 *     summary: Save user's reading position
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - book
 *               - chapter
 *             properties:
 *               book:
 *                 type: string
 *                 description: Bible book name
 *               chapter:
 *                 type: integer
 *                 minimum: 1
 *                 description: Chapter number
 *               verse:
 *                 type: integer
 *                 minimum: 1
 *                 description: Verse number (optional)
 *               translation:
 *                 type: string
 *                 enum: [KJV, NLT, NIV, CSB]
 *                 description: Bible translation (optional)
 *     responses:
 *       200:
 *         description: Position saved successfully
 *       400:
 *         description: Invalid position data
 */
router.post(
  '/position',
  requestSizeLimit('10kb'),
  validateBody(schemas.savePosition),
  saveUserPosition
);

/**
 * @swagger
 * /api/user/position/reset:
 *   post:
 *     summary: Reset user position to defaults
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     responses:
 *       200:
 *         description: Position reset successfully
 */
router.post('/position/reset', resetUserPosition);

/**
 * @swagger
 * /api/user/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     responses:
 *       200:
 *         description: User settings
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
 *                     settings:
 *                       $ref: '#/components/schemas/UserSettings'
 */
router.get('/settings', getUserSettings);

/**
 * @swagger
 * /api/user/settings:
 *   post:
 *     summary: Save user settings
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               theme:
 *                 type: string
 *                 enum: [dark, light]
 *               fontSize:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 72
 *               fontFamily:
 *                 type: string
 *               showRedLetters:
 *                 type: boolean
 *               redLetterBrightness:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               textBrightness:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               rgbWaveEnabled:
 *                 type: boolean
 *               rgbWaveSpeed:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 10
 *               showPronunciations:
 *                 type: boolean
 *               pronunciationStyle:
 *                 type: string
 *                 enum: [phonetic, ipa]
 *               ttsEnabled:
 *                 type: boolean
 *               leftTranslation:
 *                 type: string
 *                 enum: [KJV, NLT, NIV, CSB]
 *               rightTranslation:
 *                 type: string
 *                 enum: [KJV, NLT, NIV, CSB]
 *     responses:
 *       200:
 *         description: Settings saved successfully
 *       400:
 *         description: Invalid settings data
 */
router.post(
  '/settings',
  requestSizeLimit('10kb'),
  validateBody(schemas.saveSettings),
  saveUserSettings
);

/**
 * @swagger
 * /api/user/settings/reset:
 *   post:
 *     summary: Reset user settings to defaults
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     responses:
 *       200:
 *         description: Settings reset successfully
 */
router.post('/settings/reset', resetUserSettings);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get complete user profile (position + settings)
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     responses:
 *       200:
 *         description: Complete user profile
 */
router.get('/profile', getUserProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile (position and/or settings)
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               position:
 *                 type: object
 *                 properties:
 *                   book:
 *                     type: string
 *                   chapter:
 *                     type: integer
 *                   verse:
 *                     type: integer
 *                   translation:
 *                     type: string
 *               settings:
 *                 $ref: '#/components/schemas/UserSettings'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put(
  '/profile',
  requestSizeLimit('20kb'),
  updateUserProfile
);

/**
 * @swagger
 * /api/user/preferences/{feature}:
 *   get:
 *     summary: Get user preferences for a specific feature
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: feature
 *         required: true
 *         schema:
 *           type: string
 *           enum: [theme, display, redLetters, pronunciations, translations]
 *         description: Feature category
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     responses:
 *       200:
 *         description: Feature preferences
 *       404:
 *         description: Feature not found
 */
router.get('/preferences/:feature', getUserPreference);

/**
 * @swagger
 * /api/user/preferences/{feature}:
 *   put:
 *     summary: Update user preferences for a specific feature
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: feature
 *         required: true
 *         schema:
 *           type: string
 *           enum: [theme, display, redLetters, pronunciations, translations]
 *         description: Feature category
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Feature-specific preference updates
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       400:
 *         description: Invalid feature or preferences
 */
router.put(
  '/preferences/:feature',
  requestSizeLimit('10kb'),
  updateUserPreference
);

/**
 * @swagger
 * /api/user/stats:
 *   get:
 *     summary: Get user reading statistics
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     responses:
 *       200:
 *         description: User reading statistics
 */
router.get('/stats', getUserStats);

/**
 * @swagger
 * /api/user/export:
 *   get:
 *     summary: Export user data
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     responses:
 *       200:
 *         description: User data export file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 position:
 *                   $ref: '#/components/schemas/UserPosition'
 *                 settings:
 *                   $ref: '#/components/schemas/UserSettings'
 *                 exportedAt:
 *                   type: string
 *                   format: date-time
 */
router.get('/export', exportUserData);

/**
 * @swagger
 * /api/user/import:
 *   post:
 *     summary: Import user data
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               position:
 *                 $ref: '#/components/schemas/UserPosition'
 *               settings:
 *                 $ref: '#/components/schemas/UserSettings'
 *     responses:
 *       200:
 *         description: Data imported successfully
 *       400:
 *         description: Invalid import data
 */
router.post(
  '/import',
  requestSizeLimit('50kb'),
  importUserData
);

/**
 * @swagger
 * /api/user/cache:
 *   delete:
 *     summary: Clear user cache
 *     tags: [User]
 *     parameters:
 *       - in: header
 *         name: X-User-ID
 *         schema:
 *           type: string
 *         description: User identifier (optional, defaults to 'default')
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.delete('/cache', clearUserCache);

export default router;