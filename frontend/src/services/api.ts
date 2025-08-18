/**
 * API service layer for communicating with BibleBridge backend
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  API_BASE_URL,
  Translation,
  BookMetadata,
  GetChapterResponse,
  SearchResponse,
  SearchResult,
  PronunciationData,
  UserPosition,
  UserSettings,
  ApiError,
} from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        
        // Transform error to our ApiError interface
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'Unknown error occurred',
          code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
          details: error.response?.data?.details,
          timestamp: new Date().toISOString(),
        };
        
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Get list of available translations
   */
  async getTranslations(): Promise<Translation[]> {
    const response = await this.api.get<{ translations: Translation[] }>('/api/bible/translations');
    return response.data.translations;
  }

  /**
   * Get list of all Bible books with metadata
   */
  async getBooks(): Promise<BookMetadata[]> {
    const response = await this.api.get<{ books: BookMetadata[] }>('/api/bible/books');
    return response.data.books;
  }

  /**
   * Get chapters for a specific book
   */
  async getChapters(book: string): Promise<{ chapters: number[]; chapterCount: number }> {
    const response = await this.api.get<{ book: string; chapters: number[]; chapterCount: number }>(
      `/api/bible/books/${encodeURIComponent(book)}/chapters`
    );
    return {
      chapters: response.data.chapters,
      chapterCount: response.data.chapterCount,
    };
  }

  /**
   * Get specific chapter data with navigation info
   */
  async getChapter(translation: string, book: string, chapter: number): Promise<GetChapterResponse> {
    const response = await this.api.get<GetChapterResponse>(
      `/api/bible/${translation}/${encodeURIComponent(book)}/${chapter}`
    );
    return response.data;
  }

  /**
   * Search Bible text
   */
  async searchBible(
    query: string,
    translation: string,
    options: {
      book?: string;
      testament?: 'Old Testament' | 'New Testament';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SearchResponse> {
    const searchParams: Record<string, string> = {
      q: query,
      translation,
    };

    // Add optional parameters if they exist
    if (options.book) searchParams.book = options.book;
    if (options.testament) searchParams.testament = options.testament;
    if (options.limit) searchParams.limit = options.limit.toString();
    if (options.offset) searchParams.offset = options.offset.toString();

    const params = new URLSearchParams(searchParams);

    const response = await this.api.get<SearchResponse>(`/api/bible/search?${params}`);
    return response.data;
  }

  /**
   * Get pronunciation data for biblical names
   */
  async getPronunciations(): Promise<Record<string, PronunciationData>> {
    const response = await this.api.get<{ names: Record<string, PronunciationData> }>('/api/pronunciation');
    return response.data.names;
  }

  /**
   * Get pronunciation for a specific name
   */
  async getPronunciation(name: string): Promise<PronunciationData | null> {
    try {
      const response = await this.api.get<PronunciationData>(`/api/pronunciation/${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      // Return null if pronunciation not found
      if ((error as ApiError).code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Play TTS for biblical name or text
   */
  async playTTS(
    text: string,
    options: {
      name?: string;
      phonetic?: string;
      ipa?: string;
      phoneme?: string;
      voice_settings?: {
        speed?: number;
        speaker_id?: number;
      };
    } = {}
  ): Promise<Blob> {
    const response = await this.api.post<Blob>(
      '/api/tts/generate',
      {
        name: options.name || text,
        phonetic: options.phonetic,
        ipa: options.ipa,
        phoneme: options.phoneme,
        voice_settings: options.voice_settings,
      },
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    return response.data;
  }

  /**
   * Get TTS audio for a specific biblical name
   */
  async getTTSAudio(
    name: string,
    options: {
      format?: 'phonetic' | 'ipa' | 'phoneme';
      speed?: number;
      speaker_id?: number;
    } = {}
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (options.format) params.append('format', options.format);
    if (options.speed) params.append('speed', options.speed.toString());
    if (options.speaker_id) params.append('speaker_id', options.speaker_id.toString());

    const response = await this.api.get<Blob>(
      `/api/tts/audio/${encodeURIComponent(name)}?${params}`,
      {
        responseType: 'blob',
      }
    );
    
    return response.data;
  }

  /**
   * Check if TTS audio is cached for a name
   */
  async checkTTSCache(name: string, format: 'phonetic' | 'ipa' | 'phoneme' = 'phonetic'): Promise<boolean> {
    try {
      const response = await this.api.head(`/api/tts/audio/${encodeURIComponent(name)}?format=${format}`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Preload TTS audio for multiple names
   */
  async preloadTTSNames(names: string[]): Promise<{
    successful: number;
    errors: number;
    results: Array<{ name: string; cached: boolean; available: boolean; error?: string; }>;
  }> {
    const response = await this.api.post<{
      success: boolean;
      data: {
        results: Array<{ name: string; cached: boolean; available: boolean; error?: string; }>;
        errors: Array<{ name: string; error: string; }>;
        summary: {
          total: number;
          successful: number;
          cached: number;
          errors: number;
        };
      };
    }>('/api/tts/batch', { names });
    
    return {
      successful: response.data.data.summary.successful,
      errors: response.data.data.summary.errors,
      results: response.data.data.results,
    };
  }

  /**
   * Get TTS service health and statistics
   */
  async getTTSHealth(): Promise<{
    available: boolean;
    statistics: any;
    health: any;
  }> {
    const response = await this.api.get<{
      success: boolean;
      data: {
        health: any;
        statistics: any;
      };
    }>('/api/tts/health');
    
    return {
      available: response.data.data.health.available,
      statistics: response.data.data.statistics,
      health: response.data.data.health,
    };
  }

  /**
   * Clear TTS audio cache
   */
  async clearTTSCache(): Promise<void> {
    await this.api.delete('/api/tts/cache');
  }

  /**
   * Get TTS options and configuration
   */
  async getTTSOptions(): Promise<{
    voiceSettings: any;
    formats: any;
    audioFormat: any;
    limits: any;
  }> {
    const response = await this.api.get<{
      success: boolean;
      data: {
        voiceSettings: any;
        formats: any;
        audioFormat: any;
        limits: any;
      };
    }>('/api/tts/options');
    
    return response.data.data;
  }

  /**
   * Get user's last position
   */
  async getUserPosition(userId?: string): Promise<UserPosition | null> {
    try {
      const endpoint = userId ? `/api/users/${userId}/position` : '/api/users/position';
      const response = await this.api.get<UserPosition>(endpoint);
      return response.data;
    } catch (error) {
      if ((error as ApiError).code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Save user's current position
   */
  async saveUserPosition(position: Omit<UserPosition, 'timestamp'>, userId?: string): Promise<void> {
    const endpoint = userId ? `/api/users/${userId}/position` : '/api/users/position';
    await this.api.post(endpoint, {
      ...position,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get user settings
   */
  async getUserSettings(userId?: string): Promise<UserSettings | null> {
    try {
      const endpoint = userId ? `/api/users/${userId}/settings` : '/api/users/settings';
      const response = await this.api.get<UserSettings>(endpoint);
      return response.data;
    } catch (error) {
      if ((error as ApiError).code === 'NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Save user settings
   */
  async saveUserSettings(settings: UserSettings, userId?: string): Promise<void> {
    const endpoint = userId ? `/api/users/${userId}/settings` : '/api/users/settings';
    await this.api.post(endpoint, settings);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    const response = await this.api.get<{ status: string; timestamp: string; uptime: number }>('/api/health');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;