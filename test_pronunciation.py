#!/usr/bin/env python3
"""
Simple test page to verify pronunciation functionality
"""

import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from pronunciation.pronunciation_utils import pronunciation_manager
from tts.web_audio_utils import create_web_audio_js, create_pronunciation_css

st.set_page_config(page_title="Pronunciation Test", layout="wide")

# Initialize session state
if 'show_pronunciations' not in st.session_state:
    st.session_state.show_pronunciations = True
if 'pronunciation_style' not in st.session_state:
    st.session_state.pronunciation_style = 'phonetic'
if 'tts_enabled' not in st.session_state:
    st.session_state.tts_enabled = True

# Load CSS and JS
pronunciation_css = create_pronunciation_css()
web_audio_js = create_web_audio_js()

st.markdown(f"<style>{pronunciation_css}</style>", unsafe_allow_html=True)
st.markdown(f"<script>{web_audio_js}</script>", unsafe_allow_html=True)

st.title("🎤 Pronunciation Test Page")

# Settings
with st.sidebar:
    st.header("Settings")
    st.session_state.show_pronunciations = st.checkbox("Enable Pronunciations", st.session_state.show_pronunciations)
    st.session_state.pronunciation_style = st.selectbox("Style", ["phonetic", "ipa"], 
                                                       index=0 if st.session_state.pronunciation_style == "phonetic" else 1)
    st.session_state.tts_enabled = st.checkbox("Enable TTS", st.session_state.tts_enabled)
    
    if st.button("🔄 Refresh"):
        st.rerun()

# Test verse
test_verse = "And Abraham said unto Isaac his son, Behold the fire and the wood: but where is the lamb for a burnt offering? And David said to Solomon his son, Be strong and of good courage, and do it."

col1, col2 = st.columns(2)

with col1:
    st.subheader("Original Text")
    st.write(test_verse)

with col2:
    st.subheader("With Pronunciations")
    
    if st.session_state.show_pronunciations:
        processed_verse = pronunciation_manager.detect_and_wrap_names(
            test_verse, 
            st.session_state.show_pronunciations,
            st.session_state.pronunciation_style,
            st.session_state.tts_enabled
        )
        
        # Display processed verse
        st.markdown(processed_verse, unsafe_allow_html=True)
        
        # Show raw HTML for debugging
        with st.expander("Show Raw HTML"):
            st.code(processed_verse, language="html")
    else:
        st.write(test_verse)

# Status info
st.markdown("---")
st.subheader("Status")
col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Pronunciations Loaded", len(pronunciation_manager.pronunciations))

with col2:
    server_status = "🟢 Assumed Running" if st.session_state.tts_enabled else "🔴 Disabled"
    st.metric("TTS Server", server_status)

with col3:
    st.metric("Settings", f"{st.session_state.pronunciation_style.upper()}")

# Instructions
st.markdown("---")
st.markdown("""
### 📋 Instructions:
1. **Make sure TTS server is running**: `python run_tts_server.py`
2. **Enable settings** in the sidebar
3. **Look for underlined names** like Abraham, Isaac, David, Solomon
4. **Hover** to see pronunciation tooltips
5. **Click** to hear audio pronunciations
6. **Check browser console** (F12) for any errors

### 🎯 Expected Results:
- Biblical names should appear as **clickable, underlined text**
- **NOT** as raw HTML spans like `<span class="biblical-name"...>`
- Clicking should trigger audio requests to `localhost:5001`
""")