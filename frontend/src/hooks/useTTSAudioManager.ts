/**
 * TTS Audio Manager Hook
 * Manages Web Audio API for biblical name pronunciation playback with LRU caching
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AudioManagerInterface,
  AudioPlaybackState,
  AudioCacheEntry,
  TTSServiceStats,
  TTS_CONFIG,
} from '../types';

interface LRUCacheNode {
  key: string;
  value: AudioCacheEntry;
  prev: LRUCacheNode | null;
  next: LRUCacheNode | null;
}

class LRUCache {
  private capacity: number;
  private cache: Map<string, LRUCacheNode>;
  private head: LRUCacheNode;
  private tail: LRUCacheNode;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    
    // Create dummy head and tail nodes
    this.head = { key: '', value: {} as AudioCacheEntry, prev: null, next: null };
    this.tail = { key: '', value: {} as AudioCacheEntry, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  private addToHead(node: LRUCacheNode): void {
    node.prev = this.head;
    node.next = this.head.next;
    if (this.head.next) {
      this.head.next.prev = node;
    }
    this.head.next = node;
  }

  private removeNode(node: LRUCacheNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
  }

  private moveToHead(node: LRUCacheNode): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private popTail(): LRUCacheNode | null {
    const last = this.tail.prev;
    if (last && last !== this.head) {
      this.removeNode(last);
      return last;
    }
    return null;
  }

  get(key: string): AudioCacheEntry | null {
    const node = this.cache.get(key);
    if (node) {
      // Update last used time
      node.value.lastUsed = Date.now();
      // Move to head (most recently used)
      this.moveToHead(node);
      return node.value;
    }
    return null;
  }

  put(key: string, value: AudioCacheEntry): void {
    const existingNode = this.cache.get(key);
    
    if (existingNode) {
      // Update existing entry
      existingNode.value = value;
      this.moveToHead(existingNode);
    } else {
      const newNode: LRUCacheNode = {
        key,
        value,
        prev: null,
        next: null,
      };

      if (this.cache.size >= this.capacity) {
        // Remove LRU item
        const tail = this.popTail();
        if (tail) {
          this.cache.delete(tail.key);
        }
      }

      this.cache.set(key, newNode);
      this.addToHead(newNode);
    }
  }

  clear(): void {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  size(): number {
    return this.cache.size;
  }

  totalSize(): number {
    let total = 0;
    this.cache.forEach(node => {
      total += node.value.size;
    });
    return total;
  }

  cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    this.cache.forEach((node, key) => {
      if (now - node.value.createdAt > TTS_CONFIG.CACHE_MAX_AGE) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => {
      const node = this.cache.get(key);
      if (node) {
        this.removeNode(node);
        this.cache.delete(key);
      }
    });
  }
}

export class TTSAudioManager implements AudioManagerInterface {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private cache: LRUCache;
  private playbackState: AudioPlaybackState;
  private stateChangeCallbacks: ((state: AudioPlaybackState) => void)[] = [];
  private stats: TTSServiceStats;

  constructor() {
    this.cache = new LRUCache(TTS_CONFIG.CACHE_MAX_SIZE);
    this.playbackState = {
      isPlaying: false,
      volume: TTS_CONFIG.DEFAULT_VOLUME,
      muted: false,
    };
    this.stats = {
      cacheSize: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      errors: 0,
      averageResponseTime: 0,
    };

    // Initialize Web Audio API
    this.initializeAudioContext();
    
    // Cleanup old cache entries every 5 minutes
    setInterval(() => {
      this.cache.cleanup();
    }, 300000);
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      // Create AudioContext with optimal settings for speech
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: TTS_CONFIG.AUDIO_FORMAT.sampleRate,
      });

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.playbackState.volume;
      this.gainNode.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error);
      this.stats.errors++;
    }
  }

  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback({ ...this.playbackState });
      } catch (error) {
        console.error('Error in playback state callback:', error);
      }
    });
  }

  async playAudio(name: string, audioData: ArrayBuffer): Promise<void> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Stop any current playback
      this.stopAudio();

      // Ensure audio context is running
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      if (!this.audioContext) {
        throw new Error('Failed to initialize audio context');
      }

      // Resume audio context if suspended (required for mobile browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Check cache first
      let audioBuffer = this.getCachedAudio(name);
      
      if (!audioBuffer) {
        this.stats.cacheMisses++;
        // Decode audio data
        audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));
        
        // Cache the decoded buffer
        this.cacheAudio(name, audioBuffer);
      } else {
        this.stats.cacheHits++;
      }

      // Create and configure audio source
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      
      if (this.gainNode) {
        this.currentSource.connect(this.gainNode);
      }

      // Update playback state
      this.playbackState = {
        ...this.playbackState,
        isPlaying: true,
        currentName: name,
        duration: audioBuffer.duration,
        currentTime: 0,
      };

      // Set up playback end handler
      this.currentSource.onended = () => {
        this.playbackState = {
          ...this.playbackState,
          isPlaying: false,
          currentName: undefined,
          currentTime: 0,
        };
        this.currentSource = null;
        this.notifyStateChange();
      };

      // Start playback
      this.currentSource.start(0);
      this.notifyStateChange();

      // Update stats
      this.stats.averageResponseTime = (
        (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + 
         (Date.now() - startTime)) / this.stats.totalRequests
      );

    } catch (error) {
      this.stats.errors++;
      console.error('Error playing TTS audio:', error);
      
      this.playbackState = {
        ...this.playbackState,
        isPlaying: false,
        currentName: undefined,
      };
      this.notifyStateChange();
      
      throw new Error(`Failed to play pronunciation for "${name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  stopAudio(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (error) {
        // Ignore errors from stopping already stopped sources
      }
      this.currentSource = null;
    }

    this.playbackState = {
      ...this.playbackState,
      isPlaying: false,
      currentName: undefined,
      currentTime: 0,
    };
    this.notifyStateChange();
  }

  pauseAudio(): void {
    // Web Audio API doesn't support pause/resume directly
    // We implement this by stopping and remembering position
    if (this.currentSource && this.playbackState.isPlaying) {
      this.stopAudio();
      // Note: Full pause/resume would require more complex implementation
      // with tracking current time and resuming from that position
    }
  }

  resumeAudio(): void {
    // In a full implementation, this would resume from paused position
    // For now, we just indicate the audio is not playing
    console.warn('Resume not fully implemented - use playAudio to restart');
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.playbackState.volume = clampedVolume;
    
    if (this.gainNode) {
      this.gainNode.gain.value = this.playbackState.muted ? 0 : clampedVolume;
    }
    
    this.notifyStateChange();
  }

  getVolume(): number {
    return this.playbackState.volume;
  }

  mute(): void {
    this.playbackState.muted = true;
    if (this.gainNode) {
      this.gainNode.gain.value = 0;
    }
    this.notifyStateChange();
  }

  unmute(): void {
    this.playbackState.muted = false;
    if (this.gainNode) {
      this.gainNode.gain.value = this.playbackState.volume;
    }
    this.notifyStateChange();
  }

  isMuted(): boolean {
    return this.playbackState.muted;
  }

  isPlaying(): boolean {
    return this.playbackState.isPlaying;
  }

  getCurrentPlayback(): AudioPlaybackState {
    return { ...this.playbackState };
  }

  getCachedAudio(name: string): AudioBuffer | null {
    const entry = this.cache.get(name);
    return entry ? entry.buffer : null;
  }

  cacheAudio(name: string, buffer: AudioBuffer): void {
    const entry: AudioCacheEntry = {
      buffer,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      size: buffer.length * buffer.numberOfChannels * 4, // Rough size estimate
    };

    this.cache.put(name, entry);
    this.stats.cacheSize = this.cache.size();
  }

  clearCache(): void {
    this.cache.clear();
    this.stats.cacheSize = 0;
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
  }

  getCacheSize(): number {
    return this.cache.totalSize();
  }

  onPlaybackStateChange(callback: (state: AudioPlaybackState) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  getStats(): TTSServiceStats {
    return { ...this.stats, cacheSize: this.cache.size() };
  }

  destroy(): void {
    this.stopAudio();
    this.clearCache();
    this.stateChangeCallbacks = [];
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// React Hook
export const useTTSAudioManager = () => {
  const managerRef = useRef<TTSAudioManager | null>(null);
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>({
    isPlaying: false,
    volume: TTS_CONFIG.DEFAULT_VOLUME,
    muted: false,
  });
  const [stats, setStats] = useState<TTSServiceStats>({
    cacheSize: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    errors: 0,
    averageResponseTime: 0,
  });

  // Initialize audio manager
  useEffect(() => {
    managerRef.current = new TTSAudioManager();
    
    // Subscribe to state changes
    managerRef.current.onPlaybackStateChange((newState) => {
      setPlaybackState(newState);
    });

    // Update stats periodically
    const statsInterval = setInterval(() => {
      if (managerRef.current) {
        setStats(managerRef.current.getStats());
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(statsInterval);
      if (managerRef.current) {
        managerRef.current.destroy();
      }
    };
  }, []);

  const playAudio = useCallback(async (name: string, audioData: ArrayBuffer) => {
    if (managerRef.current) {
      await managerRef.current.playAudio(name, audioData);
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stopAudio();
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (managerRef.current) {
      managerRef.current.setVolume(volume);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (managerRef.current) {
      if (managerRef.current.isMuted()) {
        managerRef.current.unmute();
      } else {
        managerRef.current.mute();
      }
    }
  }, []);

  const clearCache = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clearCache();
    }
  }, []);

  return {
    playAudio,
    stopAudio,
    setVolume,
    toggleMute,
    clearCache,
    playbackState,
    stats,
    isPlaying: playbackState.isPlaying,
    currentName: playbackState.currentName,
    volume: playbackState.volume,
    muted: playbackState.muted,
  };
};

export default useTTSAudioManager;