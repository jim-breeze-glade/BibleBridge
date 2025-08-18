#!/usr/bin/env python3
"""
Startup script for BibleBridge with TTS server
"""

import subprocess
import time
import sys
import os
import signal
from threading import Thread

def start_tts_server():
    """Start the Piper TTS API server"""
    print("Starting TTS server...")
    os.environ['FLASK_ENV'] = 'production'
    
    # Change to the TTS directory and start the server
    tts_dir = os.path.join(os.path.dirname(__file__), 'src', 'tts')
    
    try:
        # Start Flask server in background
        subprocess.run([
            sys.executable, '-m', 'flask', 'run', 
            '--app', 'piper_api_server:app',
            '--host', '127.0.0.1', 
            '--port', '5000'
        ], cwd=tts_dir, check=True)
    except KeyboardInterrupt:
        print("TTS server stopped")
    except Exception as e:
        print(f"Error starting TTS server: {e}")

def start_streamlit():
    """Start the Streamlit app"""
    print("Starting Streamlit app...")
    try:
        subprocess.run([
            sys.executable, '-m', 'streamlit', 'run', 
            'biblebridge_app.py',
            '--server.port', '8501',
            '--server.headless', 'true'
        ], check=True)
    except KeyboardInterrupt:
        print("Streamlit app stopped")
    except Exception as e:
        print(f"Error starting Streamlit app: {e}")

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\nShutting down BibleBridge...")
    sys.exit(0)

def main():
    """Main startup function"""
    signal.signal(signal.SIGINT, signal_handler)
    
    print("🕊️  Starting BibleBridge with TTS support...")
    print("📚 Streamlit app will be available at: http://localhost:8501")
    print("🎙️  TTS API will be available at: http://localhost:5000")
    print("Press Ctrl+C to stop both servers\n")
    
    # Start TTS server in background thread
    tts_thread = Thread(target=start_tts_server, daemon=True)
    tts_thread.start()
    
    # Give TTS server time to start
    time.sleep(2)
    
    # Start Streamlit app (this will block)
    start_streamlit()

if __name__ == "__main__":
    main()