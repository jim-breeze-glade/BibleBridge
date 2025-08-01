#!/usr/bin/env python3

import streamlit as st
import json
import os
from pathlib import Path
import re
import colorsys
from pronunciation_utils import pronunciation_manager

# Configure page
st.set_page_config(
    page_title="BibleBridge: Bible Version Comparison and Study",
    page_icon="📖",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Load custom CSS
def load_css():
    # Generate dynamic styles with error handling
    try:
        red_letter_css = get_red_letter_style()
    except Exception as e:
        st.error(f"Error generating red letter CSS: {e}")
        red_letter_css = ".red-letter { color: #8B0000; font-weight: 500; }"
    
    try:
        text_brightness_css = get_text_brightness_style()
    except Exception as e:
        st.error(f"Error generating text brightness CSS: {e}")
        text_brightness_css = ".bible-text { color: inherit !important; }"
    
    
    base_css = """
    body {
        margin: 0;
        padding: 0;
    }
    
    .main-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: var(--background-color);
        border-bottom: 2px solid var(--primary-color);
        z-index: 999;
        padding: 1rem;
        margin-bottom: 2rem;
    }
    
    .title-bar {
        display: flex;
        flex-direction: column;
        max-width: 1200px;
        margin: 0 auto;
        text-align: center;
    }
    
    .app-title {
        font-size: 1.8rem;
        font-weight: bold;
        color: var(--text-color);
        margin-bottom: 0.5rem;
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
    }
    
    .title-line-two {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }
    
    .translation-left {
        font-size: 1rem;
        color: var(--secondary-color);
        flex: 1;
        text-align: left;
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
    }
    
    .current-passage {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary-color);
        flex: 0 0 auto;
        margin: 0 2rem;
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
    }
    
    .translation-right {
        font-size: 1rem;
        color: var(--secondary-color);
        flex: 1;
        text-align: right;
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
    }
    
    .content-area {
        margin-top: 100px;
        padding: 1rem;
    }
    
    .bible-text {
        font-family: 'Georgia', serif;
        line-height: 1.6;
        padding: 1.5rem;
        border-radius: 8px;
        background: var(--card-background);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
    }
    
    .verse-number {
        font-weight: bold;
        color: var(--primary-color);
        font-size: 0.9em;
        vertical-align: super;
        margin-right: 0.5em;
    }
    
    /* Biblical name pronunciation styles */
    .biblical-name {
        color: var(--primary-color);
        cursor: pointer;
        text-decoration: underline;
        text-decoration-color: var(--primary-color);
        text-decoration-thickness: 1px;
        position: relative;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .biblical-name:hover {
        color: var(--secondary-color);
        text-decoration-color: var(--secondary-color);
        background-color: rgba(76, 175, 80, 0.1);
        border-radius: 3px;
        padding: 1px 2px;
    }
    
    /* Tooltip styles */
    .biblical-name::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--card-background);
        color: var(--text-color);
        border: 1px solid var(--primary-color);
        border-radius: 4px;
        padding: 0.5rem;
        font-size: 0.8em;
        font-weight: normal;
        white-space: nowrap;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .biblical-name:hover::after {
        opacity: 1;
    }
    
    /* Audio button for pronunciation */
    .biblical-name .audio-btn {
        display: inline-block;
        margin-left: 0.2em;
        font-size: 0.7em;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    
    .biblical-name:hover .audio-btn {
        opacity: 1;
    }
    
    
    /* Dark theme */
    .dark-theme {
        --background-color: #1e1e1e;
        --card-background: #2d2d2d;
        --text-color: #ffffff;
        --primary-color: #4CAF50;
        --secondary-color: #81C784;
    }
    
    /* Light theme */ 
    .light-theme {
        --background-color: #ffffff;
        --card-background: #f8f9fa;
        --text-color: #333333;
        --primary-color: #2196F3;
        --secondary-color: #64B5F6;
    }
    
    .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.5rem;
        margin: 1rem 0;
    }
    
    .book-button {
        padding: 0.75rem;
        border: 1px solid var(--primary-color);
        border-radius: 6px;
        background: var(--card-background);
        color: var(--text-color);
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .book-button:hover {
        background: var(--primary-color);
        color: white;
    }
    
    .chapter-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.2rem;
        margin: 1rem 0;
    }
    
    .chapter-button {
        padding: 0.5rem;
        border: 1px solid var(--secondary-color);
        border-radius: 4px;
        background: var(--card-background);
        color: var(--text-color);
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        min-width: 3rem;
    }
    
    .chapter-button:hover {
        background: var(--secondary-color);
        color: white;
    }
    
    /* Chapter selection buttons - prevent text wrapping */
    .stButton > button {
        white-space: nowrap !important;
        min-width: 3rem !important;
    }
    
    .stButton > button p {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
    }
    
    /* Specifically target chapter buttons in columns */
    div[data-testid="column"] .stButton > button {
        white-space: nowrap !important;
        min-width: 3rem !important;
    }
    
    .settings-panel {
        background: var(--card-background);
        padding: 1.5rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    
    /* Navigation buttons styling */
    .nav-button {
        padding: 0.75rem 1.5rem;
        border: 2px solid var(--primary-color);
        border-radius: 6px;
        background: var(--card-background);
        color: var(--primary-color);
        font-weight: bold;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        text-decoration: none;
        display: block;
    }
    
    .nav-button:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }
    
    .nav-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    
    .nav-button:disabled:hover {
        background: var(--card-background);
        color: var(--primary-color);
    }
    
    /* Navigation section spacing */
    .navigation-section {
        margin: 1rem 0;
        padding: 1rem;
        border-radius: 8px;
        background: rgba(76, 175, 80, 0.1);
    }
    """
    
    # Combine CSS parts
    full_css = f"<style>\n{red_letter_css}\n{text_brightness_css}\n{base_css}\n</style>"
    st.markdown(full_css, unsafe_allow_html=True)
    

# Initialize session state
def load_last_position():
    """Load the last opened book and chapter from persistent storage"""
    try:
        with open('last_position.json', 'r') as f:
            data = json.load(f)
            return data.get('book', 'John'), data.get('chapter', 3)
    except (FileNotFoundError, json.JSONDecodeError):
        return 'John', 3

def save_last_position(book, chapter):
    """Save the current book and chapter to persistent storage"""
    try:
        data = {'book': book, 'chapter': chapter}
        with open('last_position.json', 'w') as f:
            json.dump(data, f)
    except Exception:
        pass  # Silently fail if we can't save

def init_session_state():
    # Load last position from persistent storage
    last_book, last_chapter = load_last_position()
    
    if 'current_book' not in st.session_state:
        st.session_state.current_book = last_book
    if 'current_chapter' not in st.session_state:
        st.session_state.current_chapter = last_chapter
    if 'left_translation' not in st.session_state:
        st.session_state.left_translation = 'KJV'
    if 'right_translation' not in st.session_state:
        st.session_state.right_translation = 'NLT'
    if 'theme' not in st.session_state:
        st.session_state.theme = 'dark'
    if 'font_size' not in st.session_state:
        st.session_state.font_size = 22
    if 'font_family' not in st.session_state:
        st.session_state.font_family = 'Georgia'
    if 'show_red_letters' not in st.session_state:
        st.session_state.show_red_letters = True
    
    # Red letter color settings
    if 'red_letter_brightness' not in st.session_state:
        st.session_state.red_letter_brightness = 100  # Bright red
    
    # Text brightness
    if 'text_brightness' not in st.session_state:
        st.session_state.text_brightness = 100  # Full brightness
    
    # RGB wave animation
    if 'rgb_wave_enabled' not in st.session_state:
        st.session_state.rgb_wave_enabled = False
    if 'rgb_wave_speed' not in st.session_state:
        st.session_state.rgb_wave_speed = 2.0  # seconds per cycle
    
    # Pronunciation settings
    if 'show_pronunciations' not in st.session_state:
        st.session_state.show_pronunciations = True
    if 'pronunciation_style' not in st.session_state:
        st.session_state.pronunciation_style = 'phonetic'  # or 'ipa'
    if 'tts_enabled' not in st.session_state:
        st.session_state.tts_enabled = True

# Helper functions
def hsb_to_rgb(h, s, b):
    """Convert HSB (0-360, 0-100, 0-100) to RGB (0-255, 0-255, 0-255)"""
    h = h / 360.0
    s = s / 100.0 
    b = b / 100.0
    r, g, b = colorsys.hsv_to_rgb(h, s, b)
    return int(r * 255), int(g * 255), int(b * 255)

def get_red_letter_style():
    """Generate CSS for red letter text based on current settings"""
    # Safety check for session state
    if not hasattr(st.session_state, 'rgb_wave_enabled'):
        return """
        .red-letter {
            color: #8B0000;
            font-weight: 500;
        }
        """
        
    if st.session_state.rgb_wave_enabled:
        # Left-to-right RGB wave animation with smooth looping
        return f"""
        .red-letter {{
            background: linear-gradient(90deg, 
                #ff0000 0%, #ff8000 12.5%, #ffff00 25%, #80ff00 37.5%, 
                #00ff00 50%, #00ff80 62.5%, #00ffff 75%, #8000ff 87.5%, #ff0000 100%);
            background-size: 800% 100%;
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            animation: rgbWaveMove {st.session_state.rgb_wave_speed}s infinite linear;
            font-weight: 500;
        }}
        
        @keyframes rgbWaveMove {{
            0% {{ background-position: 0% 50%; }}
            100% {{ background-position: 100% 50%; }}
        }}
        """
    else:
        # Static red color with brightness
        brightness_val = st.session_state.red_letter_brightness / 100.0
        r, g, b = int(255 * brightness_val), 0, 0
        return f"""
        .red-letter {{
            color: rgb({r}, {g}, {b});
            font-weight: 500;
        }}
        """

def get_text_brightness_style():
    """Generate CSS for text brightness"""
    # Safety check for session state
    if not hasattr(st.session_state, 'text_brightness'):
        return """
        .bible-text {
            color: inherit !important;
        }
        """
        
    brightness = st.session_state.text_brightness / 100.0
    if st.session_state.theme == 'dark':
        base_color = f"rgba(255, 255, 255, {brightness})"
    else:
        base_color = f"rgba(51, 51, 51, {brightness})"
    
    return f"""
    .bible-text {{
        color: {base_color} !important;
    }}
    .bible-text *:not(.red-letter) {{
        color: inherit !important;
    }}
    .verse-number {{
        opacity: {brightness * 0.8};
    }}
    """

# Bible books data
BIBLE_BOOKS = {
    'Old Testament': [
        'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
        'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
        '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
        'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
        'Ecclesiastes', 'Song of Songs', 'Isaiah', 'Jeremiah', 'Lamentations',
        'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
        'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
        'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ],
    'New Testament': [
        'Matthew', 'Mark', 'Luke', 'John', 'Acts',
        'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
        'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
        '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
        '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
        'Jude', 'Revelation'
    ]
}

# Available translations
AVAILABLE_TRANSLATIONS = ['KJV', 'NLT', 'NIV', 'CSB']

# Gospel books that should have red letter text
GOSPEL_BOOKS = ['Matthew', 'Mark', 'Luke', 'John']

def load_translation_data(translation, book):
    """Load translation data from JSON files"""
    try:
        # Handle special book name mappings
        if translation == 'CSB':
            book_filename = book.replace(' ', '').replace('Song of Songs', 'SongofSongs')
        else:
            book_filename = book.replace(' ', '').replace('Song of Songs', 'SongofSolomon')
        file_path = f"translations/{translation}_json/{book_filename}.json"
        
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            return None
    except Exception as e:
        st.error(f"Error loading {translation} {book}: {e}")
        return None

def get_chapter_count(book):
    """Get chapter count for a book by checking JSON files"""
    for translation in AVAILABLE_TRANSLATIONS:
        data = load_translation_data(translation, book)
        if data:
            if 'chapters' in data:
                return len(data['chapters'])
            elif 'count' in data:
                return data['count']
    
    # Fallback chapter counts
    chapter_counts = {
        'Genesis': 50, 'Exodus': 40, 'Leviticus': 27, 'Numbers': 36, 'Deuteronomy': 34,
        'Joshua': 24, 'Judges': 21, 'Ruth': 4, '1 Samuel': 31, '2 Samuel': 24,
        '1 Kings': 22, '2 Kings': 25, '1 Chronicles': 29, '2 Chronicles': 36, 'Ezra': 10,
        'Nehemiah': 13, 'Esther': 10, 'Job': 42, 'Psalms': 150, 'Proverbs': 31,
        'Ecclesiastes': 12, 'Song of Songs': 8, 'Isaiah': 66, 'Jeremiah': 52, 'Lamentations': 5,
        'Ezekiel': 48, 'Daniel': 12, 'Hosea': 14, 'Joel': 3, 'Amos': 9,
        'Obadiah': 1, 'Jonah': 4, 'Micah': 7, 'Nahum': 3, 'Habakkuk': 3,
        'Zephaniah': 3, 'Haggai': 2, 'Zechariah': 14, 'Malachi': 4,
        'Matthew': 28, 'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28,
        'Romans': 16, '1 Corinthians': 16, '2 Corinthians': 13, 'Galatians': 6, 'Ephesians': 6,
        'Philippians': 4, 'Colossians': 4, '1 Thessalonians': 5, '2 Thessalonians': 3, '1 Timothy': 6,
        '2 Timothy': 4, 'Titus': 3, 'Philemon': 1, 'Hebrews': 13, 'James': 5,
        '1 Peter': 5, '2 Peter': 3, '1 John': 5, '2 John': 1, '3 John': 1,
        'Jude': 1, 'Revelation': 22
    }
    return chapter_counts.get(book, 28)

def add_red_letter_text(text, book, show_red_letters=True):
    """Add red letter formatting for Jesus' words in Gospel books"""
    if not show_red_letters or book not in GOSPEL_BOOKS:
        return text
    
    # Enhanced patterns for detecting Jesus' words in KJV and other translations
    jesus_patterns = [
        # Beatitudes and direct teaching
        (r'\bBlessed are (.*?)\.', r'<span class="red-letter">Blessed are \1.</span>'),
        # "I say unto you" patterns
        (r'\b((?:Verily )?I say unto you.*?)(?=\.|"|$)', r'<span class="red-letter">\1</span>'),
        (r'\b(I am .*?)(?=\.|"|$)', r'<span class="red-letter">\1</span>'),
        # Direct quotes after Jesus speaks
        (r'(Jesus.*?said.*?[,:])\s*([^"]*?)(?=\.|And |But |Then )', r'\1 <span class="red-letter">\2</span>'),
        (r'(he.*?said.*?[,:])\s*([^"]*?)(?=\.|And |But |Then )', r'\1 <span class="red-letter">\2</span>'),
        # Simple quoted speech
        (r'"([^"]*?)"', r'<span class="red-letter">"\1"</span>'),
        # Commands and teachings
        (r'\b(Follow me.*?)(?=\.|And |But |Then |$)', r'<span class="red-letter">\1</span>'),
        (r'\b(Repent.*?)(?=\.|And |But |Then |$)', r'<span class="red-letter">\1</span>'),
        (r'\b(Come.*?)(?=\.|And |But |Then |$)', r'<span class="red-letter">\1</span>'),
        (r'\b(Go.*?)(?=\.|And |But |Then |$)', r'<span class="red-letter">\1</span>'),
    ]
    
    # Apply patterns carefully to avoid double-wrapping
    for pattern, replacement in jesus_patterns:
        # Only apply if not already wrapped
        if 'red-letter' not in text:
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    return text

def get_bible_text(book, chapter, translation):
    """Get Bible text from JSON files"""
    data = load_translation_data(translation, book)
    
    if not data:
        return f"{translation} text for {book} chapter {chapter} not available"
    
    try:
        # Handle different JSON structures
        if 'chapters' in data:
            chapters = data['chapters']
            
            # Find the chapter
            chapter_data = None
            for ch in chapters:
                if str(ch.get('chapter', '')) == str(chapter):
                    chapter_data = ch
                    break
            
            if chapter_data and 'verses' in chapter_data:
                verses = chapter_data['verses']
                formatted_text = ""
                
                for verse in verses:
                    verse_num = verse.get('verse', '')
                    verse_text = verse.get('text', '')
                    
                    # Add red letter formatting for Gospels
                    if book in GOSPEL_BOOKS and st.session_state.show_red_letters:
                        verse_text = add_red_letter_text(verse_text, book)
                    
                    # Add pronunciation markup for biblical names
                    if st.session_state.show_pronunciations:
                        verse_text = pronunciation_manager.detect_and_wrap_names(
                            verse_text, 
                            st.session_state.show_pronunciations,
                            st.session_state.pronunciation_style
                        )
                    
                    formatted_text += f'<span class="verse-number">{verse_num}</span> {verse_text}\n\n'
                
                return formatted_text.strip()
        
        return f"Chapter {chapter} not found in {translation} {book}"
        
    except Exception as e:
        return f"Error loading {translation} {book} chapter {chapter}: {e}"

def get_next_chapter(book, chapter):
    """Get the next chapter, handling book transitions"""
    max_chapters = get_chapter_count(book)
    
    if chapter < max_chapters:
        return book, chapter + 1
    else:
        # Move to next book
        all_books = BIBLE_BOOKS['Old Testament'] + BIBLE_BOOKS['New Testament']
        try:
            current_index = all_books.index(book)
            if current_index + 1 < len(all_books):
                next_book = all_books[current_index + 1]
                return next_book, 1
        except ValueError:
            pass
    
    return book, chapter  # No change if at end

def get_previous_chapter(book, chapter):
    """Get the previous chapter, handling book transitions"""
    if chapter > 1:
        return book, chapter - 1
    else:
        # Move to previous book
        all_books = BIBLE_BOOKS['Old Testament'] + BIBLE_BOOKS['New Testament']
        try:
            current_index = all_books.index(book)
            if current_index > 0:
                prev_book = all_books[current_index - 1]
                prev_chapters = get_chapter_count(prev_book)
                return prev_book, prev_chapters
        except ValueError:
            pass
    
    return book, chapter  # No change if at beginning

def render_navigation_buttons(position="top"):
    """Render previous/next navigation buttons"""
    nav_col1, nav_col2, nav_col3 = st.columns([1, 2, 1])
    
    with nav_col1:
        prev_book, prev_chapter = get_previous_chapter(st.session_state.current_book, st.session_state.current_chapter)
        prev_disabled = (prev_book == st.session_state.current_book and prev_chapter == st.session_state.current_chapter)
        
        if st.button("← Previous", key=f"prev_{position}", disabled=prev_disabled, use_container_width=True):
            st.session_state.current_book = prev_book
            st.session_state.current_chapter = prev_chapter
            save_last_position(prev_book, prev_chapter)
            st.rerun()
    
    with nav_col2:
        st.markdown(f"<div style='text-align: center; padding: 0.5rem; font-weight: bold; color: var(--primary-color);'>{st.session_state.current_book} {st.session_state.current_chapter}</div>", unsafe_allow_html=True)
    
    with nav_col3:
        next_book, next_chapter = get_next_chapter(st.session_state.current_book, st.session_state.current_chapter)
        next_disabled = (next_book == st.session_state.current_book and next_chapter == st.session_state.current_chapter)
        
        if st.button("Next →", key=f"next_{position}", disabled=next_disabled, use_container_width=True):
            st.session_state.current_book = next_book
            st.session_state.current_chapter = next_chapter
            save_last_position(next_book, next_chapter)
            st.rerun()

def render_title_bar():
    st.markdown(f"""
    <div class="main-header {st.session_state.theme}-theme">
        <div class="title-bar">
            <div class="app-title">BibleBridge: Bible Version Comparison and Study</div>
            <div class="title-line-two">
                <div class="translation-left">{st.session_state.left_translation}</div>
                <div class="current-passage">{st.session_state.current_book} {st.session_state.current_chapter}</div>
                <div class="translation-right">{st.session_state.right_translation}</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def main():
    init_session_state()
    load_css()
    render_title_bar()
    
    # Main content area
    st.markdown('<div class="content-area">', unsafe_allow_html=True)
    
    # Sidebar for navigation and settings
    with st.sidebar:
        st.header("📚 Navigation")
        
        # Chapter selection (moved to top for easier continuous reading)
        st.subheader("Select Chapter")
        max_chapters = get_chapter_count(st.session_state.current_book)
        
        # Calculate how many rows we need for 4 columns
        chapters_per_row = 4
        num_rows = (max_chapters + chapters_per_row - 1) // chapters_per_row
        
        for row in range(num_rows):
            chapter_cols = st.columns(chapters_per_row)
            for col in range(chapters_per_row):
                chapter_num = row * chapters_per_row + col + 1
                if chapter_num <= max_chapters:
                    with chapter_cols[col]:
                        if st.button(str(chapter_num), key=f"chapter_{chapter_num}", use_container_width=True):
                            st.session_state.current_chapter = chapter_num
                            save_last_position(st.session_state.current_book, chapter_num)
                            st.rerun()
        
        st.divider()
        
        # Book selection (moved below chapters)
        st.subheader("Select Book")
        testament_tab = st.radio("Testament", ["Old Testament", "New Testament"], 
                                index=1 if st.session_state.current_book in BIBLE_BOOKS['New Testament'] else 0)
        
        # Book list
        books = BIBLE_BOOKS[testament_tab]
        for book in books:
            if st.button(book, key=f"book_{book}", use_container_width=True):
                st.session_state.current_book = book
                st.session_state.current_chapter = 1
                save_last_position(book, 1)
                st.rerun()
        
        st.divider()
        
        # Translation selection
        st.subheader("Translations")
        
        left_index = AVAILABLE_TRANSLATIONS.index(st.session_state.left_translation) if st.session_state.left_translation in AVAILABLE_TRANSLATIONS else 0
        right_index = AVAILABLE_TRANSLATIONS.index(st.session_state.right_translation) if st.session_state.right_translation in AVAILABLE_TRANSLATIONS else 1
        
        st.session_state.left_translation = st.selectbox("Left Panel", AVAILABLE_TRANSLATIONS, index=left_index)
        st.session_state.right_translation = st.selectbox("Right Panel", AVAILABLE_TRANSLATIONS, index=right_index)
        
        st.divider()
        
        # Settings
        st.subheader("⚙️ Settings")
        
        # Basic settings
        st.session_state.theme = st.selectbox("Theme", ["dark", "light"], 
                                            index=0 if st.session_state.theme == "dark" else 1)
        st.session_state.font_size = st.slider("Font Size", 12, 32, st.session_state.font_size)
        st.session_state.font_family = st.selectbox("Font Family", 
                                                   ["Georgia", "Times New Roman", "Arial", "Helvetica"])
        
        # Text brightness
        st.session_state.text_brightness = st.slider("Text Brightness", 20, 100, st.session_state.text_brightness, 
                                                     help="Adjust the brightness of normal text")
        
        if st.button("Set Text Brightness as Default", key="default_text_brightness"):
            st.success("Text brightness set as default!")
        
        st.divider()
        
        # Red letter settings
        st.subheader("🔴 Red Letter Settings")
        st.session_state.show_red_letters = st.checkbox("Enable Red Letter Text", st.session_state.show_red_letters)
        
        if st.session_state.show_red_letters:
            # RGB Wave Animation
            st.session_state.rgb_wave_enabled = st.checkbox("RGB Wave Animation", st.session_state.rgb_wave_enabled,
                                                           help="Animate Jesus' words with rainbow colors")
            
            if st.session_state.rgb_wave_enabled:
                st.session_state.rgb_wave_speed = st.slider("Animation Speed (seconds)", 0.5, 10.0, st.session_state.rgb_wave_speed, 0.1,
                                                           help="Duration for one complete color cycle")
                
                if st.button("Set RGB Speed as Default", key="default_rgb_speed"):
                    st.success("RGB animation speed set as default!")
            else:
                # Brightness Control
                st.write("**Color Settings**")
                st.session_state.red_letter_brightness = st.slider("Red Brightness", 10, 100, st.session_state.red_letter_brightness,
                                                                 help="Red letter brightness (10=dark, 100=bright)")
                
                # Color preview
                brightness_val = st.session_state.red_letter_brightness / 100.0
                r, g, b = int(255 * brightness_val), 0, 0
                st.markdown(f"""
                <div style="background: rgb({r}, {g}, {b}); height: 30px; border-radius: 5px; margin: 10px 0; 
                           display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    Preview: rgb({r}, {g}, {b})
                </div>
                """, unsafe_allow_html=True)
                
                if st.button("Set Red Letter Color as Default", key="default_red_color"):
                    st.success("Red letter color set as default!")
        
        st.divider()
        
        # Pronunciation settings
        st.subheader("🔊 Pronunciation Settings")
        st.session_state.show_pronunciations = st.checkbox("Enable Name Pronunciations", st.session_state.show_pronunciations,
                                                           help="Show clickable biblical names with pronunciation tooltips")
        
        if st.session_state.show_pronunciations:
            st.session_state.pronunciation_style = st.selectbox("Pronunciation Style", 
                                                              ["phonetic", "ipa"], 
                                                              index=0 if st.session_state.pronunciation_style == "phonetic" else 1,
                                                              help="Choose between phonetic spelling (AY-bruh-ham) or IPA notation (/ˈeɪbrəˌhæm/)")
            
            st.session_state.tts_enabled = st.checkbox("Text-to-Speech (Future Feature)", st.session_state.tts_enabled,
                                                      help="Prepare TTS data for biblical names (click functionality coming soon)")
            
            if st.session_state.tts_enabled:
                st.info("💡 TTS data is being prepared. Click functionality will be available in a future update!")
        
        # Force rerun when settings change to update CSS
        if st.button("🔄 Apply Changes", key="apply_changes"):
            st.rerun()
    
    # Top navigation buttons
    render_navigation_buttons("top")
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Main content columns
    col1, col2 = st.columns(2)
    
    # Apply theme class to main content
    theme_class = f"{st.session_state.theme}-theme"
    
    with col1:
        st.markdown(f"""
        <div class="bible-text {theme_class}" style="font-size: {st.session_state.font_size}px; font-family: {st.session_state.font_family};">
            <h3 style="text-align: center; margin-bottom: 1rem; color: var(--primary-color);">
                {st.session_state.left_translation}
            </h3>
            {get_bible_text(st.session_state.current_book, st.session_state.current_chapter, st.session_state.left_translation)}
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="bible-text {theme_class}" style="font-size: {st.session_state.font_size}px; font-family: {st.session_state.font_family};">
            <h3 style="text-align: center; margin-bottom: 1rem; color: var(--primary-color);">
                {st.session_state.right_translation}
            </h3>
            {get_bible_text(st.session_state.current_book, st.session_state.current_chapter, st.session_state.right_translation)}
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Bottom navigation buttons
    render_navigation_buttons("bottom")
    
    st.markdown('</div>', unsafe_allow_html=True)

if __name__ == "__main__":
    main()