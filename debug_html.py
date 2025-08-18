#!/usr/bin/env python3
"""
Debug HTML rendering in Streamlit
"""

import streamlit as st
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from pronunciation.pronunciation_utils import pronunciation_manager
from tts.web_audio_utils import create_web_audio_js, create_pronunciation_css

st.set_page_config(page_title="Debug HTML Rendering")

# Initialize session state manually
if 'show_pronunciations' not in st.session_state:
    st.session_state.show_pronunciations = True
if 'pronunciation_style' not in st.session_state:
    st.session_state.pronunciation_style = 'phonetic'
if 'tts_enabled' not in st.session_state:
    st.session_state.tts_enabled = True

# Load CSS and JS
pronunciation_css = create_pronunciation_css()
web_audio_js = create_web_audio_js()

full_css = f"<style>\n{pronunciation_css}\n</style>"
full_js = f"<script>\n{web_audio_js}\n</script>"

st.markdown(full_css, unsafe_allow_html=True)
st.markdown(full_js, unsafe_allow_html=True)

st.title("🧪 HTML Pronunciation Debug")

# Test 1: Simple HTML
st.subheader("Test 1: Basic HTML")
simple_html = '<span style="color: red;">This should be red</span>'
st.markdown(f"Raw: `{simple_html}`")
st.markdown(simple_html, unsafe_allow_html=True)

# Test 2: Pronunciation spans
st.subheader("Test 2: Pronunciation Detection")
test_verse = "And Abraham said unto Isaac his son"
processed_verse = pronunciation_manager.detect_and_wrap_names(
    test_verse, 
    st.session_state.show_pronunciations,
    st.session_state.pronunciation_style
)

st.write("**Original verse:**", test_verse)
st.write("**Processed HTML:**")
st.code(processed_verse, language="html")
st.write("**Rendered result:**")
st.markdown(processed_verse, unsafe_allow_html=True)

# Test 3: Session state info
st.subheader("Test 3: Session State")
st.write("show_pronunciations:", st.session_state.show_pronunciations)
st.write("pronunciation_style:", st.session_state.pronunciation_style) 
st.write("tts_enabled:", st.session_state.tts_enabled)

# Test 4: Manual span
st.subheader("Test 4: Manual Biblical Name Span")
manual_span = '''<span class="biblical-name" data-name="Abraham" data-phonetic="AY-bruh-ham" title="AY-bruh-ham">Abraham</span>'''
st.markdown(f"Manual span: {manual_span}", unsafe_allow_html=True)