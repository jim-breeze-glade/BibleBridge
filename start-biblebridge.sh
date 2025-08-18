#!/bin/bash

# BibleBridge Startup Script
# This script starts both the backend API and frontend React application

set -e  # Exit on any error

echo "🚀 Starting BibleBridge Application..."
echo "=================================="

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down BibleBridge..."
    if [[ ! -z "$BACKEND_PID" ]]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [[ ! -z "$FRONTEND_PID" ]]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo "✅ BibleBridge shut down successfully"
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Check if we're in the correct directory
if [[ ! -d "backend" ]] || [[ ! -d "frontend" ]]; then
    echo "❌ Error: Please run this script from the bible project root directory"
    echo "   Expected: /path/to/bible/"
    echo "   Contains: backend/ and frontend/ directories"
    exit 1
fi

echo "📁 Project structure verified"

# Start Backend API
echo "🔧 Starting Backend API..."
cd backend

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start the backend in development mode
echo "🚀 Launching Backend API on port 3001..."
npm run dev:simple &
BACKEND_PID=$!

# Give backend time to start
echo "⏱️  Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "❌ Backend failed to start!"
    exit 1
fi

echo "✅ Backend API running (PID: $BACKEND_PID)"

# Start Frontend
echo "🎨 Starting Frontend React App..."
cd ../frontend

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start the frontend development server
echo "🚀 Launching Frontend App on port 3000..."
BROWSER=none npm start &
FRONTEND_PID=$!

# Give frontend time to start
echo "⏱️  Waiting for frontend to initialize..."
sleep 5

# Check if frontend is running
if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "❌ Frontend failed to start!"
    exit 1
fi

echo "✅ Frontend App running (PID: $FRONTEND_PID)"
echo ""
echo "🎉 BibleBridge is now running!"
echo "=================================="
echo "🖥️  Frontend (React): http://localhost:3000"
echo "🔧 Backend (API):     http://localhost:3001"
echo "📚 API Docs:          http://localhost:3001/api-docs"
echo ""
echo "💡 Press Ctrl+C to stop all services"
echo ""

# Keep script running and wait for both processes
wait "$BACKEND_PID" "$FRONTEND_PID"