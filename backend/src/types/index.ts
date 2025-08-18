/**
 * TypeScript type definitions for BibleBridge Backend API
 */

export interface BibleVerse {
  verse: string;
  text: string;
}

export interface BibleChapter {
  chapter: string;
  verses: BibleVerse[];
}

export interface BibleBook {
  book: string;
  chapters: BibleChapter[];
}

export interface BookMetadata {
  name: string;
  testament: 'Old Testament' | 'New Testament';
  chapterCount: number;
  abbreviation?: string;
  order: number;
}

export interface Translation {
  code: string;
  name: string;
  description: string;
  available: boolean;
}

export interface PronunciationData {
  phonetic?: string;
  ipa?: string;
  phoneme?: string;
  source?: string;
}

export interface BiblicalName {
  [name: string]: PronunciationData;
}

export interface PronunciationDatabase {
  names: BiblicalName;
}

export interface UserPosition {
  book: string;
  chapter: number;
  verse?: number;
  translation?: string;
  timestamp: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
  showRedLetters: boolean;
  redLetterBrightness: number;
  textBrightness: number;
  rgbWaveEnabled: boolean;
  rgbWaveSpeed: number;
  showPronunciations: boolean;
  pronunciationStyle: 'phonetic' | 'ipa';
  ttsEnabled: boolean;
  leftTranslation: string;
  rightTranslation: string;
}

export interface TTSRequest {
  name: string;
  phonetic?: string;
  ipa?: string;
  phoneme?: string;
  voice_settings?: {
    speed?: number;
    speaker_id?: number;
  };
}

export interface TTSResponse {
  audio: Buffer;
  contentType: string;
  filename: string;
}

export interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  relevance?: number;
}

export interface SearchQuery {
  query: string;
  translation: string;
  book?: string;
  testament?: 'Old Testament' | 'New Testament';
  limit?: number;
  offset?: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
  timestamp: string;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    tts: {
      available: boolean;
      responseTime?: number;
    };
    database: {
      available: boolean;
      translations: number;
    };
  };
  uptime: number;
  version: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  size: number;
  hitRate: number;
}

// Request/Response interfaces
export interface GetTranslationsResponse {
  translations: Translation[];
}

export interface GetBooksResponse {
  books: BookMetadata[];
}

export interface GetChaptersResponse {
  book: string;
  chapters: number[];
  chapterCount: number;
}

export interface GetChapterResponse {
  book: string;
  chapter: number;
  translation: string;
  verses: BibleVerse[];
  navigation: {
    previous?: {
      book: string;
      chapter: number;
    };
    next?: {
      book: string;
      chapter: number;
    };
  };
}

export interface SearchResponse {
  query: string;
  translation: string;
  results: SearchResult[];
  totalResults: number;
  page: number;
  totalPages: number;
}

// Express Request extensions
export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    preferences: UserSettings;
  };
}

// Configuration interfaces
export interface ServerConfig {
  port: number;
  host: string;
  env: string;
  cors: {
    origin: string[];
  };
  tts: {
    serviceUrl: string;
    timeout: number;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  paths: {
    translations: string;
    pronunciations: string;
    userData: string;
  };
}