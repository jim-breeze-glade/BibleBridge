/**
 * Bible API route controllers
 */

import { Request, Response } from 'express';
import { bibleService } from '../services/bibleService';
import { asyncHandler } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Get list of available Bible translations
 * GET /api/translations
 */
export const getTranslations = asyncHandler(async (_req: Request, res: Response) => {
  logger.info('API: Get translations');
  
  const translations = await bibleService.getTranslations();
  
  res.json({
    success: true,
    data: {
      translations,
    },
    meta: {
      total: translations.length,
      available: translations.filter(t => t.available).length,
    },
  });
});

/**
 * Get list of all Bible books with metadata
 * GET /api/books
 */
export const getBooks = asyncHandler(async (_req: Request, res: Response) => {
  logger.info('API: Get books');
  
  const books = await bibleService.getBooks();
  
  // Group by testament for better organization
  const oldTestament = books.filter(book => book.testament === 'Old Testament');
  const newTestament = books.filter(book => book.testament === 'New Testament');
  
  res.json({
    success: true,
    data: {
      books,
      grouped: {
        'Old Testament': oldTestament,
        'New Testament': newTestament,
      },
    },
    meta: {
      total: books.length,
      oldTestament: oldTestament.length,
      newTestament: newTestament.length,
    },
  });
});

/**
 * Get chapters for a specific book
 * GET /api/books/:book/chapters
 */
export const getChapters = asyncHandler(async (req: Request, res: Response) => {
  const { book } = req.params;
  
  if (!book) {
    return res.status(400).json({
      success: false,
      error: 'Book parameter is required',
    });
  }
  
  logger.info('API: Get chapters', { book });
  
  const result = await bibleService.getChapters(book);
  const bookMetadata = bibleService.getBookMetadata(book);
  
  res.json({
    success: true,
    data: {
      book,
      chapters: result.chapters,
      chapterCount: result.chapterCount,
      metadata: bookMetadata,
    },
  });
});

/**
 * Get specific chapter data with verses
 * GET /api/translations/:translation/:book/:chapter
 */
export const getChapter = asyncHandler(async (req: Request, res: Response) => {
  const { translation, book, chapter } = req.params;
  
  if (!translation || !book || !chapter) {
    return res.status(400).json({
      success: false,
      error: 'Translation, book, and chapter parameters are required',
    });
  }
  
  const chapterNum = parseInt(chapter);
  
  if (isNaN(chapterNum) || chapterNum < 1) {
    return res.status(400).json({
      success: false,
      error: 'Chapter must be a positive number',
    });
  }
  
  logger.info('API: Get chapter', { translation, book, chapter: chapterNum });
  
  const chapterData = await bibleService.getChapter(translation, book, chapterNum);
  
  res.json({
    success: true,
    data: chapterData,
    meta: {
      verseCount: chapterData.verses.length,
      hasNavigation: {
        previous: !!chapterData.navigation.previous,
        next: !!chapterData.navigation.next,
      },
    },
  });
});

/**
 * Search Bible text across translations
 * GET /api/search/:translation?query=...
 */
export const searchBible = asyncHandler(async (req: Request, res: Response) => {
  const { translation } = req.params;
  const { query, book, testament, limit = 50, offset = 0 } = req.query as any;
  
  if (!translation) {
    return res.status(400).json({
      success: false,
      error: 'Translation parameter is required',
    });
  }
  
  logger.info('API: Search Bible', { translation, query, book, testament, limit, offset });
  
  if (!query || query.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'Search query must be at least 2 characters long',
    });
  }
  
  const searchQuery = {
    query: query.trim(),
    translation,
    book,
    testament,
    limit: parseInt(limit),
    offset: parseInt(offset),
  };
  
  const results = await bibleService.searchBible(searchQuery);
  
  res.json({
    success: true,
    data: {
      query: searchQuery.query,
      translation,
      results: results.results,
      pagination: {
        page: results.page,
        totalPages: results.totalPages,
        totalResults: results.totalResults,
        limit: searchQuery.limit,
        offset: searchQuery.offset,
        hasNext: results.page < results.totalPages,
        hasPrevious: results.page > 1,
      },
    },
    meta: {
      searchTerm: searchQuery.query,
      scope: book ? `book: ${book}` : testament ? `testament: ${testament}` : 'entire Bible',
      executionTime: Date.now(),
    },
  });
});

/**
 * Get verse of the day (random verse)
 * GET /api/verse-of-the-day
 */
export const getVerseOfTheDay = asyncHandler(async (req: Request, res: Response) => {
  const { translation = 'KJV' } = req.query as any;
  
  logger.info('API: Get verse of the day', { translation });
  
  // Select a random popular verse for verse of the day
  const popularVerses = [
    { book: 'John', chapter: 3, verse: 16 },
    { book: 'Psalms', chapter: 23, verse: 1 },
    { book: 'Romans', chapter: 8, verse: 28 },
    { book: 'Philippians', chapter: 4, verse: 13 },
    { book: 'Jeremiah', chapter: 29, verse: 11 },
    { book: 'Matthew', chapter: 28, verse: 19 },
    { book: 'Isaiah', chapter: 41, verse: 10 },
    { book: 'Proverbs', chapter: 3, verse: 5 },
  ];
  
  // Use current date as seed for consistent daily verse
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const selectedVerse = popularVerses[dayOfYear % popularVerses.length];
  
  if (!selectedVerse) {
    return res.status(500).json({
      success: false,
      error: 'Failed to select verse for today',
    });
  }

  try {
    const chapterData = await bibleService.getChapter(translation, selectedVerse.book, selectedVerse.chapter);
    const verse = chapterData.verses.find(v => parseInt(v.verse) === selectedVerse.verse);
    
    if (!verse) {
      throw new Error('Verse not found');
    }
    
    res.json({
      success: true,
      data: {
        book: selectedVerse.book,
        chapter: selectedVerse.chapter,
        verse: selectedVerse.verse,
        text: verse.text,
        translation,
        reference: `${selectedVerse.book} ${selectedVerse.chapter}:${selectedVerse.verse}`,
        date: today.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    // Fallback to a simple verse if something goes wrong
    res.json({
      success: true,
      data: {
        book: 'John',
        chapter: 3,
        verse: 16,
        text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
        translation: 'KJV',
        reference: 'John 3:16',
        date: today.toISOString().split('T')[0],
      },
    });
  }
});

/**
 * Get reading plan suggestions
 * GET /api/reading-plan
 */
export const getReadingPlan = asyncHandler(async (req: Request, res: Response) => {
  const { plan = 'chronological', day } = req.query as any;
  
  logger.info('API: Get reading plan', { plan, day });
  
  // Simple 365-day chronological reading plan
  const readingPlans = {
    chronological: [
      { day: 1, readings: [{ book: 'Genesis', chapters: [1, 2, 3] }] },
      { day: 2, readings: [{ book: 'Genesis', chapters: [4, 5, 6, 7] }] },
      { day: 3, readings: [{ book: 'Genesis', chapters: [8, 9, 10, 11] }] },
      // Add more days as needed...
    ],
    newTestament: [
      { day: 1, readings: [{ book: 'Matthew', chapters: [1] }] },
      { day: 2, readings: [{ book: 'Matthew', chapters: [2] }] },
      // Add more days as needed...
    ],
  };
  
  const selectedPlan = readingPlans[plan as keyof typeof readingPlans] || readingPlans.chronological;
  
  if (day) {
    const dayNum = parseInt(day);
    const dayReading = selectedPlan.find(p => p.day === dayNum);
    
    if (!dayReading) {
      return res.status(404).json({
        success: false,
        error: `No reading plan found for day ${dayNum}`,
      });
    }
    
    res.json({
      success: true,
      data: dayReading,
    });
  } else {
    res.json({
      success: true,
      data: {
        plan,
        totalDays: selectedPlan.length,
        readings: selectedPlan.slice(0, 10), // Return first 10 days
      },
      meta: {
        availablePlans: Object.keys(readingPlans),
      },
    });
  }
});

/**
 * Get Bible statistics
 * GET /api/stats
 */
export const getBibleStats = asyncHandler(async (_req: Request, res: Response) => {
  logger.info('API: Get Bible statistics');
  
  const books = await bibleService.getBooks();
  const translations = await bibleService.getTranslations();
  
  const stats = {
    books: {
      total: books.length,
      oldTestament: books.filter(b => b.testament === 'Old Testament').length,
      newTestament: books.filter(b => b.testament === 'New Testament').length,
    },
    chapters: {
      total: books.reduce((sum, book) => sum + book.chapterCount, 0),
      oldTestament: books
        .filter(b => b.testament === 'Old Testament')
        .reduce((sum, book) => sum + book.chapterCount, 0),
      newTestament: books
        .filter(b => b.testament === 'New Testament')
        .reduce((sum, book) => sum + book.chapterCount, 0),
    },
    translations: {
      total: translations.length,
      available: translations.filter(t => t.available).length,
      codes: translations.filter(t => t.available).map(t => t.code),
    },
  };
  
  res.json({
    success: true,
    data: stats,
  });
});