/**
 * Text-to-Speech service for biblical name pronunciations
 */

import axios, { AxiosResponse } from 'axios';
import { TTSRequest, TTSResponse, PronunciationData } from '../types';
import { config } from '../utils/config';
import { cache } from '../utils/cache';
import { logger, logPerformance, logApiCall } from '../utils/logger';
import { ServiceUnavailableError, ValidationError } from '../utils/errors';

export class TTSService {
  private baseUrl: string;
  private timeout: number;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isServiceAvailable: boolean = false;

  constructor() {
    this.baseUrl = config.tts.serviceUrl;
    this.timeout = config.tts.timeout;
    
    // Start health checking
    this.startHealthCheck();
  }

  /**
   * Check if TTS service is available
   */
  async checkHealth(): Promise<{
    available: boolean;
    responseTime?: number;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/pronunciation/health`, {
        timeout: 5000, // 5 second timeout for health checks
      });
      
      const responseTime = Date.now() - start;
      const isHealthy = response.status === 200 && response.data?.status === 'healthy';
      
      this.isServiceAvailable = isHealthy;
      
      return {
        available: isHealthy,
        responseTime,
      };
    } catch (error: any) {
      this.isServiceAvailable = false;
      
      return {
        available: false,
        error: error.message || 'TTS service unreachable',
      };
    }
  }

  /**
   * Start periodic health checking
   */
  private startHealthCheck(): void {
    // Initial health check
    this.checkHealth().then(result => {
      logger.info('TTS Service Health Check', result);
    });

    // Periodic health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const result = await this.checkHealth();
      
      if (!result.available && this.isServiceAvailable) {
        logger.warn('TTS service became unavailable', { error: result.error });
      } else if (result.available && !this.isServiceAvailable) {
        logger.info('TTS service is now available', { responseTime: result.responseTime });
      }
    }, 30000);
  }

  /**
   * Stop health checking (cleanup)
   */
  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Generate TTS audio for a biblical name
   */
  async generateAudio(
    name: string,
    pronunciationData: PronunciationData,
    voiceSettings?: TTSRequest['voice_settings']
  ): Promise<TTSResponse> {
    const start = Date.now();
    
    if (!this.isServiceAvailable) {
      throw new ServiceUnavailableError('TTS service is currently unavailable');
    }

    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Name is required for TTS generation');
    }

    const cacheKey = this.generateCacheKey(name, pronunciationData, voiceSettings);
    
    return cache.getOrSet(cacheKey, async () => {
      const ttsRequest: TTSRequest = {
        name: name.trim(),
        phonetic: pronunciationData.phonetic || undefined,
        ipa: pronunciationData.ipa || undefined,
        phoneme: pronunciationData.phoneme || undefined,
        voice_settings: {
          speed: 0.8, // Slightly slower for pronunciation clarity
          speaker_id: 0,
          ...voiceSettings,
        },
      };

      logApiCall('/api/pronunciation/audio', 'POST', { name, hasPhonetic: !!pronunciationData.phonetic });

      try {
        const response: AxiosResponse<Buffer> = await axios.post(
          `${this.baseUrl}/api/pronunciation/audio`,
          ttsRequest,
          {
            timeout: this.timeout,
            responseType: 'arraybuffer',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'audio/wav',
            },
          }
        );

        if (response.status !== 200) {
          throw new ServiceUnavailableError(`TTS service returned status ${response.status}`);
        }

        const audioBuffer = Buffer.from(response.data);
        
        if (audioBuffer.length === 0) {
          throw new ServiceUnavailableError('TTS service returned empty audio data');
        }

        logPerformance(`generateAudio:${name}`, Date.now() - start, {
          audioSize: audioBuffer.length,
          voiceSettings: ttsRequest.voice_settings,
        });

        return {
          audio: audioBuffer,
          contentType: 'audio/wav',
          filename: `${name.replace(/[^a-zA-Z0-9]/g, '_')}_pronunciation.wav`,
        };
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          this.isServiceAvailable = false;
          throw new ServiceUnavailableError('TTS service is not reachable');
        }
        
        if (error.response?.status === 400) {
          throw new ValidationError(`TTS request validation failed: ${error.response.data?.error || 'Invalid request'}`);
        }
        
        if (error.response?.status >= 500) {
          throw new ServiceUnavailableError(`TTS service error: ${error.response.data?.error || 'Internal server error'}`);
        }
        
        throw new ServiceUnavailableError(`TTS generation failed: ${error.message}`);
      }
    }, 3600); // Cache audio for 1 hour
  }

  /**
   * Generate audio using the best available pronunciation format
   */
  async generateAudioFromBestFormat(
    name: string,
    pronunciationData: PronunciationData,
    preferredFormat: 'phonetic' | 'ipa' | 'phoneme' = 'phonetic',
    voiceSettings?: TTSRequest['voice_settings']
  ): Promise<TTSResponse> {
    // Determine the best format to use
    const formats = ['phonetic', 'ipa', 'phoneme'] as const;
    const preferredIndex = formats.indexOf(preferredFormat);
    
    // Create ordered list starting with preferred format
    const orderedFormats = [
      ...formats.slice(preferredIndex),
      ...formats.slice(0, preferredIndex),
    ];
    
    // Find the first available format
    const availableFormat = orderedFormats.find(format => pronunciationData[format]);
    
    if (!availableFormat) {
      // If no pronunciation data available, try with just the name
      logger.warn(`No pronunciation data available for '${name}', attempting TTS with raw name`);
      return this.generateAudio(name, { phonetic: name }, voiceSettings);
    }
    
    logger.debug(`Using ${availableFormat} format for TTS generation of '${name}'`);
    return this.generateAudio(name, pronunciationData, voiceSettings);
  }

  /**
   * Get cached audio if available
   */
  async getCachedAudio(
    name: string,
    pronunciationData: PronunciationData,
    voiceSettings?: TTSRequest['voice_settings']
  ): Promise<TTSResponse | null> {
    const cacheKey = this.generateCacheKey(name, pronunciationData, voiceSettings);
    return cache.get<TTSResponse>(cacheKey) || null;
  }

  /**
   * Preload audio for common biblical names
   */
  async preloadCommonNames(names: string[], pronunciationDataMap: Map<string, PronunciationData>): Promise<void> {
    logger.info(`Preloading TTS audio for ${names.length} biblical names`);
    
    const promises = names.map(async (name) => {
      const pronunciationData = pronunciationDataMap.get(name);
      if (pronunciationData) {
        try {
          await this.generateAudio(name, pronunciationData);
          logger.debug(`Preloaded audio for ${name}`);
        } catch (error: any) {
          logger.warn(`Failed to preload audio for ${name}`, { error: error.message });
        }
      }
    });

    await Promise.allSettled(promises);
    logger.info('TTS preloading completed');
  }

  /**
   * Get TTS service statistics
   */
  async getServiceStats(): Promise<{
    available: boolean;
    cacheStats: any;
    lastHealthCheck?: Date;
    responseTime?: number;
  }> {
    const healthResult = await this.checkHealth();
    
    return {
      available: healthResult.available,
      cacheStats: cache.getStats(),
      lastHealthCheck: new Date(),
      responseTime: healthResult.responseTime || undefined,
    };
  }

  /**
   * Clear TTS audio cache
   */
  clearCache(): void {
    // Clear only TTS-related cache entries
    const stats = cache.getStats();
    logger.info(`Clearing TTS cache (${stats.keys} entries)`);
    
    // For now, clear entire cache - in production, you might want to be more selective
    cache.clear();
  }

  /**
   * Generate cache key for TTS audio
   */
  private generateCacheKey(
    name: string,
    pronunciationData: PronunciationData,
    voiceSettings?: TTSRequest['voice_settings']
  ): string {
    const settingsHash = voiceSettings 
      ? Buffer.from(JSON.stringify(voiceSettings)).toString('base64')
      : 'default';
    
    const pronunciationHash = Buffer.from(JSON.stringify(pronunciationData)).toString('base64');
    
    return `tts:${name}:${pronunciationHash}:${settingsHash}`;
  }

  /**
   * Test TTS generation with a simple phrase
   */
  async testGeneration(): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const start = Date.now();
    
    try {
      await this.generateAudio('Abraham', { phonetic: 'AY-bruh-ham' });
      
      return {
        success: true,
        responseTime: Date.now() - start,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - start,
      };
    }
  }
}

// Export singleton instance
export const ttsService = new TTSService();