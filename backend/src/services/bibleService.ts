/**
 * Bible data service for loading and processing Bible translations
 */

import fs from 'fs/promises';
import path from 'path';
import { 
  BibleBook, 
  BibleChapter, 
  BibleVerse, 
  BookMetadata, 
  Translation, 
  GetChapterResponse,
  SearchResult,
  SearchQuery 
} from '../types';
import { config } from '../utils/config';
import { cache, cacheKeys } from '../utils/cache';
import { logger, logPerformance } from '../utils/logger';
import { NotFoundError, ServiceUnavailableError } from '../utils/errors';

/**
 * Bible books metadata with chapter counts and order
 */
const BIBLE_BOOKS_METADATA: BookMetadata[] = [
  // Old Testament
  { name: 'Genesis', testament: 'Old Testament', chapterCount: 50, order: 1 },
  { name: 'Exodus', testament: 'Old Testament', chapterCount: 40, order: 2 },
  { name: 'Leviticus', testament: 'Old Testament', chapterCount: 27, order: 3 },
  { name: 'Numbers', testament: 'Old Testament', chapterCount: 36, order: 4 },
  { name: 'Deuteronomy', testament: 'Old Testament', chapterCount: 34, order: 5 },
  { name: 'Joshua', testament: 'Old Testament', chapterCount: 24, order: 6 },
  { name: 'Judges', testament: 'Old Testament', chapterCount: 21, order: 7 },
  { name: 'Ruth', testament: 'Old Testament', chapterCount: 4, order: 8 },
  { name: '1 Samuel', testament: 'Old Testament', chapterCount: 31, order: 9 },
  { name: '2 Samuel', testament: 'Old Testament', chapterCount: 24, order: 10 },
  { name: '1 Kings', testament: 'Old Testament', chapterCount: 22, order: 11 },
  { name: '2 Kings', testament: 'Old Testament', chapterCount: 25, order: 12 },
  { name: '1 Chronicles', testament: 'Old Testament', chapterCount: 29, order: 13 },
  { name: '2 Chronicles', testament: 'Old Testament', chapterCount: 36, order: 14 },
  { name: 'Ezra', testament: 'Old Testament', chapterCount: 10, order: 15 },
  { name: 'Nehemiah', testament: 'Old Testament', chapterCount: 13, order: 16 },
  { name: 'Esther', testament: 'Old Testament', chapterCount: 10, order: 17 },
  { name: 'Job', testament: 'Old Testament', chapterCount: 42, order: 18 },
  { name: 'Psalms', testament: 'Old Testament', chapterCount: 150, order: 19 },
  { name: 'Proverbs', testament: 'Old Testament', chapterCount: 31, order: 20 },
  { name: 'Ecclesiastes', testament: 'Old Testament', chapterCount: 12, order: 21 },
  { name: 'Song of Songs', testament: 'Old Testament', chapterCount: 8, order: 22 },
  { name: 'Isaiah', testament: 'Old Testament', chapterCount: 66, order: 23 },
  { name: 'Jeremiah', testament: 'Old Testament', chapterCount: 52, order: 24 },
  { name: 'Lamentations', testament: 'Old Testament', chapterCount: 5, order: 25 },
  { name: 'Ezekiel', testament: 'Old Testament', chapterCount: 48, order: 26 },
  { name: 'Daniel', testament: 'Old Testament', chapterCount: 12, order: 27 },
  { name: 'Hosea', testament: 'Old Testament', chapterCount: 14, order: 28 },
  { name: 'Joel', testament: 'Old Testament', chapterCount: 3, order: 29 },
  { name: 'Amos', testament: 'Old Testament', chapterCount: 9, order: 30 },
  { name: 'Obadiah', testament: 'Old Testament', chapterCount: 1, order: 31 },
  { name: 'Jonah', testament: 'Old Testament', chapterCount: 4, order: 32 },
  { name: 'Micah', testament: 'Old Testament', chapterCount: 7, order: 33 },
  { name: 'Nahum', testament: 'Old Testament', chapterCount: 3, order: 34 },
  { name: 'Habakkuk', testament: 'Old Testament', chapterCount: 3, order: 35 },
  { name: 'Zephaniah', testament: 'Old Testament', chapterCount: 3, order: 36 },
  { name: 'Haggai', testament: 'Old Testament', chapterCount: 2, order: 37 },
  { name: 'Zechariah', testament: 'Old Testament', chapterCount: 14, order: 38 },
  { name: 'Malachi', testament: 'Old Testament', chapterCount: 4, order: 39 },
  
  // New Testament
  { name: 'Matthew', testament: 'New Testament', chapterCount: 28, order: 40 },
  { name: 'Mark', testament: 'New Testament', chapterCount: 16, order: 41 },
  { name: 'Luke', testament: 'New Testament', chapterCount: 24, order: 42 },
  { name: 'John', testament: 'New Testament', chapterCount: 21, order: 43 },
  { name: 'Acts', testament: 'New Testament', chapterCount: 28, order: 44 },
  { name: 'Romans', testament: 'New Testament', chapterCount: 16, order: 45 },
  { name: '1 Corinthians', testament: 'New Testament', chapterCount: 16, order: 46 },
  { name: '2 Corinthians', testament: 'New Testament', chapterCount: 13, order: 47 },
  { name: 'Galatians', testament: 'New Testament', chapterCount: 6, order: 48 },
  { name: 'Ephesians', testament: 'New Testament', chapterCount: 6, order: 49 },
  { name: 'Philippians', testament: 'New Testament', chapterCount: 4, order: 50 },
  { name: 'Colossians', testament: 'New Testament', chapterCount: 4, order: 51 },
  { name: '1 Thessalonians', testament: 'New Testament', chapterCount: 5, order: 52 },
  { name: '2 Thessalonians', testament: 'New Testament', chapterCount: 3, order: 53 },
  { name: '1 Timothy', testament: 'New Testament', chapterCount: 6, order: 54 },
  { name: '2 Timothy', testament: 'New Testament', chapterCount: 4, order: 55 },
  { name: 'Titus', testament: 'New Testament', chapterCount: 3, order: 56 },
  { name: 'Philemon', testament: 'New Testament', chapterCount: 1, order: 57 },
  { name: 'Hebrews', testament: 'New Testament', chapterCount: 13, order: 58 },
  { name: 'James', testament: 'New Testament', chapterCount: 5, order: 59 },
  { name: '1 Peter', testament: 'New Testament', chapterCount: 5, order: 60 },
  { name: '2 Peter', testament: 'New Testament', chapterCount: 3, order: 61 },
  { name: '1 John', testament: 'New Testament', chapterCount: 5, order: 62 },
  { name: '2 John', testament: 'New Testament', chapterCount: 1, order: 63 },
  { name: '3 John', testament: 'New Testament', chapterCount: 1, order: 64 },
  { name: 'Jude', testament: 'New Testament', chapterCount: 1, order: 65 },
  { name: 'Revelation', testament: 'New Testament', chapterCount: 22, order: 66 },
];

/**
 * Available Bible translations
 */
const AVAILABLE_TRANSLATIONS: Translation[] = [
  { code: 'KJV', name: 'King James Version', description: 'Classic English translation from 1611', available: true },
  { code: 'NLT', name: 'New Living Translation', description: 'Modern, easy-to-read translation', available: true },
  { code: 'NIV', name: 'New International Version', description: 'Popular modern translation', available: true },
  { code: 'CSB', name: 'Christian Standard Bible', description: 'Contemporary translation balancing accuracy and readability', available: true },
];

/**
 * Map book names to filename formats for different translations
 */
function getBookFilename(book: string, translation: string): string {
  let filename = book.replace(/\s+/g, ''); // Remove spaces
  
  // Handle special cases for Song of Songs/Solomon
  if (book === 'Song of Songs') {
    filename = translation === 'CSB' ? 'SongofSongs' : 'SongofSolomon';
  }
  
  return filename;
}

export class BibleService {
  private translationPaths: Map<string, string> = new Map();

  constructor() {
    this.initializeTranslationPaths();
  }

  /**
   * Initialize file paths for each translation
   */
  private initializeTranslationPaths(): void {
    for (const translation of AVAILABLE_TRANSLATIONS) {
      const translationPath = path.join(config.paths.translations, `${translation.code}_json`);
      this.translationPaths.set(translation.code, translationPath);
    }
  }

  /**
   * Get list of available translations
   */
  async getTranslations(): Promise<Translation[]> {
    const cacheKey = 'translations:all';
    
    return cache.getOrSet(cacheKey, async () => {
      const start = Date.now();
      
      // Verify each translation directory exists
      const verifiedTranslations: Translation[] = [];
      
      for (const translation of AVAILABLE_TRANSLATIONS) {
        try {
          const translationPath = this.translationPaths.get(translation.code);
          if (translationPath) {
            await fs.access(translationPath);
            verifiedTranslations.push(translation);
          }
        } catch (error) {
          logger.warn(`Translation ${translation.code} not available`, { error: error.message });
          verifiedTranslations.push({ ...translation, available: false });
        }
      }
      
      logPerformance('getTranslations', Date.now() - start);
      return verifiedTranslations;
    }, 3600); // Cache for 1 hour
  }

  /**
   * Get list of all Bible books with metadata
   */
  async getBooks(): Promise<BookMetadata[]> {
    const cacheKey = 'books:metadata';
    
    return cache.getOrSet(cacheKey, async () => {
      return BIBLE_BOOKS_METADATA;
    }, 3600); // Cache for 1 hour
  }

  /**
   * Get chapters for a specific book
   */
  async getChapters(book: string): Promise<{ chapters: number[]; chapterCount: number }> {
    const cacheKey = `chapters:${book}`;
    
    return cache.getOrSet(cacheKey, async () => {
      const bookMetadata = BIBLE_BOOKS_METADATA.find(b => b.name === book);
      
      if (!bookMetadata) {
        throw new NotFoundError(`Book '${book}'`);
      }
      
      const chapters = Array.from({ length: bookMetadata.chapterCount }, (_, i) => i + 1);
      
      return {
        chapters,
        chapterCount: bookMetadata.chapterCount,
      };
    }, 3600); // Cache for 1 hour
  }

  /**
   * Load Bible book data from JSON file
   */
  private async loadBookData(translation: string, book: string): Promise<BibleBook> {
    const start = Date.now();
    const cacheKey = cacheKeys.bible(translation, book);
    
    return cache.getOrSet(cacheKey, async () => {
      const translationPath = this.translationPaths.get(translation);
      if (!translationPath) {
        throw new NotFoundError(`Translation '${translation}'`);
      }
      
      const filename = getBookFilename(book, translation);
      const filePath = path.join(translationPath, `${filename}.json`);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        logPerformance(`loadBookData:${translation}:${book}`, Date.now() - start);
        
        return data as BibleBook;
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          throw new NotFoundError(`${translation} translation for book '${book}'`);
        }
        throw new ServiceUnavailableError(`Error loading ${translation} ${book}: ${error.message}`);
      }
    });
  }

  /**
   * Get specific chapter data with navigation info
   */
  async getChapter(translation: string, book: string, chapter: number): Promise<GetChapterResponse> {
    const start = Date.now();
    const cacheKey = cacheKeys.bible(translation, book, chapter);
    
    return cache.getOrSet(cacheKey, async () => {
      const bookData = await this.loadBookData(translation, book);
      
      // Find the requested chapter
      const chapterData = bookData.chapters.find(ch => parseInt(ch.chapter) === chapter);
      
      if (!chapterData) {
        throw new NotFoundError(`Chapter ${chapter} in ${translation} ${book}`);
      }
      
      // Generate navigation information
      const navigation = this.generateNavigation(book, chapter);
      
      logPerformance(`getChapter:${translation}:${book}:${chapter}`, Date.now() - start);
      
      return {
        book,
        chapter,
        translation,
        verses: chapterData.verses,
        navigation,
      };
    });
  }

  /**
   * Generate navigation information for previous/next chapter
   */
  private generateNavigation(book: string, chapter: number): GetChapterResponse['navigation'] {
    const currentBookMeta = BIBLE_BOOKS_METADATA.find(b => b.name === book);
    if (!currentBookMeta) return {};
    
    const navigation: GetChapterResponse['navigation'] = {};
    
    // Previous chapter
    if (chapter > 1) {
      navigation.previous = { book, chapter: chapter - 1 };
    } else if (currentBookMeta.order > 1) {
      // Go to previous book's last chapter
      const prevBookMeta = BIBLE_BOOKS_METADATA.find(b => b.order === currentBookMeta.order - 1);
      if (prevBookMeta) {
        navigation.previous = { book: prevBookMeta.name, chapter: prevBookMeta.chapterCount };
      }
    }
    
    // Next chapter
    if (chapter < currentBookMeta.chapterCount) {
      navigation.next = { book, chapter: chapter + 1 };
    } else if (currentBookMeta.order < 66) {
      // Go to next book's first chapter
      const nextBookMeta = BIBLE_BOOKS_METADATA.find(b => b.order === currentBookMeta.order + 1);
      if (nextBookMeta) {
        navigation.next = { book: nextBookMeta.name, chapter: 1 };
      }
    }
    
    return navigation;
  }

  /**
   * Search Bible text across translations
   */
  async searchBible(searchQuery: SearchQuery): Promise<{ 
    results: SearchResult[]; 
    totalResults: number; 
    page: number; 
    totalPages: number; 
  }> {
    const start = Date.now();
    const limit = searchQuery.limit || 50;
    const offset = searchQuery.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    
    const cacheKey = cacheKeys.search(searchQuery.query, searchQuery.translation, {
      book: searchQuery.book,
      testament: searchQuery.testament,
      limit,
      offset,
    });
    
    return cache.getOrSet(cacheKey, async () => {
      const results: SearchResult[] = [];
      const searchTerms = searchQuery.query.toLowerCase().split(/\s+/);
      
      // Determine books to search
      let booksToSearch = BIBLE_BOOKS_METADATA;
      
      if (searchQuery.book) {
        booksToSearch = booksToSearch.filter(book => book.name === searchQuery.book);
      } else if (searchQuery.testament) {
        booksToSearch = booksToSearch.filter(book => book.testament === searchQuery.testament);
      }
      
      // Search through books
      for (const bookMeta of booksToSearch) {
        try {
          const bookData = await this.loadBookData(searchQuery.translation, bookMeta.name);
          
          for (const chapter of bookData.chapters) {
            for (const verse of chapter.verses) {
              const verseText = verse.text.toLowerCase();
              
              // Check if all search terms are present
              const matchesAll = searchTerms.every(term => verseText.includes(term));
              
              if (matchesAll) {
                results.push({
                  book: bookMeta.name,
                  chapter: parseInt(chapter.chapter),
                  verse: parseInt(verse.verse),
                  text: verse.text,
                  translation: searchQuery.translation,
                  relevance: this.calculateRelevance(verse.text, searchTerms),
                });
              }
            }
          }
        } catch (error) {
          logger.warn(`Error searching book ${bookMeta.name}`, { error: error.message });
          continue;
        }
      }
      
      // Sort by relevance and book order
      results.sort((a, b) => {
        if (a.relevance !== b.relevance) {
          return (b.relevance || 0) - (a.relevance || 0);
        }
        
        const bookA = BIBLE_BOOKS_METADATA.find(book => book.name === a.book);
        const bookB = BIBLE_BOOKS_METADATA.find(book => book.name === b.book);
        
        if (bookA && bookB && bookA.order !== bookB.order) {
          return bookA.order - bookB.order;
        }
        
        if (a.chapter !== b.chapter) {
          return a.chapter - b.chapter;
        }
        
        return a.verse - b.verse;
      });
      
      const totalResults = results.length;
      const totalPages = Math.ceil(totalResults / limit);
      const paginatedResults = results.slice(offset, offset + limit);
      
      logPerformance(`searchBible:${searchQuery.translation}:${searchQuery.query}`, Date.now() - start);
      
      return {
        results: paginatedResults,
        totalResults,
        page,
        totalPages,
      };
    }, 300); // Cache search results for 5 minutes
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevance(text: string, searchTerms: string[]): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    for (const term of searchTerms) {
      const termIndex = lowerText.indexOf(term);
      if (termIndex !== -1) {
        // Higher score for exact matches
        score += 10;
        
        // Bonus for word boundaries
        if (termIndex === 0 || lowerText[termIndex - 1] === ' ') {
          score += 5;
        }
        
        // Bonus for multiple occurrences
        const occurrences = (lowerText.match(new RegExp(term, 'g')) || []).length;
        score += (occurrences - 1) * 2;
      }
    }
    
    return score;
  }

  /**
   * Validate if book exists
   */
  isValidBook(book: string): boolean {
    return BIBLE_BOOKS_METADATA.some(b => b.name === book);
  }

  /**
   * Validate if translation exists
   */
  async isValidTranslation(translation: string): Promise<boolean> {
    const translations = await this.getTranslations();
    return translations.some(t => t.code === translation && t.available);
  }

  /**
   * Get book metadata by name
   */
  getBookMetadata(book: string): BookMetadata | undefined {
    return BIBLE_BOOKS_METADATA.find(b => b.name === book);
  }
}

// Export singleton instance
export const bibleService = new BibleService();