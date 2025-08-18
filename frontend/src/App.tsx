/**
 * Main App Component - BibleBridge React Application
 */

import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { BibleProvider, useBible } from './context/BibleContext';
import SettingsManager from './components/SettingsManager';
import BibleComparison from './components/BibleComparison';
import NavigationButtons from './components/NavigationButtons';
import BookSelector from './components/BookSelector';
import ChapterSelector from './components/ChapterSelector';
import TTSDebugPanel from './components/TTSDebugPanel';
import './App.css';

// Minimal global styles - theme variables are handled by theme.css
const GlobalStyle = createGlobalStyle`
  #root {
    height: 100%;
  }
`;

// Styled components
const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--theme-bg-primary) 0%, var(--theme-bg-secondary) 100%);
  color: var(--theme-text-primary);
  transition: background var(--theme-transition-normal) ease, color var(--theme-transition-normal) ease;
`;

const Header = styled.header`
  background-color: var(--theme-bg-primary);
  border-bottom: 1px solid var(--theme-border);
  box-shadow: var(--theme-shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background-color var(--theme-transition-normal) ease;
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  h1 {
    font-size: 1.8em;
    font-weight: 700;
    background: linear-gradient(135deg, var(--theme-accent), var(--theme-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }

  .logo-icon {
    font-size: 2em;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.5em;
    }
    
    .logo-icon {
      font-size: 1.8em;
    }
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    gap: 12px;
  }
`;


const MainContent = styled.main`
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const NavigationArea = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--theme-bg-primary);
  opacity: 0.95;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
`;

const LoadingContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  background-color: var(--theme-bg-primary);
  border-radius: 12px;
  box-shadow: var(--theme-shadow-xl);
  color: var(--theme-text-primary);
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid var(--theme-border);
  border-top: 4px solid var(--theme-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background-color: var(--theme-error);
  opacity: 0.1;
  border: 1px solid var(--theme-error);
  color: var(--theme-error);
  padding: 16px;
  border-radius: var(--theme-radius-lg);
  margin-bottom: 20px;
  text-align: center;
`;

// Main App Content Component
const AppContent: React.FC = () => {
  const { state, actions } = useBible();
  const [bookSelectorOpen, setBookSelectorOpen] = useState(false);
  const [chapterSelectorOpen, setChapterSelectorOpen] = useState(false);

  // Get current book metadata
  const currentBookMeta = state.books.find(book => book.name === state.currentBook);

  // Handle navigation
  const handlePrevious = () => {
    actions.navigateToPrevious();
  };

  const handleNext = () => {
    actions.navigateToNext();
  };

  // Check navigation availability
  const hasPrevious = Boolean(
    state.leftChapterData?.navigation?.previous || 
    state.rightChapterData?.navigation?.previous
  );
  
  const hasNext = Boolean(
    state.leftChapterData?.navigation?.next || 
    state.rightChapterData?.navigation?.next
  );


  // Handle book selection
  const handleBookSelect = (book: string) => {
    actions.setCurrentLocation(book, 1);
    setBookSelectorOpen(false);
  };

  // Handle chapter selection
  const handleChapterSelect = (chapter: number) => {
    actions.setCurrentLocation(state.currentBook, chapter);
    setChapterSelectorOpen(false);
  };

  // Show initial loading screen
  if (state.loading && !state.leftChapterData && !state.rightChapterData) {
    return (
      <LoadingOverlay>
        <LoadingContent>
          <Spinner />
          <div>Loading BibleBridge...</div>
        </LoadingContent>
      </LoadingOverlay>
    );
  }

  return (
    <AppContainer>
      <GlobalStyle />
      
      <Header>
        <HeaderContent>
          <Logo>
            <span className="logo-icon">📖</span>
            <h1>BibleBridge</h1>
          </Logo>
          
          <Controls>
            {/* Settings are now handled by SettingsManager */}
          </Controls>
        </HeaderContent>
      </Header>

      <MainContent>
        {state.error && (
          <ErrorMessage>
            {state.error}
          </ErrorMessage>
        )}

        <NavigationArea>
          <BookSelector
            books={state.books}
            currentBook={state.currentBook}
            onBookSelect={handleBookSelect}
            isOpen={bookSelectorOpen}
            onToggle={() => setBookSelectorOpen(!bookSelectorOpen)}
            theme={state.userSettings.theme}
          />
          
          <ChapterSelector
            currentBook={state.currentBook}
            currentChapter={state.currentChapter}
            totalChapters={currentBookMeta?.chapterCount || 1}
            onChapterSelect={handleChapterSelect}
            isOpen={chapterSelectorOpen}
            onToggle={() => setChapterSelectorOpen(!chapterSelectorOpen)}
            theme={state.userSettings.theme}
          />
        </NavigationArea>

        <BibleComparison
          leftChapterData={state.leftChapterData}
          rightChapterData={state.rightChapterData}
          leftTranslation={state.leftTranslation}
          rightTranslation={state.rightTranslation}
          loading={state.loading}
          userSettings={state.userSettings}
        />

        <NavigationButtons
          onPrevious={handlePrevious}
          onNext={handleNext}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          currentBook={state.currentBook}
          currentChapter={state.currentChapter}
          theme={state.userSettings.theme}
        />
      </MainContent>

      {/* TTS Debug Panel (development only) */}
      <TTSDebugPanel />
    </AppContainer>
  );
};

// Main App Component with Provider
const App: React.FC = () => {
  return (
    <BibleProvider>
      <SettingsManager>
        <AppContent />
      </SettingsManager>
    </BibleProvider>
  );
};

export default App;
