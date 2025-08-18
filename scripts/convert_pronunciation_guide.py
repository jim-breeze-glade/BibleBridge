#!/usr/bin/env python3
"""
Convert Bible Blender pronunciation guide from plain text to structured JSON
"""

import json
import re
import os
from typing import Dict, List, Tuple

def parse_pronunciation_guide(file_path: str) -> Dict[str, Dict[str, str]]:
    """
    Parse the Bible Blender pronunciation guide
    
    Format examples:
    Abaddon (uh-BAD-uhn)
    Abimelech (uh-BIM-uh-lek)
    """
    
    pronunciations = {
        "names": {},
        "places": {},
        "terms": {}
    }
    
    # Common biblical places for categorization
    places = {
        'egypt', 'babylon', 'jerusalem', 'bethlehem', 'nazareth', 'galilee', 
        'judea', 'samaria', 'damascus', 'antioch', 'rome', 'athens', 'corinth',
        'ephesus', 'philippi', 'thessalonica', 'capernaum', 'jericho', 'sodom',
        'gomorrah', 'nineveh', 'ur', 'babel', 'ararat', 'sinai', 'horeb',
        'bethany', 'emmaus', 'caesarea', 'tyre', 'sidon', 'gaza', 'ashkelon',
        'gath', 'ekron', 'ashdod', 'beersheba', 'hebron', 'shechem', 'shiloh',
        'bethel', 'gilgal', 'mizpah', 'ramah', 'gibeah', 'jerusalem', 'zion',
        'golgotha', 'gethsemane', 'olivet', 'tabor', 'carmel', 'lebanon',
        'jordan', 'euphrates', 'tigris', 'nile', 'mediterranean', 'red sea',
        'dead sea', 'galilee', 'gennesaret', 'tiberias'
    }
    
    # Terms that are not names or places
    terms = {
        'apostate', 'apostolic', 'aramaic', 'byzantine', 'ceasarean', 'canaanite',
        'ammonite', 'amorite', 'aramean'
    }
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by lines and filter out section headers (single letters)
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    for line in lines:
        # Skip section headers (single letters)
        if len(line) == 1 and line.isalpha():
            continue
            
        # Parse name and pronunciation
        # Pattern: Name (pronunciation) or Name or Other Name (pronunciation)
        match = re.match(r'^(.+?)\s*\(([^)]+)\)$', line)
        
        if match:
            name_part = match.group(1).strip()
            pronunciation = match.group(2).strip()
            
            # Handle "or" alternatives like "Arphaxed or Arphaxad"
            names = [n.strip() for n in re.split(r'\s+or\s+', name_part)]
            
            for name in names:
                if not name:
                    continue
                    
                # Create phoneme version (simplified for TTS)
                phoneme = convert_to_phoneme(pronunciation)
                
                # Categorize the entry
                name_lower = name.lower()
                if name_lower in places:
                    category = "places"
                elif name_lower in terms:
                    category = "terms"
                else:
                    category = "names"
                
                pronunciations[category][name] = {
                    "phonetic": pronunciation,
                    "phoneme": phoneme,
                    "source": "bible_blender"
                }
    
    return pronunciations

def convert_to_phoneme(phonetic: str) -> str:
    """
    Convert phonetic pronunciation to TTS-friendly phoneme
    
    Args:
        phonetic: Phonetic pronunciation (e.g., "uh-BAD-uhn")
        
    Returns:
        TTS-friendly text (e.g., "uh bad uhn")
    """
    phoneme = phonetic.lower()
    
    # Convert common patterns
    replacements = {
        'ay': 'ay',      # Keep long A sound
        'ee': 'ee',      # Keep long E sound  
        'oo': 'oo',      # Keep long O sound
        'uh': 'uh',      # Keep schwa sound
        'th': 'th',      # Keep TH sound
        'sh': 'sh',      # Keep SH sound
        'ch': 'ch',      # Keep CH sound
        'ng': 'ng',      # Keep NG sound
        '-': ' ',        # Convert hyphens to spaces for natural pauses
        '_': ' ',        # Convert underscores to spaces
    }
    
    for old, new in replacements.items():
        phoneme = phoneme.replace(old, new)
    
    # Remove stress marks and extra punctuation
    phoneme = re.sub(r'[\'"`]', '', phoneme)
    
    # Clean up multiple spaces
    phoneme = re.sub(r'\s+', ' ', phoneme).strip()
    
    return phoneme

def merge_with_existing(new_data: Dict, existing_file: str) -> Dict:
    """
    Merge new pronunciation data with existing biblical_names.json
    """
    try:
        with open(existing_file, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing_data = {"names": {}, "places": {}}
    
    # Merge data, with new data taking precedence
    merged = {
        "names": {**existing_data.get("names", {}), **new_data.get("names", {})},
        "places": {**existing_data.get("places", {}), **new_data.get("places", {})},
        "terms": {**existing_data.get("terms", {}), **new_data.get("terms", {})}
    }
    
    return merged

def main():
    guide_file = '/home/jim/development/bible/data/pronunciations/bible_blender_guide'
    json_file = '/home/jim/development/bible/data/pronunciations/biblical_names.json'
    
    if not os.path.exists(guide_file):
        print(f"Guide file not found: {guide_file}")
        return
    
    print(f"Converting pronunciation guide: {guide_file}")
    
    # Parse the guide
    new_pronunciations = parse_pronunciation_guide(guide_file)
    
    # Merge with existing data
    merged_data = merge_with_existing(new_pronunciations, json_file)
    
    # Save the merged data
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(merged_data, f, indent=2, ensure_ascii=False)
    
    # Print statistics
    names_count = len(merged_data.get("names", {}))
    places_count = len(merged_data.get("places", {}))
    terms_count = len(merged_data.get("terms", {}))
    new_names = len(new_pronunciations.get("names", {}))
    new_places = len(new_pronunciations.get("places", {}))
    new_terms = len(new_pronunciations.get("terms", {}))
    
    print(f"Conversion complete!")
    print(f"Total entries: {names_count + places_count + terms_count}")
    print(f"  Names: {names_count} (+{new_names} new)")
    print(f"  Places: {places_count} (+{new_places} new)")
    print(f"  Terms: {terms_count} (+{new_terms} new)")
    
    # Show some examples
    print(f"\nExamples from new data:")
    for category, entries in new_pronunciations.items():
        if entries:
            name, data = next(iter(entries.items()))
            print(f"  {category.title()}: {name}")
            print(f"    Phonetic: {data['phonetic']}")
            print(f"    Phoneme: {data['phoneme']}")
            break

if __name__ == "__main__":
    main()