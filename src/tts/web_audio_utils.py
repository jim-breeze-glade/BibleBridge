#!/usr/bin/env python3
"""
Web Audio API utilities for biblical name pronunciation playback
"""

def create_web_audio_js() -> str:
    """
    Create JavaScript code for Web Audio API pronunciation playback
    This handles audio buffering, caching, and playback using modern Web Audio API
    
    Returns:
        JavaScript code as string
    """
    return """
    // Biblical Name Pronunciation Web Audio Manager
    class BiblicalAudioManager {
        constructor() {
            this.audioContext = null;
            this.audioCache = new Map(); // LRU cache for audio buffers
            this.maxCacheSize = 50;
            this.isInitialized = false;
            this.apiEndpoint = 'http://localhost:5001/api/pronunciation/audio'; // Your Piper TTS endpoint
        }
        
        async initialize() {
            if (this.isInitialized) return;
            
            try {
                // Initialize Web Audio Context
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.isInitialized = true;
                console.log('Biblical Audio Manager initialized');
            } catch (error) {
                console.error('Failed to initialize Web Audio:', error);
            }
        }
        
        async playPronunciation(name, phonetic, ipa, phoneme) {
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            if (!this.audioContext) {
                console.error('Web Audio not supported');
                return;
            }
            
            // Resume context if suspended (required for user interaction)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            const cacheKey = `${name}_${phoneme}`;
            
            try {
                // Check cache first
                let audioBuffer = this.audioCache.get(cacheKey);
                
                if (!audioBuffer) {
                    // Generate audio via Piper TTS
                    audioBuffer = await this.generateAudio(name, phonetic, ipa, phoneme);
                    
                    if (audioBuffer) {
                        // Add to cache with LRU management
                        this.cacheAudioBuffer(cacheKey, audioBuffer);
                    }
                }
                
                if (audioBuffer) {
                    await this.playAudioBuffer(audioBuffer);
                }
                
            } catch (error) {
                console.error(`Error playing pronunciation for ${name}:`, error);
            }
        }
        
        async generateAudio(name, phonetic, ipa, phoneme) {
            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: name,
                        phonetic: phonetic,
                        ipa: ipa,
                        phoneme: phoneme,
                        voice_settings: {
                            speed: 0.8,
                            speaker_id: 0
                        }
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                
                return audioBuffer;
            } catch (error) {
                console.error('Error generating audio:', error);
                return null;
            }
        }
        
        cacheAudioBuffer(key, buffer) {
            // LRU cache management
            if (this.audioCache.has(key)) {
                // Move to end
                this.audioCache.delete(key);
            } else if (this.audioCache.size >= this.maxCacheSize) {
                // Remove oldest entry
                const firstKey = this.audioCache.keys().next().value;
                this.audioCache.delete(firstKey);
            }
            
            this.audioCache.set(key, buffer);
        }
        
        async playAudioBuffer(audioBuffer) {
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);
            source.start();
            
            return new Promise((resolve) => {
                source.onended = resolve;
            });
        }
        
        getCacheStats() {
            return {
                size: this.audioCache.size,
                maxSize: this.maxCacheSize,
                keys: Array.from(this.audioCache.keys())
            };
        }
        
        clearCache() {
            this.audioCache.clear();
        }
    }
    
    // Global instance
    window.biblicalAudioManager = new BiblicalAudioManager();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.biblicalAudioManager.initialize();
        });
    } else {
        window.biblicalAudioManager.initialize();
    }
    
    // Click handler for biblical names
    document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('biblical-name')) {
            event.preventDefault();
            
            const name = event.target.dataset.name;
            const phonetic = event.target.dataset.phonetic;
            const ipa = event.target.dataset.ipa;
            const phoneme = event.target.dataset.phoneme || phonetic; // fallback
            
            if (name && window.biblicalAudioManager) {
                // Visual feedback
                event.target.style.opacity = '0.7';
                
                try {
                    await window.biblicalAudioManager.playPronunciation(name, phonetic, ipa, phoneme);
                } finally {
                    // Restore visual state
                    setTimeout(() => {
                        event.target.style.opacity = '1';
                    }, 200);
                }
            }
        }
    });
    """

def create_pronunciation_css() -> str:
    """
    Create CSS styles for biblical name pronunciation display
    
    Returns:
        CSS styles as string
    """
    return """
    .biblical-name {
        cursor: pointer;
        text-decoration: underline;
        text-decoration-style: dotted;
        color: var(--primary-color, #1f77b4);
        transition: all 0.2s ease;
        position: relative;
    }
    
    .biblical-name:hover {
        background-color: var(--secondary-color, rgba(31, 119, 180, 0.1));
        text-decoration-style: solid;
        border-radius: 2px;
        padding: 1px 2px;
        margin: -1px -2px;
    }
    
    .biblical-name:active {
        opacity: 0.7;
        transform: scale(0.98);
    }
    
    /* Tooltip styling */
    .biblical-name::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--tooltip-bg, rgba(0, 0, 0, 0.9));
        color: var(--tooltip-text, white);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        font-family: monospace;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 1000;
    }
    
    .biblical-name:hover::after {
        opacity: 1;
    }
    
    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
        .biblical-name {
            color: var(--primary-color-dark, #58a6ff);
        }
        
        .biblical-name:hover {
            background-color: var(--secondary-color-dark, rgba(88, 166, 255, 0.15));
        }
    }
    """