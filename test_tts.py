#!/usr/bin/env python3
"""
Quick test script for TTS functionality
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_direct_tts():
    """Test TTS manager directly"""
    print("🧪 Testing Piper TTS Manager directly...")
    
    try:
        from tts.piper_tts_manager import piper_tts_manager
        
        print(f"✅ Piper available: {piper_tts_manager.piper_available}")
        print(f"✅ Voice loaded: {piper_tts_manager.voice is not None}")
        
        if piper_tts_manager.piper_available:
            print("🎤 Generating test audio for 'Abraham'...")
            audio_data = piper_tts_manager.create_audio_for_pronunciation(
                'Abraham', 'AY-bruh-ham', '/ˈeɪbrəˌhæm/'
            )
            
            if audio_data:
                print(f"✅ Audio generated: {len(audio_data)} bytes")
                
                # Save test file
                with open('/tmp/tts_test.wav', 'wb') as f:
                    f.write(audio_data)
                print("📁 Test audio saved to /tmp/tts_test.wav")
                return True
            else:
                print("❌ No audio data generated")
                return False
        else:
            print("❌ Piper TTS not available")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_pronunciation_manager():
    """Test pronunciation manager"""
    print("\n🧪 Testing Pronunciation Manager...")
    
    try:
        from pronunciation.pronunciation_utils import pronunciation_manager
        
        count = len(pronunciation_manager.pronunciations)
        print(f"✅ Loaded {count} pronunciations")
        
        if count > 0:
            # Test a few names
            test_names = ['Abraham', 'Moses', 'David']
            for name in test_names:
                data = pronunciation_manager.get_pronunciation(name)
                if data:
                    print(f"✅ {name}: {data.get('phonetic', 'N/A')}")
                else:
                    print(f"⚠️  {name}: Not found")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 BibleBridge TTS Test Suite")
    print("=" * 40)
    
    tts_ok = test_direct_tts()
    pron_ok = test_pronunciation_manager()
    
    print("\n" + "=" * 40)
    if tts_ok and pron_ok:
        print("🎉 All tests passed! TTS system is ready.")
        print("\n📋 Next steps:")
        print("   1. Run: python start_tts_server.py")
        print("   2. Run: streamlit run biblebridge_app.py")
        print("   3. Open http://localhost:8501 in your browser")
        print("   4. Click on biblical names to hear pronunciations!")
    else:
        print("❌ Some tests failed. Check the errors above.")

if __name__ == "__main__":
    main()