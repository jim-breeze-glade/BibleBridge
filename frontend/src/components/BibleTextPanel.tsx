/**
 * BibleTextPanel Component - Individual translation panel with verses
 */

import React, { useState, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { BibleTextPanelProps } from '../types';
import VerseText from './VerseText';

// RGB wave animation
const rgbWave = keyframes`
  0% { color: #ff0000; }
  16.666% { color: #ff8000; }
  33.333% { color: #ffff00; }
  50% { color: #00ff00; }
  66.666% { color: #0080ff; }
  83.333% { color: #8000ff; }
  100% { color: #ff0000; }
`;

// Styled components
const PanelContainer = styled.div<{ theme: 'light' | 'dark' }>`
  flex: 1;
  padding: 20px;
  border-radius: 8px;
  margin: 0 10px;
  background-color: ${(props) => (props.theme === 'dark' ? '#2d3748' : '#ffffff')};
  border: 1px solid ${(props) => (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    margin: 10px 0;
    padding: 15px;
  }
`;

const PanelHeader = styled.div<{ rgbWave: boolean; speed: number }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;

  h2 {
    margin: 0;
    font-size: 1.5em;
    font-weight: 600;
    ${(props) =>
      props.rgbWave &&
      `
      animation: ${rgbWave} ${6 / props.speed}s infinite;
    `}
  }
`;

const TranslationBadge = styled.span<{ theme: 'light' | 'dark' }>`
  background-color: ${(props) => (props.theme === 'dark' ? '#4a5568' : '#e2e8f0')};
  color: ${(props) => (props.theme === 'dark' ? '#e2e8f0' : '#2d3748')};
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 500;
`;

const ChapterInfo = styled.div`
  font-size: 0.9em;
  color: #6c757d;
  margin-bottom: 8px;
`;

const VerseCount = styled.div`
  font-size: 0.8em;
  color: #6c757d;
  margin-bottom: 16px;
  text-align: center;
`;

const VersesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  max-height: 600px;
  padding-right: 8px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #6c757d;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #dc3545;
  text-align: center;
  padding: 40px 20px;
`;

const ErrorIcon = styled.div`
  font-size: 3em;
  margin-bottom: 16px;
`;

const ErrorMessage = styled.div`
  font-size: 1.1em;
  margin-bottom: 8px;
  font-weight: 500;
`;

const ErrorDetails = styled.div`
  font-size: 0.9em;
  color: #6c757d;
`;

const RetryButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 16px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const PlayAllButton = styled.button<{ theme: 'light' | 'dark' }>`
  background-color: ${(props) => (props.theme === 'dark' ? '#4a5568' : '#f8f9fa')};
  color: ${(props) => (props.theme === 'dark' ? '#e2e8f0' : '#495057')};
  border: 1px solid ${(props) => (props.theme === 'dark' ? '#6b7280' : '#dee2e6')};
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.theme === 'dark' ? '#5a6578' : '#e9ecef')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BibleTextPanel: React.FC<BibleTextPanelProps> = ({
  chapterData,
  translation,
  loading,
  error,
  userSettings,
  onVerseClick,
}) => {
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  // Get translation name
  const getTranslationName = useCallback(() => {
    const translationMap: Record<string, string> = {
      KJV: 'King James Version',
      NLT: 'New Living Translation',
      NIV: 'New International Version',
      CSB: 'Christian Standard Bible',
    };
    return translationMap[translation] || translation;
  }, [translation]);

  // Handle play all chapter
  const handlePlayAll = useCallback(async () => {
    if (!chapterData?.verses || isPlayingAll || !userSettings.ttsEnabled) {
      return;
    }

    setIsPlayingAll(true);
    try {
      const chapterText = chapterData.verses
        .map((verse) => `Verse ${verse.verse}: ${verse.text}`)
        .join(' ');
      
      // This would need to be implemented in the TTS service
      // For now, we'll play the first few verses as a demo
      const firstFewVerses = chapterData.verses.slice(0, 5)
        .map((verse) => verse.text)
        .join(' ');
      
      // Play using the context actions (this would need to be passed as a prop)
      // await actions.playTTS(firstFewVerses);
      
      console.log('Playing chapter:', firstFewVerses.substring(0, 100) + '...');
    } catch (error) {
      console.error('Failed to play chapter:', error);
    } finally {
      setIsPlayingAll(false);
    }
  }, [chapterData, isPlayingAll, userSettings.ttsEnabled]);

  // Handle retry
  const handleRetry = useCallback(() => {
    window.location.reload(); // Simple retry - in production, you'd call a retry action
  }, []);

  // Render loading state
  if (loading) {
    return (
      <PanelContainer theme={userSettings.theme}>
        <LoadingContainer>
          <LoadingSpinner />
          <div>Loading {translation} chapter...</div>
        </LoadingContainer>
      </PanelContainer>
    );
  }

  // Render error state
  if (error) {
    return (
      <PanelContainer theme={userSettings.theme}>
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorMessage>Failed to load chapter</ErrorMessage>
          <ErrorDetails>{error}</ErrorDetails>
          <RetryButton onClick={handleRetry}>
            Retry
          </RetryButton>
        </ErrorContainer>
      </PanelContainer>
    );
  }

  // Render empty state
  if (!chapterData) {
    return (
      <PanelContainer theme={userSettings.theme}>
        <LoadingContainer>
          <div>No chapter data available</div>
        </LoadingContainer>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer theme={userSettings.theme}>
      <PanelHeader 
        rgbWave={userSettings.rgbWaveEnabled} 
        speed={userSettings.rgbWaveSpeed}
      >
        <div>
          <h2>{chapterData.book} {chapterData.chapter}</h2>
          <TranslationBadge theme={userSettings.theme}>
            {getTranslationName()}
          </TranslationBadge>
        </div>
        {userSettings.ttsEnabled && (
          <PlayAllButton
            theme={userSettings.theme}
            onClick={handlePlayAll}
            disabled={isPlayingAll}
            title="Play entire chapter"
          >
            {isPlayingAll ? '⏸️ Playing...' : '🔊 Play Chapter'}
          </PlayAllButton>
        )}
      </PanelHeader>

      <ChapterInfo>
        {chapterData.book} Chapter {chapterData.chapter} • {translation}
      </ChapterInfo>

      <VerseCount>
        {chapterData.verses.length} verses
      </VerseCount>

      <VersesContainer>
        {chapterData.verses.map((verse) => (
          <VerseText
            key={verse.verse}
            verse={verse}
            book={chapterData.book}
            chapter={chapterData.chapter}
            translation={translation}
            showRedLetters={userSettings.showRedLetters}
            redLetterBrightness={userSettings.redLetterBrightness}
            showPronunciations={userSettings.showPronunciations}
            pronunciationStyle={userSettings.pronunciationStyle}
            onVerseClick={onVerseClick}
          />
        ))}
      </VersesContainer>
    </PanelContainer>
  );
};

export default BibleTextPanel;