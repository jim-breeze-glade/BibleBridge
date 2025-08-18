/**
 * BibleComparison Component - Two-column comparison container
 */

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { BibleComparisonProps } from '../types';
import BibleTextPanel from './BibleTextPanel';

// Styled components
const ComparisonContainer = styled.div<{ theme: 'light' | 'dark' }>`
  display: flex;
  width: 100%;
  min-height: 600px;
  background-color: ${(props) => (props.theme === 'dark' ? '#1a202c' : '#f8f9fa')};
  border-radius: 12px;
  padding: 20px;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 15px;
    gap: 15px;
  }
`;

const PanelWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;

  @media (max-width: 768px) {
    min-height: 400px;
  }
`;

const TranslationSelector = styled.div`
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SelectorLabel = styled.label<{ theme: 'light' | 'dark' }>`
  font-size: 0.9em;
  font-weight: 500;
  color: ${(props) => (props.theme === 'dark' ? '#e2e8f0' : '#495057')};
  min-width: 80px;
`;

const TranslationSelect = styled.select<{ theme: 'light' | 'dark' }>`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid ${(props) => (props.theme === 'dark' ? '#4a5568' : '#ced4da')};
  border-radius: 6px;
  background-color: ${(props) => (props.theme === 'dark' ? '#2d3748' : '#ffffff')};
  color: ${(props) => (props.theme === 'dark' ? '#e2e8f0' : '#495057')};
  font-size: 0.9em;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &:hover {
    border-color: ${(props) => (props.theme === 'dark' ? '#6b7280' : '#adb5bd')};
  }
`;

const SyncIndicator = styled.div<{ theme: 'light' | 'dark'; synced: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 500;
  background-color: ${(props) => 
    props.synced 
      ? (props.theme === 'dark' ? '#059669' : '#10b981')
      : (props.theme === 'dark' ? '#dc2626' : '#ef4444')
  };
  color: white;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
`;

const VerseHighlight = styled.div<{ verse: string | null }>`
  ${(props) => props.verse && `
    background-color: rgba(0, 123, 255, 0.1);
    border-left: 3px solid #007bff;
    margin: 0 -8px;
    padding: 0 8px;
    border-radius: 4px;
  `}
`;

const ComparisonHeader = styled.div<{ theme: 'light' | 'dark' }>`
  margin-bottom: 20px;
  text-align: center;

  h3 {
    margin: 0 0 8px 0;
    font-size: 1.3em;
    font-weight: 600;
    color: ${(props) => (props.theme === 'dark' ? '#f7fafc' : '#2d3748')};
  }

  p {
    margin: 0;
    font-size: 0.9em;
    color: ${(props) => (props.theme === 'dark' ? '#a0aec0' : '#6c757d')};
  }
`;

const ErrorBoundaryWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 40px 20px;
  text-align: center;
  color: #dc3545;
  
  h4 {
    margin: 0 0 8px 0;
    font-size: 1.1em;
  }
  
  p {
    margin: 0;
    font-size: 0.9em;
    color: #6c757d;
  }
`;

// Available translations
const AVAILABLE_TRANSLATIONS = [
  { code: 'KJV', name: 'King James Version' },
  { code: 'NLT', name: 'New Living Translation' },
  { code: 'NIV', name: 'New International Version' },
  { code: 'CSB', name: 'Christian Standard Bible' },
];

const BibleComparison: React.FC<BibleComparisonProps> = ({
  leftChapterData,
  rightChapterData,
  leftTranslation,
  rightTranslation,
  loading,
  userSettings,
}) => {
  const [selectedVerse, setSelectedVerse] = useState<string | null>(null);
  const [leftError, setLeftError] = useState<string | null>(null);
  const [rightError, setRightError] = useState<string | null>(null);

  // Check if both panels are in sync
  const isPanelsSynced = useCallback(() => {
    if (!leftChapterData || !rightChapterData) {
      return false;
    }
    return (
      leftChapterData.book === rightChapterData.book &&
      leftChapterData.chapter === rightChapterData.chapter
    );
  }, [leftChapterData, rightChapterData]);

  // Handle verse click
  const handleVerseClick = useCallback((verse: string) => {
    setSelectedVerse(selectedVerse === verse ? null : verse);
    
    // Scroll to corresponding verse in other panel if needed
    const verseElements = document.querySelectorAll(`[data-verse="${verse}"]`);
    if (verseElements.length > 1) {
      verseElements.forEach((element, index) => {
        if (index > 0) { // Skip the clicked element
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      });
    }
  }, [selectedVerse]);

  // Handle translation change (would need to be connected to context)
  const handleTranslationChange = useCallback((side: 'left' | 'right', translation: string) => {
    // This would typically call a context action
    console.log(`Change ${side} translation to ${translation}`);
    // actions.setTranslations(
    //   side === 'left' ? translation : leftTranslation,
    //   side === 'right' ? translation : rightTranslation
    // );
  }, [leftTranslation, rightTranslation]);

  // Error boundary fallback
  const renderErrorFallback = (side: 'left' | 'right') => (
    <ErrorBoundaryWrapper>
      <h4>Something went wrong</h4>
      <p>Unable to load {side} panel. Please try refreshing the page.</p>
    </ErrorBoundaryWrapper>
  );

  // Get current chapter title
  const getChapterTitle = () => {
    if (leftChapterData) {
      return `${leftChapterData.book} ${leftChapterData.chapter}`;
    }
    if (rightChapterData) {
      return `${rightChapterData.book} ${rightChapterData.chapter}`;
    }
    return 'Bible Comparison';
  };

  return (
    <ComparisonContainer theme={userSettings.theme}>
      {/* Left Panel */}
      <PanelWrapper>
        <TranslationSelector>
          <SelectorLabel theme={userSettings.theme}>Left:</SelectorLabel>
          <TranslationSelect
            theme={userSettings.theme}
            value={leftTranslation}
            onChange={(e) => handleTranslationChange('left', e.target.value)}
          >
            {AVAILABLE_TRANSLATIONS.map((trans) => (
              <option key={trans.code} value={trans.code}>
                {trans.name}
              </option>
            ))}
          </TranslationSelect>
        </TranslationSelector>

        <SyncIndicator 
          theme={userSettings.theme} 
          synced={isPanelsSynced()}
        >
          {isPanelsSynced() ? '🔗' : '⚠️'} 
          {isPanelsSynced() ? 'Synced' : 'Different chapters'}
        </SyncIndicator>

        {leftError ? (
          renderErrorFallback('left')
        ) : (
          <BibleTextPanel
            chapterData={leftChapterData}
            translation={leftTranslation}
            loading={loading}
            error={leftError}
            userSettings={userSettings}
            onVerseClick={handleVerseClick}
          />
        )}
      </PanelWrapper>

      {/* Right Panel */}
      <PanelWrapper>
        <TranslationSelector>
          <SelectorLabel theme={userSettings.theme}>Right:</SelectorLabel>
          <TranslationSelect
            theme={userSettings.theme}
            value={rightTranslation}
            onChange={(e) => handleTranslationChange('right', e.target.value)}
          >
            {AVAILABLE_TRANSLATIONS.map((trans) => (
              <option key={trans.code} value={trans.code}>
                {trans.name}
              </option>
            ))}
          </TranslationSelect>
        </TranslationSelector>

        {rightError ? (
          renderErrorFallback('right')
        ) : (
          <BibleTextPanel
            chapterData={rightChapterData}
            translation={rightTranslation}
            loading={loading}
            error={rightError}
            userSettings={userSettings}
            onVerseClick={handleVerseClick}
          />
        )}
      </PanelWrapper>
    </ComparisonContainer>
  );
};

export default BibleComparison;