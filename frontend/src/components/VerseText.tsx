/**
 * VerseText Component - Individual verse with red letter text support and enhanced pronunciation
 */

import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { VerseTextProps, RED_LETTER_BOOKS } from '../types';
import { useBible } from '../context/BibleContext';
import BiblicalName from './BiblicalName';
import { pronunciationService } from '../services/pronunciationService';

// Styled components
const VerseContainer = styled.div`
  margin-bottom: 8px;
  font-family: var(--theme-font-family);
  font-size: var(--theme-font-size);
  line-height: var(--theme-line-height);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--theme-radius-sm);
  transition: background-color var(--theme-transition-normal) ease;

  &:hover {
    background-color: var(--theme-verse-hover-bg);
  }
`;

const VerseNumber = styled.span`
  font-weight: bold;
  color: var(--theme-text-muted);
  margin-right: 8px;
  font-size: 0.9em;
  vertical-align: super;
`;

const VerseContent = styled.span`
  opacity: var(--theme-text-brightness);
  transition: opacity var(--theme-transition-normal) ease;
`;

const RedLetterText = styled.span`
  color: var(--theme-red-letter-color);
  opacity: var(--theme-red-letter-brightness);
  font-weight: 500;
`;


const AudioButton = styled.button`
  background: none;
  border: none;
  color: var(--theme-accent);
  cursor: pointer;
  font-size: 12px;
  margin-left: 4px;
  padding: 2px 4px;
  border-radius: var(--theme-radius-sm);
  transition: background-color var(--theme-transition-normal) ease;

  &:hover {
    background-color: var(--theme-verse-hover-bg);
  }

  &:disabled {
    color: var(--theme-text-muted);
    cursor: not-allowed;
  }
`;

// Red letter text patterns (common Jesus quotes in Gospels)
const RED_LETTER_PATTERNS = [
  // Direct speech patterns
  /(?:Jesus\s+(?:said|answered|replied|asked|told|spoke|cried|called))[^"]*["']([^"']+)["']/gi,
  /(?:He\s+(?:said|answered|replied|asked|told|spoke|cried|called))[^"]*["']([^"']+)["']/gi,
  /(?:And\s+(?:he\s+)?(?:Jesus\s+)?(?:said|answered|replied|asked|told|spoke|cried|called))[^"]*["']([^"']+)["']/gi,
  
  // Quote patterns without attribution
  /["']([^"']*(?:I\s+am|Follow\s+me|Come|Go|Blessed|Verily|Truly|Father|Heaven|Kingdom)[^"']*)["']/gi,
  
  // Common Gospel phrases
  /["']([^"']*(?:Repent|Believe|Fear\s+not|Peace\s+be|Love\s+one\s+another|Take\s+up\s+your\s+cross)[^"']*)["']/gi,
];

interface VerseTextComponent extends React.FC<VerseTextProps> {}

const VerseText: VerseTextComponent = ({
  verse,
  book,
  chapter,
  translation,
  showRedLetters,
  redLetterBrightness,
  showPronunciations,
  pronunciationStyle,
  onVerseClick,
}) => {
  const { state, actions } = useBible();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Check if this book supports red letter text
  const isGospel = useMemo(() => RED_LETTER_BOOKS.includes(book), [book]);

  // Process text for red letters and pronunciations
  const processedText = useMemo(() => {
    let text = verse.text;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Only process red letters for Gospel books
    if (showRedLetters && isGospel) {
      for (const pattern of RED_LETTER_PATTERNS) {
        let match;
        pattern.lastIndex = 0; // Reset regex lastIndex

        while ((match = pattern.exec(text)) !== null) {
          const fullMatch = match[0];
          const quotedText = match[1];
          const startIndex = match.index;
          const endIndex = startIndex + fullMatch.length;

          // Add text before the match
          if (startIndex > lastIndex) {
            elements.push(text.substring(lastIndex, startIndex));
          }

          // Add red letter text
          elements.push(
            <RedLetterText key={`red-${startIndex}`} brightness={redLetterBrightness}>
              {fullMatch}
            </RedLetterText>
          );

          lastIndex = endIndex;
        }
      }
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    // If no red letter text was found, return the original text with pronunciations
    if (elements.length === 0) {
      elements.push(text);
    }

    // Process pronunciations if enabled
    if (showPronunciations && Object.keys(state.pronunciations).length > 0) {
      return processWithPronunciations(elements);
    }

    return elements;
  }, [verse.text, showRedLetters, isGospel, redLetterBrightness, showPronunciations, state.pronunciations, pronunciationStyle]);

  // Process text elements with biblical name pronunciation hints
  const processWithPronunciations = (elements: React.ReactNode[]): React.ReactNode[] => {
    const processedElements: React.ReactNode[] = [];

    elements.forEach((element, index) => {
      if (typeof element === 'string') {
        const words = element.split(/(\s+)/);
        const processedWords = words.map((word, wordIndex) => {
          const cleanWord = word.replace(/[^\w]/g, '');
          const pronunciation = state.pronunciations[cleanWord];

          // Check if word has pronunciation data
          if (pronunciation && word.trim()) {
            return (
              <BiblicalName
                key={`${index}-${wordIndex}-${cleanWord}`}
                name={cleanWord}
                pronunciation={pronunciation}
                pronunciationStyle={pronunciationStyle}
                showTooltip={true}
                onClick={handleBiblicalNameClick}
              >
                {word}
              </BiblicalName>
            );
          }
          
          return <span key={`${index}-${wordIndex}`}>{word}</span>;
        });

        processedElements.push(
          <span key={index}>
            {processedWords}
          </span>
        );
      } else {
        processedElements.push(element);
      }
    });

    return processedElements;
  };

  // Handle verse click
  const handleVerseClick = useCallback(() => {
    onVerseClick?.(verse.verse);
  }, [verse.verse, onVerseClick]);

  // Handle biblical name click
  const handleBiblicalNameClick = useCallback(
    (name: string) => {
      console.log(`Clicked biblical name: ${name}`);
      // Future enhancement: could show detailed information about the biblical figure
    },
    []
  );

  // Handle verse TTS
  const handlePlayVerse = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (!state.userSettings.ttsEnabled || isPlayingAudio) {
        return;
      }

      setIsPlayingAudio(true);
      try {
        await actions.playTTS(verse.text);
      } catch (error) {
        console.error('Failed to play verse:', error);
      } finally {
        setIsPlayingAudio(false);
      }
    },
    [state.userSettings.ttsEnabled, isPlayingAudio, actions, verse.text]
  );

  return (
    <VerseContainer
      onClick={handleVerseClick}
      data-verse={verse.verse}
      data-book={book}
      data-chapter={chapter}
      data-translation={translation}
    >
      <VerseNumber>{verse.verse}</VerseNumber>
      <VerseContent>
        {processedText}
      </VerseContent>
      {state.userSettings.ttsEnabled && (
        <AudioButton
          onClick={handlePlayVerse}
          disabled={isPlayingAudio}
          title={`Play verse ${verse.verse}`}
        >
          {isPlayingAudio ? '⏸️' : '🔊'}
        </AudioButton>
      )}
    </VerseContainer>
  );
};

export default VerseText;