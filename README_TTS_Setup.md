# BibleBridge TTS Setup Guide

## Project Structure

```
bible/
├── src/
│   ├── tts/                    # TTS modules
│   │   ├── piper_tts_manager.py    # Piper TTS integration
│   │   ├── piper_api_server.py     # Flask API server
│   │   ├── tts_utils.py            # Legacy TTS utilities
│   │   └── web_audio_utils.py      # Web Audio API client code
│   └── pronunciation/          # Pronunciation detection
│       └── pronunciation_utils.py  # Name detection and wrapping
├── data/
│   └── pronunciations/         # Pronunciation data
│       ├── biblical_names.json     # 652 entries with phonetic/IPA/phoneme
│       └── voice_models/
│           └── lessac_high/
│               ├── en_US-lessac-high.onnx      # Piper voice model
│               └── en_US-lessac-high.onnx.json # Model config
├── scripts/                    # Utility scripts
│   ├── convert_pronunciation_guide.py  # Convert text guides to JSON
│   └── update_pronunciation_data.py    # Add phoneme preprocessing
└── requirements.txt            # Updated dependencies
```

## Features Implemented

### 1. **Massive Pronunciation Database** (652 entries)
- **Names**: 609 biblical characters  
- **Places**: 34 locations
- **Terms**: 9 theological terms
- **Data Format**: Each entry has `phonetic`, `ipa`, and `phoneme` fields

### 2. **High-Quality TTS with Piper**
- **Voice Model**: Lessac high-quality English (22kHz)
- **Local Processing**: No API dependencies
- **LRU Caching**: 100 recent pronunciations cached
- **Phoneme Optimization**: Preprocessed for clear speech

### 3. **Web Audio API Integration**
- **Modern Playback**: Web Audio Context for quality
- **Client Caching**: Browser-side audio buffering
- **Visual Feedback**: Click interactions with animations

### 4. **Scalable Architecture**
- **Flask API**: RESTful TTS generation endpoint
- **Modular Design**: Separate concerns (TTS, pronunciation, web)
- **Error Handling**: Graceful fallbacks and logging

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start TTS API Server**:
   ```bash
   python src/tts/piper_api_server.py
   ```

3. **Integrate with Streamlit App**:
   ```python
   from src.pronunciation.pronunciation_utils import pronunciation_manager
   from src.tts.web_audio_utils import create_web_audio_js
   
   # In your Streamlit app
   text_with_pronunciations = pronunciation_manager.detect_and_wrap_names(verse_text)
   st.markdown(text_with_pronunciations, unsafe_allow_html=True)
   ```

## API Usage

**Generate Audio**: `POST /api/pronunciation/audio`
```json
{
  "name": "Abraham",
  "phonetic": "AY-bruh-ham", 
  "ipa": "/ˈeɪbrəˌhæm/",
  "phoneme": "aee bruh ham"
}
```

**Cache Stats**: `GET /api/pronunciation/cache/stats`

**Health Check**: `GET /api/pronunciation/health`

## Data Sources

- **Original**: 186 entries from existing biblical_names.json
- **Bible Blender Guide**: 487 new entries automatically converted
- **Total Coverage**: 652 biblical names, places, and terms

This setup provides enterprise-grade TTS pronunciation for biblical text with excellent performance and scalability for thousands of entries.