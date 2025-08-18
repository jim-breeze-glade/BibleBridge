# BibleBridge Frontend

A modern React-based Bible reading application with side-by-side translation comparison, red letter text support, and biblical name pronunciation integration.

## Features

### 🔍 **Two-Column Translation Comparison**
- Side-by-side display of different Bible translations (KJV, NLT, NIV, CSB)
- Real-time translation switching
- Synchronized navigation between translations

### 📖 **Enhanced Text Rendering**
- **Red Letter Text**: Jesus' words highlighted in red (Matthew, Mark, Luke, John)
- Customizable text brightness and red letter intensity
- RGB wave text animation support
- Responsive typography with multiple font options

### 🎵 **Biblical Name Pronunciation**
- Hover tooltips showing phonetic pronunciations
- Text-to-speech integration for names and verses
- Support for IPA and phonetic notation styles

### 🧭 **Intelligent Navigation**
- Chapter-by-chapter navigation with cross-book support
- Book selector with testament organization and search
- Chapter grid selector with progress tracking
- Keyboard shortcuts (← → arrows, H/L keys)

### 🎨 **Modern UI/UX**
- Dark/Light theme support with smooth transitions
- Fully responsive design (mobile, tablet, desktop)
- Accessible components with proper focus management
- Loading states and error handling

### ⚙️ **Advanced Features**
- User position persistence
- Configurable settings (theme, fonts, brightness)
- Context-based state management
- Optimized performance with caching

## Architecture

### Component Hierarchy
```
App
├── BibleProvider (Context)
├── Header (Navigation & Theme Toggle)
└── MainContent
    ├── NavigationArea
    │   ├── BookSelector
    │   └── ChapterSelector
    ├── BibleComparison
    │   ├── BibleTextPanel (Left)
    │   │   └── VerseText[]
    │   └── BibleTextPanel (Right)
    │       └── VerseText[]
    └── NavigationButtons
```

### Key Components

#### **BibleProvider (Context API)**
- Global state management for Bible reading session
- API integration and data fetching
- User settings and position persistence
- Error handling and loading states

#### **VerseText Component**
- Individual verse rendering with formatting
- Red letter text detection and highlighting
- Pronunciation tooltips and TTS integration
- Responsive text sizing and theme support

#### **BibleTextPanel Component**
- Translation-specific chapter display
- Scroll synchronization between panels
- Loading states and error handling
- Header with translation info and controls

#### **Navigation Components**
- **BookSelector**: Testament-organized book selection with search
- **ChapterSelector**: Grid-based chapter navigation with progress
- **NavigationButtons**: Previous/Next with keyboard support

## Technology Stack

### Core Technologies
- **React 18** with TypeScript
- **Styled Components** for CSS-in-JS styling
- **Context API** for state management
- **Axios** for HTTP requests

### Development Tools
- **Create React App** for project setup
- **TypeScript** for type safety
- **ESLint** for code quality

## Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- BibleBridge Backend API running on port 3001

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   # .env file
   REACT_APP_API_URL=http://localhost:3001
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

The app will open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## File Structure

```
src/
├── components/           # React components
│   ├── BibleComparison.tsx
│   ├── BibleTextPanel.tsx
│   ├── BookSelector.tsx
│   ├── ChapterSelector.tsx
│   ├── NavigationButtons.tsx
│   └── VerseText.tsx
├── context/             # React Context providers
│   └── BibleContext.tsx
├── services/            # API and external services
│   └── api.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder with optimized bundles.

### `npm run eject`
**Note: this is a one-way operation!** Removes Create React App abstraction.

## Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
- [TypeScript documentation](https://www.typescriptlang.org/)
- [Styled Components documentation](https://styled-components.com/)

---

This project is part of the BibleBridge application suite. See the main project repository for more information.