/**
 * PronunciationTooltip Component
 * Reusable tooltip for showing phonetic/IPA pronunciations with audio playback
 */

import React, { useCallback, useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  PronunciationTooltipProps,
  PRONUNCIATION_COLORS,
  TTS_CONFIG,
} from '../types';
import { pronunciationService } from '../services/pronunciationService';

// Animations
const fadeInScale = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const buttonPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(0, 123, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); }
`;

// Styled Components
const TooltipContainer = styled.div<{ 
  $position: 'top' | 'bottom' | 'left' | 'right';
  $visible: boolean;
}>`
  position: absolute;
  background: ${PRONUNCIATION_COLORS.tooltip.background};
  color: ${PRONUNCIATION_COLORS.tooltip.text};
  border: 1px solid ${PRONUNCIATION_COLORS.tooltip.border};
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1000;
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  transition: all 0.2s ease;
  animation: ${props => props.$visible ? fadeInScale : 'none'} 0.3s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  max-width: 280px;

  ${props => {
    const arrowSize = '6px';
    const arrowColor = PRONUNCIATION_COLORS.tooltip.background;
    const borderColor = PRONUNCIATION_COLORS.tooltip.border;
    
    switch (props.$position) {
      case 'top':
        return css`
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          
          &::before {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: ${arrowSize} solid transparent;
            border-top-color: ${borderColor};
          }
          
          &::after {
            content: '';
            position: absolute;
            top: calc(100% - 1px);
            left: 50%;
            transform: translateX(-50%);
            border: ${arrowSize} solid transparent;
            border-top-color: ${arrowColor};
          }
        `;
      case 'bottom':
        return css`
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          
          &::before {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: ${arrowSize} solid transparent;
            border-bottom-color: ${borderColor};
          }
          
          &::after {
            content: '';
            position: absolute;
            bottom: calc(100% - 1px);
            left: 50%;
            transform: translateX(-50%);
            border: ${arrowSize} solid transparent;
            border-bottom-color: ${arrowColor};
          }
        `;
      case 'left':
        return css`
          right: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          
          &::before {
            content: '';
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border: ${arrowSize} solid transparent;
            border-left-color: ${borderColor};
          }
          
          &::after {
            content: '';
            position: absolute;
            left: calc(100% - 1px);
            top: 50%;
            transform: translateY(-50%);
            border: ${arrowSize} solid transparent;
            border-left-color: ${arrowColor};
          }
        `;
      case 'right':
        return css`
          left: calc(100% + 8px);
          top: 50%;
          transform: translateY(-50%);
          
          &::before {
            content: '';
            position: absolute;
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            border: ${arrowSize} solid transparent;
            border-right-color: ${borderColor};
          }
          
          &::after {
            content: '';
            position: absolute;
            right: calc(100% - 1px);
            top: 50%;
            transform: translateY(-50%);
            border: ${arrowSize} solid transparent;
            border-right-color: ${arrowColor};
          }
        `;
    }
  }}
`;

const TooltipHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const NameTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${PRONUNCIATION_COLORS.tooltip.text};
`;

const ConfidenceIndicator = styled.div<{ $confidence: number }>`
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  opacity: 0.8;
  
  ${props => {
    const dots = Math.ceil(props.$confidence * 3);
    return css`
      &::after {
        content: '${'●'.repeat(dots)}${'○'.repeat(3 - dots)}';
        color: ${props.$confidence > 0.7 ? PRONUNCIATION_COLORS.button.success : 
               props.$confidence > 0.4 ? PRONUNCIATION_COLORS.button.warning : 
               PRONUNCIATION_COLORS.button.danger};
        margin-left: 4px;
      }
    `;
  }}
`;

const PronunciationSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PronunciationRow = styled.div<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: ${props => props.$primary ? '6px' : '4px'};
  background: ${props => props.$primary ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border-radius: 4px;
  border-left: ${props => props.$primary ? `3px solid ${PRONUNCIATION_COLORS.button.primary}` : 'none'};
`;

const PronunciationLabel = styled.span`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${PRONUNCIATION_COLORS.button.secondary};
  min-width: 50px;
`;

const PronunciationText = styled.code`
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 13px;
  font-weight: 500;
  color: ${PRONUNCIATION_COLORS.button.warning};
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  flex-grow: 1;
  text-align: center;
`;

const AudioButton = styled.button<{ $isPlaying: boolean; $variant: 'primary' | 'secondary' }>`
  background: ${props => 
    props.$isPlaying ? PRONUNCIATION_COLORS.button.success :
    props.$variant === 'primary' ? PRONUNCIATION_COLORS.button.primary : 
    PRONUNCIATION_COLORS.button.secondary
  };
  border: none;
  color: white;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 70px;
  justify-content: center;

  ${props => props.$isPlaying && css`
    animation: ${buttonPulse} 2s infinite;
  `}

  &:hover:not(:disabled) {
    background: ${props => 
      props.$isPlaying ? PRONUNCIATION_COLORS.button.success :
      props.$variant === 'primary' ? PRONUNCIATION_COLORS.linkHover : 
      '#5a6268'
    };
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: ${PRONUNCIATION_COLORS.button.secondary};
    cursor: not-allowed;
    opacity: 0.5;
    transform: none;
  }

  &:focus {
    outline: 2px solid ${PRONUNCIATION_COLORS.button.warning};
    outline-offset: 1px;
  }
`;

const LoadingSpinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  color: ${PRONUNCIATION_COLORS.button.danger};
  font-size: 10px;
  font-style: italic;
  text-align: center;
  padding: 4px;
  background: rgba(220, 53, 69, 0.1);
  border-radius: 3px;
  margin-top: 4px;
`;

const MetadataRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: ${PRONUNCIATION_COLORS.button.secondary};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 6px;
  margin-top: 6px;
`;

export const PronunciationTooltip: React.FC<PronunciationTooltipProps> = ({
  name,
  pronunciation,
  pronunciationStyle,
  onPlayAudio,
  isPlaying = false,
  position = 'top',
}) => {
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);

  // Clear error when playing state changes
  useEffect(() => {
    if (isPlaying || isPlayingLocal) {
      setAudioError(null);
    }
  }, [isPlaying, isPlayingLocal]);

  const handlePlayAudio = useCallback(async () => {
    if (!onPlayAudio) return;
    
    setIsPlayingLocal(true);
    setAudioError(null);
    
    try {
      await onPlayAudio(name);
    } catch (error) {
      console.error('Error playing pronunciation:', error);
      setAudioError('Failed to play audio');
    } finally {
      setIsPlayingLocal(false);
    }
  }, [name, onPlayAudio]);

  const handlePlayWithFormat = useCallback(async (format: 'phonetic' | 'ipa' | 'phoneme') => {
    setIsPlayingLocal(true);
    setAudioError(null);
    
    try {
      await pronunciationService.playPronunciation(name, {
        voice_settings: {
          speed: TTS_CONFIG.DEFAULT_SPEED,
        }
      });
    } catch (error) {
      console.error(`Error playing ${format} pronunciation:`, error);
      setAudioError(`Failed to play ${format} pronunciation`);
    } finally {
      setIsPlayingLocal(false);
    }
  }, [name]);

  const getConfidenceScore = (): number => {
    let score = 0;
    if (pronunciation.phonetic) score += 0.4;
    if (pronunciation.ipa) score += 0.4;
    if (pronunciation.phoneme) score += 0.2;
    return score;
  };

  const getPrimaryPronunciation = () => {
    if (pronunciationStyle === 'ipa' && pronunciation.ipa) {
      return { format: 'IPA', text: pronunciation.ipa };
    }
    if (pronunciationStyle === 'phonetic' && pronunciation.phonetic) {
      return { format: 'Phonetic', text: pronunciation.phonetic };
    }
    // Fallback
    if (pronunciation.phonetic) {
      return { format: 'Phonetic', text: pronunciation.phonetic };
    }
    if (pronunciation.ipa) {
      return { format: 'IPA', text: pronunciation.ipa };
    }
    if (pronunciation.phoneme) {
      return { format: 'Phoneme', text: pronunciation.phoneme };
    }
    return null;
  };

  const getAlternatePronunciations = () => {
    const alternates = [];
    const primary = getPrimaryPronunciation();
    
    if (pronunciation.phonetic && primary?.text !== pronunciation.phonetic) {
      alternates.push({ format: 'Phonetic', text: pronunciation.phonetic, key: 'phonetic' });
    }
    if (pronunciation.ipa && primary?.text !== pronunciation.ipa) {
      alternates.push({ format: 'IPA', text: pronunciation.ipa, key: 'ipa' });
    }
    if (pronunciation.phoneme && primary?.text !== pronunciation.phoneme) {
      alternates.push({ format: 'Phoneme', text: pronunciation.phoneme, key: 'phoneme' });
    }
    
    return alternates;
  };

  const primary = getPrimaryPronunciation();
  const alternates = getAlternatePronunciations();
  const confidence = getConfidenceScore();
  const currentlyPlaying = isPlaying || isPlayingLocal;

  return (
    <TooltipContainer
      $position={position}
      $visible={true}
      role="tooltip"
      aria-label={`Pronunciation guide for ${name}`}
    >
      <TooltipHeader>
        <NameTitle>{name}</NameTitle>
        <ConfidenceIndicator 
          $confidence={confidence}
          title={`Confidence: ${Math.round(confidence * 100)}%`}
        >
          Quality
        </ConfidenceIndicator>
      </TooltipHeader>

      <PronunciationSection>
        {primary && (
          <PronunciationRow $primary>
            <PronunciationLabel>{primary.format}</PronunciationLabel>
            <PronunciationText>/{primary.text}/</PronunciationText>
            <AudioButton
              $isPlaying={currentlyPlaying}
              $variant="primary"
              onClick={handlePlayAudio || (() => handlePlayWithFormat('phonetic'))}
              disabled={currentlyPlaying}
              title={`Play ${primary.format.toLowerCase()} pronunciation`}
              aria-label={`Play ${primary.format.toLowerCase()} pronunciation of ${name}`}
            >
              {currentlyPlaying ? (
                <>
                  <LoadingSpinner />
                  Playing
                </>
              ) : (
                <>
                  🔊 Play
                </>
              )}
            </AudioButton>
          </PronunciationRow>
        )}

        {alternates.map((alt, index) => (
          <PronunciationRow key={alt.key}>
            <PronunciationLabel>{alt.format}</PronunciationLabel>
            <PronunciationText>/{alt.text}/</PronunciationText>
            <AudioButton
              $isPlaying={false}
              $variant="secondary"
              onClick={() => handlePlayWithFormat(alt.key as any)}
              disabled={currentlyPlaying}
              title={`Play ${alt.format.toLowerCase()} pronunciation`}
              aria-label={`Play ${alt.format.toLowerCase()} pronunciation of ${name}`}
            >
              Play
            </AudioButton>
          </PronunciationRow>
        ))}
      </PronunciationSection>

      {audioError && (
        <ErrorMessage>{audioError}</ErrorMessage>
      )}

      <MetadataRow>
        <span>
          Source: {pronunciation.source || 'Biblical Names Database'}
        </span>
        <span>
          {alternates.length + 1} format{alternates.length === 0 ? '' : 's'}
        </span>
      </MetadataRow>
    </TooltipContainer>
  );
};

export default PronunciationTooltip;