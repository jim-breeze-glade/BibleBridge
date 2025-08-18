#!/bin/bash

# BibleBridge Backend Startup Script
# This script starts both the TTS service and the backend API

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js version: $(node --version)"
}

# Check if Python is installed
check_python() {
    if ! command -v python3 &> /dev/null; then
        print_warning "Python3 is not installed. TTS service will not be available."
        return 1
    fi
    
    print_success "Python version: $(python3 --version)"
    return 0
}

# Check if required directories exist
check_directories() {
    print_status "Checking required directories..."
    
    if [ ! -d "../translations" ]; then
        print_error "Translations directory not found. Please ensure ../translations exists."
        exit 1
    fi
    
    if [ ! -d "../data/pronunciations" ]; then
        print_error "Pronunciations directory not found. Please ensure ../data/pronunciations exists."
        exit 1
    fi
    
    # Create user data directory if it doesn't exist
    mkdir -p "./data/users"
    
    print_success "All required directories found"
}

# Install dependencies if needed
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_status "Installing Node.js dependencies..."
        npm install
        print_success "Dependencies installed"
    else
        print_status "Node.js dependencies already installed"
    fi
}

# Build TypeScript if needed
build_typescript() {
    if [ ! -d "dist" ] || [ "src" -nt "dist" ]; then
        print_status "Building TypeScript..."
        npm run build
        print_success "TypeScript built successfully"
    else
        print_status "TypeScript already built"
    fi
}

# Start TTS service in background
start_tts_service() {
    if check_python; then
        print_status "Starting TTS service..."
        
        # Check if TTS service is already running
        if curl -s http://localhost:5001/api/pronunciation/health &> /dev/null; then
            print_success "TTS service is already running"
            return 0
        fi
        
        # Try to start TTS service
        if [ -f "../src/tts/piper_api_server.py" ]; then
            cd ../src/tts
            python3 piper_api_server.py &
            TTS_PID=$!
            cd - > /dev/null
            
            # Wait a moment and check if it started
            sleep 3
            if curl -s http://localhost:5001/api/pronunciation/health &> /dev/null; then
                print_success "TTS service started (PID: $TTS_PID)"
                echo $TTS_PID > .tts_pid
                return 0
            else
                print_warning "TTS service failed to start properly"
                return 1
            fi
        else
            print_warning "TTS service script not found. TTS features will be disabled."
            return 1
        fi
    else
        print_warning "Python not available. TTS features will be disabled."
        return 1
    fi
}

# Start the backend API
start_backend() {
    print_status "Starting BibleBridge Backend API..."
    
    # Determine if this is development or production
    if [ "${NODE_ENV:-development}" = "production" ]; then
        print_status "Starting in production mode..."
        npm start
    else
        print_status "Starting in development mode..."
        npm run dev
    fi
}

# Cleanup function
cleanup() {
    print_status "Shutting down services..."
    
    # Kill TTS service if we started it
    if [ -f ".tts_pid" ]; then
        TTS_PID=$(cat .tts_pid)
        if kill -0 $TTS_PID 2>/dev/null; then
            print_status "Stopping TTS service (PID: $TTS_PID)..."
            kill $TTS_PID
        fi
        rm -f .tts_pid
    fi
    
    print_success "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    print_status "Starting BibleBridge Backend..."
    print_status "==============================="
    
    check_node
    check_directories
    install_dependencies
    build_typescript
    start_tts_service
    
    print_success "All services initialized"
    print_status "==============================="
    print_status "API will be available at: http://localhost:${PORT:-3000}"
    print_status "API Documentation: http://localhost:${PORT:-3000}/api-docs"
    print_status "Health Check: http://localhost:${PORT:-3000}/health"
    print_status "==============================="
    print_status "Press Ctrl+C to stop all services"
    print_status ""
    
    start_backend
}

# Run main function
main "$@"