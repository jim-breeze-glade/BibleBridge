#!/bin/bash

# BibleBridge App Launcher
# This script activates the virtual environment and launches the Streamlit app

set -e  # Exit on any error

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📖 BibleBridge: Bible Version Comparison${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "biblebridge_venv" ]; then
    echo -e "${RED}❌ Virtual environment not found!${NC}"
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv biblebridge_venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Check if requirements are installed
if [ ! -f "biblebridge_venv/lib/python*/site-packages/streamlit/__init__.py" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    source biblebridge_venv/bin/activate
    pip install -r requirements.txt
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}🔄 Activating virtual environment...${NC}"
source biblebridge_venv/bin/activate

# Check if the Streamlit app file exists
if [ ! -f "biblebridge_app.py" ]; then
    echo -e "${RED}❌ biblebridge_app.py not found!${NC}"
    echo -e "${RED}Please ensure the app file is in the same directory as this script.${NC}"
    exit 1
fi

# Launch Streamlit app
echo -e "${GREEN}🚀 Launching BibleBridge App...${NC}"
echo -e "${BLUE}The app will open in your default browser.${NC}"
echo -e "${BLUE}Press Ctrl+C to stop the server.${NC}"
echo ""

# Set Streamlit configuration for better experience
export STREAMLIT_SERVER_HEADLESS=true
export STREAMLIT_SERVER_PORT=8501
export STREAMLIT_SERVER_ADDRESS=localhost
export STREAMLIT_BROWSER_GATHER_USAGE_STATS=false

# Check if port 8501 is available, use alternative if not
if lsof -Pi :8501 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PORT=8502
    echo -e "${YELLOW}⚠️  Port 8501 is busy, using port 8502${NC}"
else
    PORT=8501
fi

echo -e "${BLUE}🌐 App will be available at http://localhost:$PORT${NC}"

# Launch with optimized settings for Bible study
streamlit run biblebridge_app.py \
    --server.headless true \
    --server.port $PORT \
    --server.address localhost \
    --browser.gatherUsageStats false \
    --theme.base dark \
    --theme.primaryColor "#4CAF50" \
    --theme.backgroundColor "#1e1e1e" \
    --theme.secondaryBackgroundColor "#2d2d2d" \
    --theme.textColor "#ffffff"