/**
 * Enhanced Pronunciation Service
 * Handles biblical name pronunciations with TTS integration and caching
 */

import { apiService } from './api';
import {
  PronunciationData,
  TTSRequest,
  TTSServiceStats,
  PronunciationServiceInterface,
  TTS_CONFIG,
} from '../types';

class PronunciationService implements PronunciationServiceInterface {
  private pronunciationCache: Map<string, PronunciationData> = new Map();
  private audioCache: Map<string, ArrayBuffer> = new Map();
  private stats: TTSServiceStats = {
    cacheSize: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    errors: 0,
    averageResponseTime: 0,
  };
  private serviceAvailable: boolean = true;
  private lastHealthCheck: number = 0;
  private preloadPromises: Map<string, Promise<void>> = new Map();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Load all pronunciations on initialization
      await this.loadAllPronunciations();
    } catch (error) {
      console.error('Failed to initialize pronunciation service:', error);
      this.serviceAvailable = false;
    }
  }

  private async loadAllPronunciations(): Promise<void> {
    try {
      const pronunciations = await apiService.getPronunciations();
      
      // Cache all pronunciations
      Object.entries(pronunciations).forEach(([name, data]) => {
        this.pronunciationCache.set(name.toLowerCase(), data);
      });

      console.log(`Loaded ${Object.keys(pronunciations).length} biblical name pronunciations`);
    } catch (error) {
      console.error('Error loading pronunciations:', error);
      throw error;
    }
  }

  async getPronunciation(name: string): Promise<PronunciationData | null> {
    const normalizedName = name.toLowerCase();
    
    // Check local cache first
    const cached = this.pronunciationCache.get(normalizedName);
    if (cached) {
      this.stats.cacheHits++;
      return cached;
    }

    // If not in cache, try API
    this.stats.cacheMisses++;
    try {
      const pronunciation = await apiService.getPronunciation(name);
      
      if (pronunciation) {
        // Cache the result
        this.pronunciationCache.set(normalizedName, pronunciation);
      }
      
      return pronunciation;
    } catch (error) {
      console.error(`Error fetching pronunciation for "${name}":`, error);
      this.stats.errors++;
      return null;
    }
  }

  async getAllPronunciations(): Promise<Record<string, PronunciationData>> {
    const result: Record<string, PronunciationData> = {};
    
    this.pronunciationCache.forEach((data, name) => {
      result[name] = data;
    });

    return result;
  }

  async playPronunciation(name: string, options: Partial<TTSRequest> = {}): Promise<void> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Get pronunciation data
      const pronunciation = await this.getPronunciation(name);
      if (!pronunciation) {
        throw new Error(`No pronunciation data available for "${name}"`);
      }

      // Check audio cache first
      const cacheKey = this.getAudioCacheKey(name, options);
      const cachedAudio = this.audioCache.get(cacheKey);

      let audioData: ArrayBuffer;

      if (cachedAudio) {
        audioData = cachedAudio;
        this.stats.cacheHits++;
      } else {
        // Request TTS generation from API
        const ttsOptions: TTSRequest = {
          name,
          phonetic: pronunciation.phonetic,
          ipa: pronunciation.ipa,
          phoneme: pronunciation.phoneme,
          voice_settings: options.voice_settings || {
            speed: TTS_CONFIG.DEFAULT_SPEED,
          },
        };

        const audioBlob = await apiService.playTTS(name, ttsOptions);
        audioData = await audioBlob.arrayBuffer();

        // Cache the audio data
        this.audioCache.set(cacheKey, audioData);
        this.stats.cacheMisses++;
      }

      // Update stats
      this.stats.averageResponseTime = (
        (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + 
         (Date.now() - startTime)) / this.stats.totalRequests
      );

      // The actual audio playback is handled by the audio manager
      // This service just returns the audio data via the event system
      this.notifyAudioReady(name, audioData);

    } catch (error) {
      this.stats.errors++;
      console.error(`Error playing pronunciation for "${name}":`, error);
      throw error;
    }
  }

  private getAudioCacheKey(name: string, options: Partial<TTSRequest>): string {
    const settings = options.voice_settings || {};
    return `${name.toLowerCase()}_${settings.speed || TTS_CONFIG.DEFAULT_SPEED}_${settings.speaker_id || 0}`;
  }

  private notifyAudioReady(name: string, audioData: ArrayBuffer): void {
    // Dispatch custom event for audio manager to handle
    const event = new CustomEvent('pronunciationAudioReady', {
      detail: { name, audioData }
    });
    window.dispatchEvent(event);
  }

  async preloadNames(names: string[]): Promise<void> {
    const nameSet = new Set(names.map(name => name.toLowerCase()));
    const uniqueNames = Array.from(nameSet);
    
    console.log(`Preloading pronunciations for ${uniqueNames.length} names`);

    const preloadPromises = uniqueNames.map(async (name) => {
      // Check if already preloading
      if (this.preloadPromises.has(name)) {
        return this.preloadPromises.get(name);
      }

      const promise = this.preloadSingleName(name);
      this.preloadPromises.set(name, promise);
      
      try {
        await promise;
      } finally {
        this.preloadPromises.delete(name);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  private async preloadSingleName(name: string): Promise<void> {
    try {
      // Load pronunciation data if not cached
      await this.getPronunciation(name);

      // Pre-generate audio if not cached
      const cacheKey = this.getAudioCacheKey(name, {});
      if (!this.audioCache.has(cacheKey)) {
        await this.playPronunciation(name);
      }
    } catch (error) {
      console.warn(`Failed to preload pronunciation for "${name}":`, error);
    }
  }

  getCacheStats(): TTSServiceStats {
    return {
      ...this.stats,
      cacheSize: this.pronunciationCache.size + this.audioCache.size,
    };
  }

  clearCache(): void {
    this.pronunciationCache.clear();
    this.audioCache.clear();
    this.stats = {
      cacheSize: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      errors: 0,
      averageResponseTime: 0,
    };
  }

  isServiceAvailable(): boolean {
    // Check service health periodically
    const now = Date.now();
    if (now - this.lastHealthCheck > 30000) { // Check every 30 seconds
      this.checkServiceHealth();
    }
    
    return this.serviceAvailable;
  }

  private async checkServiceHealth(): Promise<void> {
    this.lastHealthCheck = Date.now();
    
    try {
      await apiService.healthCheck();
      this.serviceAvailable = true;
    } catch (error) {
      console.warn('TTS service health check failed:', error);
      this.serviceAvailable = false;
    }
  }

  /**
   * Get common biblical names for preloading
   */
  getCommonBiblicalNames(): string[] {
    const commonNames = [
      'Jesus', 'Christ', 'God', 'Lord', 'Abraham', 'Moses', 'David', 'Solomon',
      'Isaiah', 'Jeremiah', 'Ezekiel', 'Daniel', 'Matthew', 'Mark', 'Luke', 'John',
      'Paul', 'Peter', 'James', 'Mary', 'Martha', 'Lazarus', 'Judas', 'Pilate',
      'Jerusalem', 'Bethlehem', 'Nazareth', 'Galilee', 'Jordan', 'Pharaoh'
    ];

    // Filter to only names that have pronunciation data
    return commonNames.filter(name => 
      this.pronunciationCache.has(name.toLowerCase())
    );
  }

  /**
   * Extract biblical names from text
   */
  extractBiblicalNamesFromText(text: string): Set<string> {
    const words = text.split(/\s+/);
    const biblicalNames = new Set<string>();

    words.forEach(word => {
      // Clean the word (remove punctuation)
      const cleanWord = word.replace(/[^\w]/g, '');
      
      // Check if it's a known biblical name
      if (cleanWord && this.pronunciationCache.has(cleanWord.toLowerCase())) {
        biblicalNames.add(cleanWord);
      }
    });

    return biblicalNames;
  }

  /**
   * Get pronunciation format preference
   */
  getBestPronunciationText(pronunciation: PronunciationData, style: 'phonetic' | 'ipa'): string | null {
    if (style === 'ipa' && pronunciation.ipa) {
      return pronunciation.ipa;
    }
    
    if (style === 'phonetic' && pronunciation.phonetic) {
      return pronunciation.phonetic;
    }

    // Fallback order: phonetic -> ipa -> phoneme
    return pronunciation.phonetic || pronunciation.ipa || pronunciation.phoneme || null;
  }

  /**
   * Check if name has pronunciation data
   */
  hasPronunciation(name: string): boolean {
    return this.pronunciationCache.has(name.toLowerCase());
  }

  /**
   * Get pronunciation confidence score (based on available data quality)
   */
  getPronunciationConfidence(name: string): number {
    const pronunciation = this.pronunciationCache.get(name.toLowerCase());
    if (!pronunciation) return 0;

    let confidence = 0;
    
    if (pronunciation.phonetic) confidence += 0.4;
    if (pronunciation.ipa) confidence += 0.4;
    if (pronunciation.phoneme) confidence += 0.2;
    
    return confidence;
  }
}

// Export singleton instance
export const pronunciationService = new PronunciationService();
export default pronunciationService;