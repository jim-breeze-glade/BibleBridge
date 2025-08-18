/**
 * Pronunciation service for biblical names
 */

import fs from 'fs/promises';
import path from 'path';
import { PronunciationDatabase, PronunciationData } from '../types';
import { config } from '../utils/config';
import { cache, cacheKeys } from '../utils/cache';
import { logger, logPerformance } from '../utils/logger';
import { NotFoundError, ServiceUnavailableError } from '../utils/errors';

export class PronunciationService {
  private pronunciationData: PronunciationDatabase | null = null;
  private dataLoadPromise: Promise<void> | null = null;

  constructor() {
    // Start loading pronunciation data immediately
    this.loadPronunciationData();
  }

  /**
   * Load pronunciation data from JSON file
   */
  private async loadPronunciationData(): Promise<void> {
    if (this.dataLoadPromise) {
      return this.dataLoadPromise;
    }

    this.dataLoadPromise = this.doLoadPronunciationData();
    return this.dataLoadPromise;
  }

  private async doLoadPronunciationData(): Promise<void> {
    const start = Date.now();
    const cacheKey = 'pronunciations:all';

    try {
      this.pronunciationData = await cache.getOrSet(cacheKey, async () => {
        const filePath = path.join(config.paths.pronunciations, 'biblical_names.json');
        
        try {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(fileContent) as PronunciationDatabase;
          
          logger.info(`Loaded ${Object.keys(data.names || {}).length} biblical name pronunciations`);
          return data;
        } catch (error: any) {
          if (error.code === 'ENOENT') {
            logger.warn('Pronunciation data file not found, creating empty dataset');
            return { names: {} };
          }
          throw new ServiceUnavailableError(`Error loading pronunciation data: ${error.message}`);
        }
      }, 3600); // Cache for 1 hour

      logPerformance('loadPronunciationData', Date.now() - start);
    } catch (error) {
      logger.error('Failed to load pronunciation data', { error });
      this.pronunciationData = { names: {} };
    }
  }

  /**
   * Get pronunciation data for all biblical names
   */
  async getAllPronunciations(): Promise<PronunciationDatabase> {
    await this.loadPronunciationData();
    return this.pronunciationData || { names: {} };
  }

  /**
   * Get pronunciation data for a specific biblical name
   */
  async getPronunciation(name: string): Promise<PronunciationData | null> {
    const start = Date.now();
    const normalizedName = this.normalizeName(name);
    const cacheKey = cacheKeys.pronunciation(normalizedName);

    return cache.getOrSet(cacheKey, async () => {
      await this.loadPronunciationData();
      
      const pronunciationData = this.pronunciationData?.names || {};
      
      // Try exact match first
      let result = pronunciationData[name];
      
      if (!result) {
        // Try normalized name
        result = pronunciationData[normalizedName];
      }
      
      if (!result) {
        // Try case-insensitive search
        const foundKey = Object.keys(pronunciationData).find(
          key => key.toLowerCase() === normalizedName.toLowerCase()
        );
        
        if (foundKey) {
          result = pronunciationData[foundKey];
        }
      }

      logPerformance(`getPronunciation:${normalizedName}`, Date.now() - start);
      return result || null;
    }, 3600); // Cache for 1 hour
  }

  /**
   * Search for biblical names by partial match
   */
  async searchNames(query: string, limit: number = 20): Promise<Array<{ name: string; data: PronunciationData }>> {
    const start = Date.now();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery.length < 2) {
      return [];
    }

    const cacheKey = `pronunciations:search:${normalizedQuery}:${limit}`;

    return cache.getOrSet(cacheKey, async () => {
      await this.loadPronunciationData();
      
      const pronunciationData = this.pronunciationData?.names || {};
      const results: Array<{ name: string; data: PronunciationData }> = [];
      
      for (const [name, data] of Object.entries(pronunciationData)) {
        const normalizedName = name.toLowerCase();
        
        if (normalizedName.includes(normalizedQuery) || normalizedName.startsWith(normalizedQuery)) {
          results.push({ name, data });
          
          if (results.length >= limit) {
            break;
          }
        }
      }
      
      // Sort by relevance (exact match first, then starts-with, then contains)
      results.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Exact match
        if (aName === normalizedQuery && bName !== normalizedQuery) return -1;
        if (bName === normalizedQuery && aName !== normalizedQuery) return 1;
        
        // Starts with
        if (aName.startsWith(normalizedQuery) && !bName.startsWith(normalizedQuery)) return -1;
        if (bName.startsWith(normalizedQuery) && !aName.startsWith(normalizedQuery)) return 1;
        
        // Alphabetical
        return aName.localeCompare(bName);
      });

      logPerformance(`searchNames:${normalizedQuery}`, Date.now() - start);
      return results;
    }, 300); // Cache search results for 5 minutes
  }

  /**
   * Get names by first letter (for alphabetical browsing)
   */
  async getNamesByLetter(letter: string): Promise<Array<{ name: string; data: PronunciationData }>> {
    const start = Date.now();
    const normalizedLetter = letter.toUpperCase().charAt(0);
    
    if (!/[A-Z]/.test(normalizedLetter)) {
      return [];
    }

    const cacheKey = `pronunciations:letter:${normalizedLetter}`;

    return cache.getOrSet(cacheKey, async () => {
      await this.loadPronunciationData();
      
      const pronunciationData = this.pronunciationData?.names || {};
      const results: Array<{ name: string; data: PronunciationData }> = [];
      
      for (const [name, data] of Object.entries(pronunciationData)) {
        if (name.charAt(0).toUpperCase() === normalizedLetter) {
          results.push({ name, data });
        }
      }
      
      // Sort alphabetically
      results.sort((a, b) => a.name.localeCompare(b.name));

      logPerformance(`getNamesByLetter:${normalizedLetter}`, Date.now() - start);
      return results;
    }, 3600); // Cache for 1 hour
  }

  /**
   * Get pronunciation statistics
   */
  async getStatistics(): Promise<{
    totalNames: number;
    withPhonetic: number;
    withIPA: number;
    withPhoneme: number;
    sources: Record<string, number>;
  }> {
    const cacheKey = 'pronunciations:stats';

    return cache.getOrSet(cacheKey, async () => {
      await this.loadPronunciationData();
      
      const pronunciationData = this.pronunciationData?.names || {};
      const stats = {
        totalNames: 0,
        withPhonetic: 0,
        withIPA: 0,
        withPhoneme: 0,
        sources: {} as Record<string, number>,
      };
      
      for (const [name, data] of Object.entries(pronunciationData)) {
        stats.totalNames++;
        
        if (data.phonetic) stats.withPhonetic++;
        if (data.ipa) stats.withIPA++;
        if (data.phoneme) stats.withPhoneme++;
        
        if (data.source) {
          stats.sources[data.source] = (stats.sources[data.source] || 0) + 1;
        }
      }
      
      return stats;
    }, 3600); // Cache for 1 hour
  }

  /**
   * Check if a name has pronunciation data available
   */
  async hasPronunciation(name: string): Promise<boolean> {
    const pronunciation = await this.getPronunciation(name);
    return pronunciation !== null;
  }

  /**
   * Get pronunciation in a specific format (phonetic, ipa, phoneme)
   */
  async getPronunciationFormat(name: string, format: 'phonetic' | 'ipa' | 'phoneme'): Promise<string | null> {
    const pronunciation = await this.getPronunciation(name);
    
    if (!pronunciation) {
      return null;
    }
    
    return pronunciation[format] || null;
  }

  /**
   * Detect biblical names in text and return their positions
   */
  async detectBiblicalNames(text: string): Promise<Array<{
    name: string;
    start: number;
    end: number;
    pronunciation: PronunciationData;
  }>> {
    const start = Date.now();
    
    await this.loadPronunciationData();
    const pronunciationData = this.pronunciationData?.names || {};
    const results: Array<{
      name: string;
      start: number;
      end: number;
      pronunciation: PronunciationData;
    }> = [];
    
    // Sort names by length (longest first) to avoid partial matches
    const names = Object.keys(pronunciationData).sort((a, b) => b.length - a.length);
    
    for (const name of names) {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        // Check if this position is already covered by a longer name
        const isOverlapping = results.some(existing => 
          (match.index >= existing.start && match.index < existing.end) ||
          (match.index + name.length > existing.start && match.index + name.length <= existing.end)
        );
        
        if (!isOverlapping) {
          results.push({
            name: match[0], // Use the actual matched text (preserves case)
            start: match.index,
            end: match.index + name.length,
            pronunciation: pronunciationData[name],
          });
        }
      }
    }
    
    // Sort by position in text
    results.sort((a, b) => a.start - b.start);
    
    logPerformance('detectBiblicalNames', Date.now() - start);
    return results;
  }

  /**
   * Normalize name for comparison
   */
  private normalizeName(name: string): string {
    return name.trim()
      .replace(/['']/g, "'") // Normalize apostrophes
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Refresh pronunciation data from file
   */
  async refreshData(): Promise<void> {
    logger.info('Refreshing pronunciation data');
    
    // Clear cache
    cache.del('pronunciations:all');
    
    // Reset loaded data
    this.pronunciationData = null;
    this.dataLoadPromise = null;
    
    // Reload data
    await this.loadPronunciationData();
    
    logger.info('Pronunciation data refreshed');
  }
}

// Export singleton instance
export const pronunciationService = new PronunciationService();