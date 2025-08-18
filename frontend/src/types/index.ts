/**
 * TypeScript interface definitions for BibleBridge Frontend
 * Based on backend API types with frontend-specific additions
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

export interface UserPosition {
  book: string;
  chapter: number;
  verse?: number;
  translation?: string;
  timestamp: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  fontFamily: string;
  showRedLetters: boolean;
  redLetterBrightness: number;
  textBrightness: number;
  rgbWaveEnabled: boolean;
  rgbWaveSpeed: number;
  showPronunciations: boolean;
  pronunciationStyle: 'phonetic' | 'ipa';
  pronunciationTooltipDelay?: number;
  ttsEnabled: boolean;
  ttsVoiceSpeed?: number;
  ttsVolume?: number;
  leftTranslation: string;
  rightTranslation: string;
  sidebarWidth?: number;
  panelSpacing?: number;
  lineHeight?: number;
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

export interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  relevance?: number;
}

export interface SearchResponse {
  query: string;
  translation: string;
  results: SearchResult[];
  totalResults: number;
  page: number;
  totalPages: number;
}

// Frontend-specific interfaces
export interface BibleState {
  currentBook: string;
  currentChapter: number;
  currentVerse?: number;
  leftTranslation: string;
  rightTranslation: string;
  translations: Translation[];
  books: BookMetadata[];
  leftChapterData: GetChapterResponse | null;
  rightChapterData: GetChapterResponse | null;
  loading: boolean;
  error: string | null;
  userSettings: UserSettings;
  pronunciations: Record<string, PronunciationData>;
}

export interface BibleContextType {
  state: BibleState;
  actions: {
    setCurrentLocation: (book: string, chapter: number, verse?: number) => void;
    setTranslations: (left: string, right: string) => void;
    loadChapter: (translation: string, book: string, chapter: number) => Promise<void>;
    navigateToNext: () => void;
    navigateToPrevious: () => void;
    updateUserSettings: (settings: Partial<UserSettings>) => void;
    searchBible: (query: string, translation: string) => Promise<SearchResponse>;
    playTTS: (text: string, name?: string) => Promise<void>;
  };
}

// Component props interfaces
export interface VerseTextProps {
  verse: BibleVerse;
  book: string;
  chapter: number;
  translation: string;
  showRedLetters: boolean;
  redLetterBrightness: number;
  showPronunciations: boolean;
  pronunciationStyle: 'phonetic' | 'ipa';
  onVerseClick?: (verse: string) => void;
}

export interface BibleTextPanelProps {
  chapterData: GetChapterResponse | null;
  translation: string;
  loading: boolean;
  error: string | null;
  userSettings: UserSettings;
  onVerseClick?: (verse: string) => void;
}

export interface BibleComparisonProps {
  leftChapterData: GetChapterResponse | null;
  rightChapterData: GetChapterResponse | null;
  leftTranslation: string;
  rightTranslation: string;
  loading: boolean;
  userSettings: UserSettings;
}

export interface NavigationButtonsProps {
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  currentBook: string;
  currentChapter: number;
}

export interface BookSelectorProps {
  books: BookMetadata[];
  currentBook: string;
  onBookSelect: (book: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export interface ChapterSelectorProps {
  currentBook: string;
  currentChapter: number;
  totalChapters: number;
  onChapterSelect: (chapter: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// API Error interface
export interface ApiError {
  message: string;
  code: string;
  details?: any;
  timestamp: string;
}

// Red letter text configuration
export const RED_LETTER_BOOKS = ['Matthew', 'Mark', 'Luke', 'John'];

// Default user settings
export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'system',
  fontSize: 16,
  fontFamily: 'Georgia, "Times New Roman", Times, serif',
  showRedLetters: true,
  redLetterBrightness: 0.8,
  textBrightness: 1.0,
  rgbWaveEnabled: false,
  rgbWaveSpeed: 1,
  showPronunciations: true,
  pronunciationStyle: 'phonetic',
  pronunciationTooltipDelay: 500,
  ttsEnabled: true,
  ttsVoiceSpeed: 1.0,
  ttsVolume: 0.8,
  leftTranslation: 'KJV',
  rightTranslation: 'NLT',
  sidebarWidth: 300,
  panelSpacing: 16,
  lineHeight: 1.6,
};

// TTS and Audio Management interfaces
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
  audio: ArrayBuffer;
  contentType: string;
  filename: string;
}

export interface AudioCacheEntry {
  buffer: AudioBuffer;
  createdAt: number;
  lastUsed: number;
  size: number;
}

export interface AudioPlaybackState {
  isPlaying: boolean;
  currentName?: string;
  duration?: number;
  currentTime?: number;
  volume: number;
  muted: boolean;
}

export interface TTSServiceStats {
  cacheSize: number;
  cacheHits: number;
  cacheMisses: number;
  totalRequests: number;
  errors: number;
  averageResponseTime: number;
}

// Component interfaces for pronunciation system
export interface BiblicalNameProps {
  name: string;
  children: React.ReactNode;
  pronunciation?: PronunciationData;
  onClick?: (name: string) => void;
  showTooltip?: boolean;
  pronunciationStyle?: 'phonetic' | 'ipa';
  disabled?: boolean;
}

export interface PronunciationTooltipProps {
  name: string;
  pronunciation: PronunciationData;
  pronunciationStyle: 'phonetic' | 'ipa';
  onPlayAudio?: (name: string) => void;
  isPlaying?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface TTSAudioManagerState {
  playbackState: AudioPlaybackState;
  cacheStats: TTSServiceStats;
  isServiceAvailable: boolean;
  lastError?: string;
}

export interface AudioControlsProps {
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Enhanced pronunciation service interface
export interface PronunciationServiceInterface {
  getPronunciation(name: string): Promise<PronunciationData | null>;
  getAllPronunciations(): Promise<Record<string, PronunciationData>>;
  playPronunciation(name: string, options?: Partial<TTSRequest>): Promise<void>;
  preloadNames(names: string[]): Promise<void>;
  getCacheStats(): TTSServiceStats;
  clearCache(): void;
  isServiceAvailable(): boolean;
}

// Audio Manager interface
export interface AudioManagerInterface {
  playAudio(name: string, audioData: ArrayBuffer): Promise<void>;
  stopAudio(): void;
  pauseAudio(): void;
  resumeAudio(): void;
  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unmute(): void;
  isMuted(): boolean;
  isPlaying(): boolean;
  getCurrentPlayback(): AudioPlaybackState;
  getCachedAudio(name: string): AudioBuffer | null;
  cacheAudio(name: string, buffer: AudioBuffer): void;
  clearCache(): void;
  getCacheSize(): number;
  onPlaybackStateChange(callback: (state: AudioPlaybackState) => void): void;
}

// Constants for TTS system
export const TTS_CONFIG = {
  CACHE_MAX_SIZE: 50, // Maximum number of cached audio files
  CACHE_MAX_AGE: 3600000, // 1 hour in milliseconds
  DEFAULT_VOLUME: 0.8,
  DEFAULT_SPEED: 0.8,
  SUPPORTED_FORMATS: ['phonetic', 'ipa', 'phoneme'] as const,
  AUDIO_FORMAT: {
    type: 'WAV',
    sampleRate: 22050,
    channels: 1,
    bitDepth: 16,
  },
} as const;

export const PRONUNCIATION_COLORS = {
  link: '#007bff',
  linkHover: '#0056b3',
  tooltip: {
    background: '#333',
    text: '#fff',
    border: '#555',
  },
  button: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
  },
} as const;

// API base URL (should be configurable via environment variables)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';