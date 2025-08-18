#!/usr/bin/env python3
"""
Start just the TTS API server - wrapper for run_tts_server.py
"""

import subprocess
import sys
import os

if __name__ == "__main__":
    # Simply run the working TTS server
    script_path = os.path.join(os.path.dirname(__file__), 'run_tts_server.py')
    
    try:
        subprocess.run([sys.executable, script_path], check=True)
    except KeyboardInterrupt:
        print("\n🛑 TTS server stopped")
    except Exception as e:
        print(f"❌ Error starting TTS server: {e}")