#!/bin/bash

# Start BibleBridge Frontend with TTS Pronunciation System Demo
# This script starts all required services for the pronunciation system

set -e

echo "🚀 Starting BibleBridge with TTS Pronunciation System..."
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from frontend directory"
    echo "Usage: cd /home/jim/development/bible/frontend && ./start_pronunciation_demo.sh"
    exit 1
fi

# Check if backend is running
echo "🔍 Checking if Express backend is running on port 3001..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Express backend is running"
else
    echo "⚠️  Express backend not detected on port 3001"
    echo "   Please start the backend first:"
    echo "   cd ../backend && npm start"
    echo
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Piper TTS Flask server is running
echo "🔍 Checking if Piper TTS server is running on port 5001..."
if curl -s http://localhost:5001/api/pronunciation/health > /dev/null 2>&1; then
    echo "✅ Piper TTS server is running"
else
    echo "⚠️  Piper TTS server not detected on port 5001"
    echo "   Please start the TTS server first:"
    echo "   cd .. && python start_tts_server.py"
    echo
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set development environment
export REACT_APP_API_URL=http://localhost:3001
export NODE_ENV=development

echo
echo "🎉 Starting React development server..."
echo
echo "Features available:"
echo "  📖 Biblical text with pronunciation hints"
echo "  🔊 Click biblical names to hear pronunciations"
echo "  💬 Hover tooltips with phonetic/IPA pronunciations"
echo "  🎛️  Audio controls and caching system"
echo "  🔧 TTS Debug Panel (bottom-right corner)"
echo
echo "Visit: http://localhost:3000"
echo
echo "Press Ctrl+C to stop the server"
echo

# Start the React development server
npm start