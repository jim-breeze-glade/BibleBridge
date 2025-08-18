/**
 * ChapterSelector Component - Chapter grid selection with responsive design
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { ChapterSelectorProps } from '../types';

// Styled components
const SelectorContainer = styled.div<{ theme: 'light' | 'dark' }>`
  position: relative;
  display: inline-block;
  min-width: 150px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SelectorButton = styled.button<{ theme: 'light' | 'dark'; isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background-color: ${(props) => (props.theme === 'dark' ? '#2d3748' : '#ffffff')};
  border: 1px solid ${(props) => 
    props.isOpen 
      ? '#007bff'
      : (props.theme === 'dark' ? '#4a5568' : '#ced4da')
  };
  border-radius: 8px;
  color: ${(props) => (props.theme === 'dark' ? '#f7fafc' : '#2d3748')};
  font-size: 1em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${(props) => 
    props.isOpen 
      ? '0 0 0 2px rgba(0, 123, 255, 0.25)'
      : '0 2px 4px rgba(0, 0, 0, 0.1)'
  };

  &:hover {
    border-color: ${(props) => (props.theme === 'dark' ? '#6b7280' : '#adb5bd')};
  }

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  .arrow {
    transition: transform 0.2s ease;
    transform: ${(props) => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  }
`;

const ChapterInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  text-align: left;
`;

const ChapterNumber = styled.div`
  font-size: 1.1em;
  font-weight: 600;
`;

const ChapterDetails = styled.div<{ theme: 'light' | 'dark' }>`
  font-size: 0.8em;
  color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#6c757d')};
  margin-top: 2px;
`;

const DropdownContainer = styled.div<{ theme: 'light' | 'dark'; isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: ${(props) => (props.theme === 'dark' ? '#2d3748' : '#ffffff')};
  border: 1px solid ${(props) => (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')};
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-top: 4px;
  max-height: 400px;
  overflow-y: auto;
  display: ${(props) => (props.isOpen ? 'block' : 'none')};
  padding: 16px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => (props.theme === 'dark' ? '#4a5568' : '#f1f1f1')};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => (props.theme === 'dark' ? '#6b7280' : '#c1c1c1')};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(props) => (props.theme === 'dark' ? '#9ca3af' : '#a8a8a8')};
  }
`;

const DropdownHeader = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${(props) => (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')};

  h4 {
    margin: 0;
    font-size: 1.1em;
    font-weight: 600;
    color: ${(props) => (props.theme === 'dark' ? '#f7fafc' : '#2d3748')};
  }

  span {
    font-size: 0.85em;
    color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#6c757d')};
  }
`;

const ChapterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fit, minmax(45px, 1fr));
    gap: 6px;
  }
`;

const ChapterButton = styled.button<{ 
  theme: 'light' | 'dark'; 
  isSelected: boolean; 
  isHighlighted: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 44px;
  padding: 8px;
  background-color: ${(props) => {
    if (props.isSelected) {
      return props.theme === 'dark' ? '#4c51bf' : '#007bff';
    }
    if (props.isHighlighted) {
      return props.theme === 'dark' ? '#3c4043' : '#f8f9fa';
    }
    return props.theme === 'dark' ? '#1a202c' : '#f8f9fa';
  }};
  border: 1px solid ${(props) => {
    if (props.isSelected) {
      return props.theme === 'dark' ? '#5a67d8' : '#0056b3';
    }
    return props.theme === 'dark' ? '#4a5568' : '#e2e8f0';
  }};
  border-radius: 6px;
  color: ${(props) => {
    if (props.isSelected) {
      return '#ffffff';
    }
    return props.theme === 'dark' ? '#f7fafc' : '#2d3748';
  }};
  font-size: 0.9em;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: ${(props) => {
      if (props.isSelected) {
        return props.theme === 'dark' ? '#5a67d8' : '#0056b3';
      }
      return props.theme === 'dark' ? '#3c4043' : '#e9ecef';
    }};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.4);
  }

  @media (max-width: 480px) {
    height: 40px;
    font-size: 0.85em;
  }
`;

const QuickJump = styled.div<{ theme: 'light' | 'dark' }>`
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const QuickJumpInput = styled.input<{ theme: 'light' | 'dark' }>`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${(props) => (props.theme === 'dark' ? '#4a5568' : '#ced4da')};
  border-radius: 6px;
  background-color: ${(props) => (props.theme === 'dark' ? '#1a202c' : '#ffffff')};
  color: ${(props) => (props.theme === 'dark' ? '#f7fafc' : '#2d3748')};
  font-size: 0.9em;
  text-align: center;
  width: 80px;

  &::placeholder {
    color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#8e9aaf')};
  }

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const QuickJumpButton = styled.button<{ theme: 'light' | 'dark' }>`
  padding: 8px 12px;
  background-color: ${(props) => (props.theme === 'dark' ? '#4a5568' : '#6c757d')};
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.85em;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.theme === 'dark' ? '#5a6578' : '#545b62')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProgressBar = styled.div<{ theme: 'light' | 'dark' }>`
  width: 100%;
  height: 4px;
  background-color: ${(props) => (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')};
  border-radius: 2px;
  margin-bottom: 12px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  border-radius: 2px;
  transition: width 0.3s ease;
  width: ${(props) => props.progress}%;
`;

const ChapterSelector: React.FC<ChapterSelectorProps & { theme: 'light' | 'dark' }> = ({
  currentBook,
  currentChapter,
  totalChapters,
  onChapterSelect,
  isOpen,
  onToggle,
  theme = 'light',
}) => {
  const [quickJumpValue, setQuickJumpValue] = useState('');
  const [highlightedChapter, setHighlightedChapter] = useState(currentChapter);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate chapter array
  const chapters = useMemo(() => 
    Array.from({ length: totalChapters }, (_, i) => i + 1),
    [totalChapters]
  );

  // Calculate reading progress
  const progress = useMemo(() => 
    (currentChapter / totalChapters) * 100,
    [currentChapter, totalChapters]
  );

  // Handle chapter selection
  const handleChapterSelect = useCallback((chapter: number) => {
    onChapterSelect(chapter);
    onToggle();
    setHighlightedChapter(chapter);
  }, [onChapterSelect, onToggle]);

  // Handle quick jump
  const handleQuickJump = useCallback(() => {
    const chapter = parseInt(quickJumpValue);
    if (chapter >= 1 && chapter <= totalChapters) {
      handleChapterSelect(chapter);
      setQuickJumpValue('');
    }
  }, [quickJumpValue, totalChapters, handleChapterSelect]);

  // Handle quick jump input change
  const handleQuickJumpChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setQuickJumpValue(value);
  }, []);

  // Handle quick jump key press
  const handleQuickJumpKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickJump();
    }
  }, [handleQuickJump]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setHighlightedChapter(prev => 
          prev < totalChapters ? prev + 1 : 1
        );
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setHighlightedChapter(prev => 
          prev > 1 ? prev - 1 : totalChapters
        );
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedChapter(prev => {
          const newChapter = prev + 10; // Move down a row (assuming ~10 columns)
          return newChapter <= totalChapters ? newChapter : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedChapter(prev => {
          const newChapter = prev - 10; // Move up a row
          return newChapter >= 1 ? newChapter : prev;
        });
        break;
      case 'Enter':
        e.preventDefault();
        handleChapterSelect(highlightedChapter);
        break;
      case 'Escape':
        e.preventDefault();
        onToggle();
        break;
      case 'Home':
        e.preventDefault();
        setHighlightedChapter(1);
        break;
      case 'End':
        e.preventDefault();
        setHighlightedChapter(totalChapters);
        break;
    }
  }, [isOpen, totalChapters, highlightedChapter, handleChapterSelect, onToggle]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  // Scroll highlighted chapter into view
  useEffect(() => {
    if (isOpen && gridRef.current && highlightedChapter !== currentChapter) {
      const highlightedButton = gridRef.current.querySelector(
        `[data-chapter="${highlightedChapter}"]`
      ) as HTMLElement;
      
      if (highlightedButton) {
        highlightedButton.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedChapter, isOpen, currentChapter]);

  // Reset highlighted chapter when opened
  useEffect(() => {
    if (isOpen) {
      setHighlightedChapter(currentChapter);
    }
  }, [isOpen, currentChapter]);

  return (
    <SelectorContainer 
      theme={theme} 
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <SelectorButton
        theme={theme}
        isOpen={isOpen}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <ChapterInfo>
          <ChapterNumber>Chapter {currentChapter}</ChapterNumber>
          <ChapterDetails theme={theme}>
            {currentBook} • {totalChapters} chapters
          </ChapterDetails>
        </ChapterInfo>
        <span className="arrow">▼</span>
      </SelectorButton>

      <DropdownContainer theme={theme} isOpen={isOpen}>
        <DropdownHeader theme={theme}>
          <h4>{currentBook} Chapters</h4>
          <span>{Math.round(progress)}% complete</span>
        </DropdownHeader>

        <ProgressBar theme={theme}>
          <ProgressFill progress={progress} />
        </ProgressBar>

        <QuickJump theme={theme}>
          <QuickJumpInput
            theme={theme}
            type="text"
            placeholder="Go to..."
            value={quickJumpValue}
            onChange={handleQuickJumpChange}
            onKeyPress={handleQuickJumpKeyPress}
            maxLength={3}
          />
          <QuickJumpButton
            theme={theme}
            onClick={handleQuickJump}
            disabled={!quickJumpValue || 
              parseInt(quickJumpValue) < 1 || 
              parseInt(quickJumpValue) > totalChapters
            }
          >
            Go
          </QuickJumpButton>
        </QuickJump>

        <ChapterGrid ref={gridRef}>
          {chapters.map((chapter) => (
            <ChapterButton
              key={chapter}
              theme={theme}
              isSelected={chapter === currentChapter}
              isHighlighted={chapter === highlightedChapter}
              data-chapter={chapter}
              onClick={() => handleChapterSelect(chapter)}
              title={`Go to Chapter ${chapter}`}
            >
              {chapter}
            </ChapterButton>
          ))}
        </ChapterGrid>
      </DropdownContainer>
    </SelectorContainer>
  );
};

export default ChapterSelector;