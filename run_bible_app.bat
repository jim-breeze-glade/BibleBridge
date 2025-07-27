@echo off
REM Bible Study App Launcher
REM This script activates the virtual environment and launches the Streamlit app

setlocal EnableDelayedExpansion

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

REM Display header
echo 📖 Bible Study Companion
echo ========================
echo.

REM Check if virtual environment exists
if not exist "bible_venv" (
    echo ❌ Virtual environment not found!
    echo Creating virtual environment...
    python -m venv bible_venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment. Make sure Python is installed.
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
)

REM Check if requirements are installed (simplified check for streamlit)
if not exist "bible_venv\Lib\site-packages\streamlit" (
    echo 📦 Installing dependencies...
    call bible_venv\Scripts\activate.bat
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies.
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call bible_venv\Scripts\activate.bat

REM Check if the Streamlit app file exists
if not exist "bible_study_app.py" (
    echo ❌ bible_study_app.py not found!
    echo Please ensure the app file is in the same directory as this script.
    pause
    exit /b 1
)

REM Launch Streamlit app
echo 🚀 Launching Bible Study App...
echo The app will open in your default browser.
echo Press Ctrl+C to stop the server.
echo.

REM Set Streamlit configuration for better experience
set STREAMLIT_SERVER_HEADLESS=true
set STREAMLIT_SERVER_PORT=8501
set STREAMLIT_SERVER_ADDRESS=localhost
set STREAMLIT_BROWSER_GATHER_USAGE_STATS=false

REM Check if port 8501 is available, use alternative if not
netstat -an | find "LISTENING" | find ":8501" >nul 2>&1
if !errorlevel! == 0 (
    set PORT=8502
    echo ⚠️  Port 8501 is busy, using port 8502
) else (
    set PORT=8501
)

echo 🌐 App will be available at http://localhost:!PORT!

REM Launch with optimized settings for Bible study
streamlit run bible_study_app.py ^
    --server.headless true ^
    --server.port !PORT! ^
    --server.address localhost ^
    --browser.gatherUsageStats false ^
    --theme.base dark ^
    --theme.primaryColor "#4CAF50" ^
    --theme.backgroundColor "#1e1e1e" ^
    --theme.secondaryBackgroundColor "#2d2d2d" ^
    --theme.textColor "#ffffff"

pause