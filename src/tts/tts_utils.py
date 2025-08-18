#!/usr/bin/env python3

import streamlit as st
import io
import base64
from typing import Optional

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    st.warning("gTTS not available. Install with: pip install gtts")

try:
    from streamlit_TTS import auto_play, text_to_audio
    STREAMLIT_TTS_AVAILABLE = True
except ImportError:
    STREAMLIT_TTS_AVAILABLE = False

class TTSManager:
    def __init__(self):
        self.tts_available = GTTS_AVAILABLE or STREAMLIT_TTS_AVAILABLE
    
    def create_audio_for_name(self, name: str, tts_text: str) -> Optional[str]:
        """
        Create audio for a biblical name pronunciation
        
        Args:
            name: The biblical name
            tts_text: Text formatted for TTS
            
        Returns:
            Base64 encoded audio data or None if failed
        """
        if not self.tts_available:
            return None
            
        try:
            if STREAMLIT_TTS_AVAILABLE:
                # Use streamlit-TTS if available
                audio_data = text_to_audio(tts_text, language='en')
                return audio_data
            elif GTTS_AVAILABLE:
                # Fallback to gTTS
                return self._create_gtts_audio(tts_text)
        except Exception as e:
            st.error(f"Error creating audio for {name}: {e}")
            return None
    
    def _create_gtts_audio(self, text: str) -> Optional[str]:
        """Create audio using Google Text-to-Speech"""
        try:
            # Create TTS object
            tts = gTTS(text=text, lang='en', slow=False)
            
            # Save to BytesIO object
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            # Encode as base64
            audio_base64 = base64.b64encode(audio_buffer.read()).decode()
            return audio_base64
        except Exception as e:
            st.error(f"Error with gTTS: {e}")
            return None
    
    def create_audio_html(self, audio_base64: str, name: str) -> str:
        """
        Create HTML audio element for inline playback
        
        Args:
            audio_base64: Base64 encoded audio data
            name: Name for the audio element ID
            
        Returns:
            HTML string with audio element
        """
        audio_id = f"audio_{name.lower().replace(' ', '_')}"
        return f"""
        <audio id="{audio_id}" preload="none">
            <source src="data:audio/mp3;base64,{audio_base64}" type="audio/mp3">
        </audio>
        """
    
    def create_play_script(self, name: str) -> str:
        """
        Create JavaScript for playing audio
        
        Args:
            name: Name for the audio element ID
            
        Returns:
            JavaScript string for playing audio
        """
        audio_id = f"audio_{name.lower().replace(' ', '_')}"
        return f"""
        <script>
        function play_{audio_id}() {{
            var audio = document.getElementById('{audio_id}');
            if (audio) {{
                audio.play().catch(function(error) {{
                    console.log('Audio play failed:', error);
                }});
            }}
        }}
        </script>
        """

# Global instance
tts_manager = TTSManager()