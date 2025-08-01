#!/usr/bin/env python3

import json
import re
import os
from typing import Dict, Tuple, Optional

try:
    import streamlit as st
    STREAMLIT_AVAILABLE = True
except ImportError:
    STREAMLIT_AVAILABLE = False
    # Create a mock st object for testing
    class MockSt:
        class session_state:
            tts_enabled = False
    st = MockSt()

class PronunciationManager:
    def __init__(self):
        self.pronunciations = {}
        self.name_patterns = []
        self.load_pronunciations()
        self.build_name_patterns()
    
    def load_pronunciations(self):
        """Load pronunciation data from JSON file"""
        try:
            pronunciation_file = os.path.join(os.path.dirname(__file__), 'pronunciations', 'biblical_names.json')
            with open(pronunciation_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Combine names and places into single dictionary
                self.pronunciations = {**data.get('names', {}), **data.get('places', {})}
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Warning: Could not load pronunciations: {e}")
            self.pronunciations = {}
    
    def build_name_patterns(self):
        """Build regex patterns for detecting biblical names"""
        if not self.pronunciations:
            return
            
        # Sort names by length (longest first) to avoid partial matches
        names = sorted(self.pronunciations.keys(), key=len, reverse=True)
        
        # Create word boundary patterns for each name
        self.name_patterns = []
        for name in names:
            # Handle names with apostrophes and special characters
            escaped_name = re.escape(name)
            # Create pattern that matches the name as a whole word
            pattern = rf'\b{escaped_name}\b'
            self.name_patterns.append((pattern, name))
    
    def get_pronunciation(self, name: str) -> Optional[Dict]:
        """Get pronunciation data for a specific name"""
        return self.pronunciations.get(name)
    
    def detect_and_wrap_names(self, text: str, show_pronunciations: bool = True, 
                            pronunciation_style: str = "phonetic") -> str:
        """
        Detect biblical names in text and wrap them with pronunciation markup
        
        Args:
            text: The text to process
            show_pronunciations: Whether to add pronunciation functionality
            pronunciation_style: "phonetic" or "ipa"
        
        Returns:
            Text with biblical names wrapped in clickable spans
        """
        if not show_pronunciations or not self.name_patterns:
            return text
        
        processed_text = text
        
        # Track replacements to avoid overlapping matches
        replacements = []
        
        for pattern, name in self.name_patterns:
            matches = list(re.finditer(pattern, processed_text, re.IGNORECASE))
            for match in reversed(matches):  # Process from end to start to maintain positions
                start, end = match.span()
                matched_text = match.group()
                
                # Check if this position is already replaced
                overlap = False
                for repl_start, repl_end in replacements:
                    if not (end <= repl_start or start >= repl_end):
                        overlap = True
                        break
                
                if not overlap:
                    pronunciation_data = self.get_pronunciation(name)
                    if pronunciation_data:
                        wrapped_name = self.create_pronunciation_span(
                            matched_text, name, pronunciation_data, pronunciation_style
                        )
                        processed_text = processed_text[:start] + wrapped_name + processed_text[end:]
                        replacements.append((start, start + len(wrapped_name)))
        
        return processed_text
    
    def create_pronunciation_span(self, matched_text: str, canonical_name: str, 
                                pronunciation_data: Dict, style: str = "phonetic") -> str:
        """
        Create HTML span with pronunciation data
        
        Args:
            matched_text: The actual text that was matched
            canonical_name: The canonical name from the dictionary
            pronunciation_data: Dictionary with phonetic and ipa data
            style: "phonetic" or "ipa"
        
        Returns:
            HTML span with pronunciation attributes
        """
        phonetic = pronunciation_data.get('phonetic', '')
        ipa = pronunciation_data.get('ipa', '')
        
        # Choose which pronunciation to display based on style
        display_pronunciation = phonetic if style == "phonetic" else ipa
        
        # Create data attributes for both styles
        data_attrs = f'data-name="{canonical_name}" data-phonetic="{phonetic}" data-ipa="{ipa}"'
        
        # Add TTS data if enabled (for future enhancement)
        tts_enabled = getattr(st.session_state, 'tts_enabled', False)
        if tts_enabled:
            tts_text = self.get_tts_text(canonical_name, style)
            data_attrs += f' data-tts-text="{tts_text}"'
        
        # Create the clickable span with tooltip
        return f'<span class="biblical-name" {data_attrs} title="{display_pronunciation}">{matched_text}</span>'
    
    def get_tts_text(self, name: str, style: str = "phonetic") -> str:
        """
        Get text suitable for text-to-speech for a given name
        
        Args:
            name: The biblical name
            style: "phonetic" or "ipa"
        
        Returns:
            Text suitable for TTS, defaulting to original name if no data
        """
        pronunciation_data = self.get_pronunciation(name)
        if not pronunciation_data:
            return name
        
        if style == "phonetic":
            # Convert phonetic notation to more TTS-friendly format
            phonetic = pronunciation_data.get('phonetic', name)
            # Remove stress marks and convert to lowercase for better TTS
            tts_text = re.sub(r'[A-Z-]', lambda m: m.group().lower().replace('-', ''), phonetic)
            return tts_text
        else:
            # For IPA, fall back to the original name as TTS engines don't handle IPA well
            return name

# Global instance for easy import
pronunciation_manager = PronunciationManager()