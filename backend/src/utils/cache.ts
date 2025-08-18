/**
 * Caching utility for BibleBridge Backend
 */

import NodeCache from 'node-cache';
import { config } from './config';
import { logger } from './logger';
import { CacheStats } from '../types';

/**
 * Cache instance for Bible data
 */
class CacheManager {
  private cache: NodeCache;
  private stats: {
    hits: number;
    misses: number;
  };

  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Don't clone objects for better performance
      maxKeys: 10000, // Maximum number of keys
    });

    this.stats = {
      hits: 0,
      misses: 0,
    };

    // Log cache events
    this.cache.on('set', (key, _value) => {
      logger.debug(`Cache SET: ${key}`);
    });

    this.cache.on('del', (key, _value) => {
      logger.debug(`Cache DEL: ${key}`);
    });

    this.cache.on('expired', (key, _value) => {
      logger.debug(`Cache EXPIRED: ${key}`);
    });
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    
    if (value !== undefined) {
      this.stats.hits++;
      logger.debug(`Cache HIT: ${key}`);
      return value;
    } else {
      this.stats.misses++;
      logger.debug(`Cache MISS: ${key}`);
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    const success = this.cache.set(key, value, ttl || config.cache.ttl);
    if (success) {
      logger.debug(`Cache SET: ${key} (TTL: ${ttl || config.cache.ttl}s)`);
    }
    return success;
  }

  /**
   * Delete value from cache
   */
  del(key: string): boolean {
    const success = this.cache.del(key) > 0;
    if (success) {
      logger.debug(`Cache DEL: ${key}`);
    }
    return success;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get or set pattern - retrieve from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    computeFn: () => Promise<T> | T,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      return cached;
    }

    const computed = await computeFn();
    this.set(key, computed, ttl);
    return computed;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.flushAll();
    this.stats.hits = 0;
    this.stats.misses = 0;
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const keys = this.cache.keys();
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      keys: keys.length,
      size: this.getApproximateSize(),
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Get approximate cache size in bytes
   */
  private getApproximateSize(): number {
    const keys = this.cache.keys();
    let totalSize = 0;

    for (const key of keys) {
      const value = this.cache.get(key);
      if (value) {
        // Rough estimation of object size
        totalSize += JSON.stringify(value).length * 2; // UTF-16 characters
      }
    }

    return totalSize;
  }

  /**
   * Generate cache key for Bible data
   */
  static generateBibleKey(translation: string, book: string, chapter?: number): string {
    return chapter 
      ? `bible:${translation}:${book}:${chapter}`
      : `bible:${translation}:${book}`;
  }

  /**
   * Generate cache key for search results
   */
  static generateSearchKey(query: string, translation: string, options?: Record<string, any>): string {
    const optionsHash = options ? JSON.stringify(options) : '';
    return `search:${translation}:${Buffer.from(query + optionsHash).toString('base64')}`;
  }

  /**
   * Generate cache key for pronunciation data
   */
  static generatePronunciationKey(name: string): string {
    return `pronunciation:${name.toLowerCase()}`;
  }

  /**
   * Generate cache key for user data
   */
  static generateUserKey(userId: string, dataType: string): string {
    return `user:${userId}:${dataType}`;
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Export utility functions
export const cacheKeys = {
  bible: CacheManager.generateBibleKey,
  search: CacheManager.generateSearchKey,
  pronunciation: CacheManager.generatePronunciationKey,
  user: CacheManager.generateUserKey,
};