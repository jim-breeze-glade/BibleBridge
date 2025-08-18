/**
 * NavigationButtons Component - Previous/Next chapter navigation
 */

import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { NavigationButtonsProps } from '../types';

// Styled components
const NavigationContainer = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: ${(props) => (props.theme === 'dark' ? '#2d3748' : '#ffffff')};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
  border: 1px solid ${(props) => (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')};

  @media (max-width: 768px) {
    padding: 15px;
    margin: 15px 0;
    flex-direction: column;
    gap: 12px;
  }
`;

const NavigationButton = styled.button<{ 
  theme: 'light' | 'dark'; 
  disabled: boolean;
  direction: 'previous' | 'next' 
}>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background-color: ${(props) => 
    props.disabled 
      ? (props.theme === 'dark' ? '#4a5568' : '#f8f9fa')
      : (props.theme === 'dark' ? '#4c51bf' : '#007bff')
  };
  color: ${(props) => 
    props.disabled 
      ? (props.theme === 'dark' ? '#a0aec0' : '#6c757d')
      : '#ffffff'
  };
  border: none;
  border-radius: 8px;
  font-size: 0.95em;
  font-weight: 500;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: center;

  &:hover:not(:disabled) {
    background-color: ${(props) => (props.theme === 'dark' ? '#5a67d8' : '#0056b3')};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  .arrow {
    font-size: 1.2em;
    transition: transform 0.2s ease;
  }

  &:hover:not(:disabled) .arrow {
    transform: ${(props) => 
      props.direction === 'previous' 
        ? 'translateX(-2px)' 
        : 'translateX(2px)'
    };
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 14px 20px;
  }
`;

const CurrentLocation = styled.div<{ theme: 'light' | 'dark' }>`
  text-align: center;
  flex: 1;
  margin: 0 20px;

  h3 {
    margin: 0 0 4px 0;
    font-size: 1.4em;
    font-weight: 600;
    color: ${(props) => (props.theme === 'dark' ? '#f7fafc' : '#2d3748')};
  }

  p {
    margin: 0;
    font-size: 0.9em;
    color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#6c757d')};
  }

  @media (max-width: 768px) {
    margin: 0;
    order: -1;
  }
`;

const ChapterInfo = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.85em;
  color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#6c757d')};

  @media (max-width: 768px) {
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const ChapterBadge = styled.span<{ theme: 'light' | 'dark' }>`
  background-color: ${(props) => (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')};
  color: ${(props) => (props.theme === 'dark' ? '#e2e8f0' : '#495057')};
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.8em;
`;

const ProgressIndicator = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8em;
  color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#6c757d')};
`;

const ProgressDot = styled.span<{ active: boolean; theme: 'light' | 'dark' }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${(props) => 
    props.active 
      ? '#007bff'
      : (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')
  };
  transition: background-color 0.2s ease;
`;

const KeyboardHint = styled.div<{ theme: 'light' | 'dark' }>`
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75em;
  color: ${(props) => (props.theme === 'dark' ? '#718096' : '#8e9aaf')};
  text-align: center;
  
  kbd {
    background-color: ${(props) => (props.theme === 'dark' ? '#4a5568' : '#f8f9fa')};
    border: 1px solid ${(props) => (props.theme === 'dark' ? '#6b7280' : '#dee2e6')};
    border-radius: 3px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 0.9em;
  }
`;

// Bible book metadata for progress calculation
const BIBLE_BOOKS = [
  { name: 'Genesis', chapters: 50 }, { name: 'Exodus', chapters: 40 }, { name: 'Leviticus', chapters: 27 },
  { name: 'Numbers', chapters: 36 }, { name: 'Deuteronomy', chapters: 34 }, { name: 'Joshua', chapters: 24 },
  // ... (truncated for brevity - would include all 66 books)
];

const NavigationButtons: React.FC<NavigationButtonsProps & { theme: 'light' | 'dark' }> = ({
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  currentBook,
  currentChapter,
  theme = 'light',
}) => {
  // Get book information
  const bookInfo = useMemo(() => {
    return BIBLE_BOOKS.find(book => book.name === currentBook) || { name: currentBook, chapters: 1 };
  }, [currentBook]);

  // Calculate reading progress
  const progress = useMemo(() => {
    const currentBookIndex = BIBLE_BOOKS.findIndex(book => book.name === currentBook);
    if (currentBookIndex === -1) return { book: 0, overall: 0 };

    const bookProgress = (currentChapter / bookInfo.chapters) * 100;
    
    const totalChaptersBefore = BIBLE_BOOKS.slice(0, currentBookIndex)
      .reduce((sum, book) => sum + book.chapters, 0);
    const totalChapters = BIBLE_BOOKS.reduce((sum, book) => sum + book.chapters, 0);
    const overallProgress = ((totalChaptersBefore + currentChapter) / totalChapters) * 100;

    return { book: bookProgress, overall: overallProgress };
  }, [currentBook, currentChapter, bookInfo]);

  // Handle keyboard navigation
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'h':
        if (hasPrevious) {
          event.preventDefault();
          onPrevious();
        }
        break;
      case 'ArrowRight':
      case 'l':
        if (hasNext) {
          event.preventDefault();
          onNext();
        }
        break;
    }
  }, [hasPrevious, hasNext, onPrevious, onNext]);

  // Add keyboard event listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Generate progress dots
  const generateProgressDots = () => {
    const totalDots = Math.min(bookInfo.chapters, 20); // Max 20 dots for visual clarity
    const dotsPerChapter = bookInfo.chapters <= 20 ? 1 : bookInfo.chapters / 20;
    
    return Array.from({ length: totalDots }, (_, index) => {
      const representedChapter = Math.floor(index * dotsPerChapter) + 1;
      const isActive = currentChapter >= representedChapter;
      
      return (
        <ProgressDot 
          key={index} 
          active={isActive} 
          theme={theme}
          title={`Chapter ${representedChapter}`}
        />
      );
    });
  };

  return (
    <NavigationContainer theme={theme} style={{ position: 'relative' }}>
      <NavigationButton
        theme={theme}
        disabled={!hasPrevious}
        direction="previous"
        onClick={onPrevious}
        title="Previous chapter (← or H)"
      >
        <span className="arrow">←</span>
        Previous
      </NavigationButton>

      <CurrentLocation theme={theme}>
        <h3>{currentBook} {currentChapter}</h3>
        <ChapterInfo theme={theme}>
          <ChapterBadge theme={theme}>
            Chapter {currentChapter} of {bookInfo.chapters}
          </ChapterBadge>
          <ProgressIndicator theme={theme}>
            Progress: {Math.round(progress.book)}%
            <div style={{ display: 'flex', gap: '2px', marginLeft: '8px' }}>
              {generateProgressDots()}
            </div>
          </ProgressIndicator>
        </ChapterInfo>
        <p>Bible Progress: {Math.round(progress.overall)}%</p>
      </CurrentLocation>

      <NavigationButton
        theme={theme}
        disabled={!hasNext}
        direction="next"
        onClick={onNext}
        title="Next chapter (→ or L)"
      >
        Next
        <span className="arrow">→</span>
      </NavigationButton>

      <KeyboardHint theme={theme}>
        <kbd>←</kbd> Previous • <kbd>→</kbd> Next
      </KeyboardHint>
    </NavigationContainer>
  );
};

export default NavigationButtons;