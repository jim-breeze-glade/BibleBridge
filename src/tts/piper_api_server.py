#!/usr/bin/env python3
"""
Simple Flask API server for Piper TTS pronunciation generation
"""

import os
import json
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from piper_tts_manager import piper_tts_manager

app = Flask(__name__)
CORS(app)  # Enable CORS for web requests

@app.route('/api/pronunciation/audio', methods=['POST'])
def generate_pronunciation_audio():
    """
    Generate audio for biblical name pronunciation
    
    Expected JSON payload:
    {
        "name": "Abraham",
        "phonetic": "AY-bruh-ham", 
        "ipa": "/ˈeɪbrəˌhæm/",
        "phoneme": "aee bruh ham",
        "voice_settings": {
            "speed": 0.8,
            "speaker_id": 0
        }
    }
    
    Returns:
        WAV audio data or error message
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        name = data.get('name')
        phonetic = data.get('phonetic', '')
        ipa = data.get('ipa', '')
        phoneme = data.get('phoneme', '')
        voice_settings = data.get('voice_settings', {})
        
        if not name:
            return jsonify({'error': 'Name is required'}), 400
        
        # Generate audio using Piper TTS
        audio_data = piper_tts_manager.create_audio_for_pronunciation(
            name=name,
            phonetic=phonetic,
            ipa=ipa,
            voice_settings=voice_settings
        )
        
        if audio_data is None:
            return jsonify({'error': 'Failed to generate audio'}), 500
        
        # Return audio as WAV
        return Response(
            audio_data,
            mimetype='audio/wav',
            headers={
                'Content-Disposition': f'inline; filename="{name}_pronunciation.wav"',
                'Cache-Control': 'public, max-age=3600'  # Cache for 1 hour
            }
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pronunciation/cache/stats', methods=['GET'])
def get_cache_stats():
    """Get cache statistics"""
    try:
        stats = piper_tts_manager.get_cache_stats()
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pronunciation/cache/clear', methods=['POST'])
def clear_cache():
    """Clear pronunciation cache"""
    try:
        piper_tts_manager.clear_cache()
        return jsonify({'message': 'Cache cleared successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pronunciation/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'piper_available': piper_tts_manager.piper_available,
        'model_loaded': piper_tts_manager.voice is not None
    })

if __name__ == '__main__':
    # Check if Piper model is configured
    if not piper_tts_manager.piper_available:
        print("Warning: Piper TTS not available. Please install piper-tts and configure a model.")
        print("Download models from: https://github.com/rhasspy/piper/releases")
        print("Example: Set model_path when initializing PiperTTSManager")
    
    # Run development server
    app.run(host='127.0.0.1', port=5000, debug=True)