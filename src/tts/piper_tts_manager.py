#!/usr/bin/env python3

import io
import json
import os
import hashlib
import tempfile
import wave
import struct
import numpy as np
from typing import Dict, Optional, Any
from collections import OrderedDict

try:
    import piper
    PIPER_AVAILABLE = True
except ImportError:
    PIPER_AVAILABLE = False

try:
    import streamlit as st
    STREAMLIT_AVAILABLE = True
except ImportError:
    STREAMLIT_AVAILABLE = False
    class MockSt:
        class session_state:
            pass
    st = MockSt()

class LRUCache:
    """Simple LRU cache implementation for audio clips"""
    
    def __init__(self, max_size: int = 100):
        self.max_size = max_size
        self.cache: OrderedDict[str, bytes] = OrderedDict()
    
    def get(self, key: str) -> Optional[bytes]:
        if key in self.cache:
            # Move to end (most recently used)
            self.cache.move_to_end(key)
            return self.cache[key]
        return None
    
    def put(self, key: str, value: bytes) -> None:
        if key in self.cache:
            # Update existing
            self.cache[key] = value
            self.cache.move_to_end(key)
        else:
            # Add new
            self.cache[key] = value
            if len(self.cache) > self.max_size:
                # Remove least recently used
                self.cache.popitem(last=False)
    
    def clear(self) -> None:
        self.cache.clear()
    
    def size(self) -> int:
        return len(self.cache)

class PiperTTSManager:
    """
    Advanced TTS manager using Piper TTS with LRU caching and phoneme preprocessing
    """
    
    def __init__(self, model_path: Optional[str] = None, cache_size: int = 100):
        self.piper_available = PIPER_AVAILABLE
        self.voice = None
        # Set default model path to the Lessac high-quality model
        self.model_path = model_path or os.path.join(
            os.path.dirname(__file__), 
            '..', '..', 'data',
            'pronunciations', 
            'voice_models', 
            'lessac_high', 
            'en_US-lessac-high.onnx'
        )
        self.cache = LRUCache(cache_size)
        self.phoneme_cache: Dict[str, str] = {}
        
        if self.piper_available:
            self._initialize_piper()
    
    def _initialize_piper(self) -> None:
        """Initialize Piper TTS with Lessac high-quality voice"""
        try:
            if self.model_path and os.path.exists(self.model_path):
                print(f"Loading Piper voice model: {self.model_path}")
                self.voice = piper.PiperVoice.load(self.model_path)
                print("Piper TTS initialized successfully with Lessac high-quality voice")
            else:
                print(f"Voice model not found at: {self.model_path}")
                print("Please ensure the voice model files are in the correct location")
                self.piper_available = False
        except Exception as e:
            print(f"Failed to initialize Piper TTS: {e}")
            self.piper_available = False
    
    def _download_default_model(self) -> Optional[str]:
        """Download a default English model if none specified"""
        # This would typically download from Piper's model repository
        # For now, return None and let user specify model path
        print("No model path specified. Please download a Piper model and set model_path")
        return None
    
    def _generate_cache_key(self, text: str, voice_settings: Dict[str, Any]) -> str:
        """Generate cache key for audio clip"""
        key_data = f"{text}_{json.dumps(voice_settings, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def preprocess_phonemes(self, name: str, phonetic: str, ipa: str) -> str:
        """
        Convert phonetic/IPA pronunciation to Piper-friendly text
        This can be enhanced based on your specific pronunciation guide format
        """
        cache_key = f"{name}_{phonetic}_{ipa}"
        
        if cache_key in self.phoneme_cache:
            return self.phoneme_cache[cache_key]
        
        # Start with phonetic pronunciation
        processed_text = phonetic.lower()
        
        # Convert common phonetic patterns to more natural speech
        replacements = {
            'ay': 'ay',      # Keep long A sound
            'ee': 'ee',      # Keep long E sound  
            'y': 'ee',       # Convert Y to long E at end of syllables
            'uh': 'uh',      # Keep schwa sound
            'th': 'th',      # Keep TH sound
            '-': ' ',        # Convert hyphens to spaces for natural pauses
        }
        
        for old, new in replacements.items():
            processed_text = processed_text.replace(old, new)
        
        # Remove stress marks and clean up
        processed_text = processed_text.replace("'", "").strip()
        
        # Cache the result
        self.phoneme_cache[cache_key] = processed_text
        return processed_text
    
    def generate_audio(self, text: str, voice_settings: Optional[Dict[str, Any]] = None) -> Optional[bytes]:
        """
        Generate audio using Piper TTS with caching
        
        Args:
            text: Text to synthesize
            voice_settings: Optional voice parameters (speed, pitch, etc.)
            
        Returns:
            WAV audio data as bytes, or None if failed
        """
        if not self.piper_available or not self.voice:
            return None
        
        # Default voice settings
        if voice_settings is None:
            voice_settings = {
                'speed': 1.0,
                'speaker_id': 0
            }
        
        # Check cache first
        cache_key = self._generate_cache_key(text, voice_settings)
        cached_audio = self.cache.get(cache_key)
        if cached_audio:
            return cached_audio
        
        try:
            # Generate audio with Piper and convert AudioChunk objects to WAV
            audio_chunks = list(self.voice.synthesize(text))
            
            if not audio_chunks:
                return None
            
            # Get audio properties from first chunk
            first_chunk = audio_chunks[0]
            sample_rate = first_chunk.sample_rate
            sample_width = first_chunk.sample_width  # bytes per sample
            channels = first_chunk.sample_channels
            
            # Convert float arrays to int16 and combine
            all_audio_data = []
            for chunk in audio_chunks:
                # Convert float32 array to int16
                float_array = chunk.audio_float_array
                int16_array = (float_array * 32767).astype(np.int16)
                all_audio_data.extend(int16_array)
            
            # Create WAV file in memory
            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(channels)
                wav_file.setsampwidth(sample_width)
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(struct.pack(f'<{len(all_audio_data)}h', *all_audio_data))
            
            audio_data = wav_buffer.getvalue()
            
            # Cache the result
            self.cache.put(cache_key, audio_data)
            
            return audio_data
            
        except Exception as e:
            print(f"Error generating audio with Piper: {e}")
            return None
    
    def create_audio_for_pronunciation(self, name: str, phonetic: str, ipa: str, 
                                     voice_settings: Optional[Dict[str, Any]] = None) -> Optional[bytes]:
        """
        Create audio specifically for biblical name pronunciation
        
        Args:
            name: The biblical name
            phonetic: Phonetic pronunciation (e.g., "AY-bruh-ham")
            ipa: IPA pronunciation (e.g., "/ˈeɪbrəˌhæm/")
            voice_settings: Optional voice parameters
            
        Returns:
            WAV audio data as bytes
        """
        # Preprocess the pronunciation for better TTS
        tts_text = self.preprocess_phonemes(name, phonetic, ipa)
        
        # Use slower speed for pronunciation clarity
        if voice_settings is None:
            voice_settings = {
                'speed': 0.8,  # Slightly slower for clarity
                'speaker_id': 0
            }
        
        return self.generate_audio(tts_text, voice_settings)
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return {
            'size': self.cache.size(),
            'max_size': self.cache.max_size,
            'phoneme_cache_size': len(self.phoneme_cache)
        }
    
    def clear_cache(self) -> None:
        """Clear all caches"""
        self.cache.clear()
        self.phoneme_cache.clear()

# Global instance
piper_tts_manager = PiperTTSManager()