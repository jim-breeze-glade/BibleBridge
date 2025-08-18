#!/usr/bin/env python3
"""
Script to add phoneme preprocessing to pronunciation JSON data
"""

import json
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src', 'tts'))
from piper_tts_manager import PiperTTSManager

def preprocess_phonetic_to_phoneme(phonetic: str) -> str:
    """
    Convert phonetic pronunciation to TTS-friendly phonemes
    This mirrors the logic in PiperTTSManager but can be enhanced
    """
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
    
    return processed_text

def update_pronunciation_data():
    """Add phoneme field to existing pronunciation data"""
    
    # Load existing data
    pronunciation_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'pronunciations', 'biblical_names.json')
    
    if not os.path.exists(pronunciation_file):
        print(f"File not found: {pronunciation_file}")
        return
    
    with open(pronunciation_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Process names
    names_updated = 0
    if 'names' in data:
        for name, pronunciation_data in data['names'].items():
            if 'phonetic' in pronunciation_data and 'phoneme' not in pronunciation_data:
                phonetic = pronunciation_data['phonetic']
                phoneme = preprocess_phonetic_to_phoneme(phonetic)
                pronunciation_data['phoneme'] = phoneme
                names_updated += 1
    
    # Process places
    places_updated = 0
    if 'places' in data:
        for place, pronunciation_data in data['places'].items():
            if 'phonetic' in pronunciation_data and 'phoneme' not in pronunciation_data:
                phonetic = pronunciation_data['phonetic']
                phoneme = preprocess_phonetic_to_phoneme(phonetic)
                pronunciation_data['phoneme'] = phoneme
                places_updated += 1
    
    # Save updated data
    with open(pronunciation_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {names_updated} names and {places_updated} places with phoneme data")
    
    # Show example
    if 'names' in data and 'Abraham' in data['names']:
        abraham = data['names']['Abraham']
        print(f"\nExample - Abraham:")
        print(f"  Phonetic: {abraham.get('phonetic', 'N/A')}")
        print(f"  IPA: {abraham.get('ipa', 'N/A')}")
        print(f"  Phoneme: {abraham.get('phoneme', 'N/A')}")

if __name__ == "__main__":
    update_pronunciation_data()