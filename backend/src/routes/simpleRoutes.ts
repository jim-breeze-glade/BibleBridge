/**
 * Simplified API routes for BibleBridge Backend
 */

import { Router } from 'express';
import { 
  getTranslations, 
  getBooks, 
  getChapter, 
  searchBible 
} from '../controllers/simpleBibleController';
import { 
  getUserPosition,
  saveUserPosition,
  getUserSettings,
  saveUserSettings
} from '../controllers/simpleUserController';
import { 
  generateTtsAudio,
  getTtsHealth
} from '../controllers/simpleTtsController';
import { 
  getAllPronunciations,
  getPronunciation,
  searchPronunciations
} from '../controllers/simplePronunciationController';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'biblebridge-backend'
  });
});

// Bible data endpoints
router.get('/translations', getTranslations);
router.get('/books', getBooks);
router.get('/translations/:translation/:book/:chapter', getChapter);
router.get('/search/:translation', searchBible);

// User data endpoints
router.get('/user/position', getUserPosition);
router.post('/user/position', saveUserPosition);
router.get('/user/settings', getUserSettings);
router.post('/user/settings', saveUserSettings);

// TTS endpoints
router.post('/tts/generate', generateTtsAudio);
router.get('/tts/health', getTtsHealth);

// Pronunciation endpoints
router.get('/pronunciations', getAllPronunciations);
router.get('/pronunciations/search', searchPronunciations);
router.get('/pronunciations/:name', getPronunciation);

export default router;