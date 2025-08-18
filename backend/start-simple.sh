#!/bin/bash

# BibleBridge Simplified Backend Startup Script

echo "🚀 Starting BibleBridge Backend API..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is available  
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the simplified app
echo "🔨 Building backend..."
npm run build:simple

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi

# Start the server
echo "🌟 Starting BibleBridge Backend API on http://localhost:3000"
echo "📚 Available endpoints:"
echo "  - GET  /api/health"
echo "  - GET  /api/translations"
echo "  - GET  /api/books"
echo "  - GET  /api/translations/{translation}/{book}/{chapter}"
echo "  - GET  /api/search/{translation}?q={term}"
echo "  - GET  /api/pronunciations"
echo "  - GET  /api/pronunciations/{name}"
echo "  - POST /api/tts/generate"
echo "  - GET/POST /api/user/position"
echo "  - GET/POST /api/user/settings"
echo ""
echo "🛑 Press Ctrl+C to stop the server"

npm run start:simple