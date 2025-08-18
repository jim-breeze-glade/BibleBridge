/**
 * BiblicalName Component
 * Renders clickable biblical names with pronunciation tooltips and TTS playback
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  BiblicalNameProps,
  PronunciationData,
  PRONUNCIATION_COLORS,
  TTS_CONFIG,
} from '../types';
import { pronunciationService } from '../services/pronunciationService';
import { useTTSAudioManager } from '../hooks/useTTSAudioManager';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled Components
const NameContainer = styled.span<{ $disabled: boolean; $isPlaying: boolean }>`
  position: relative;
  display: inline;
  cursor: ${props => props.$disabled ? 'default' : 'pointer'};
  color: ${props => props.$disabled ? '#6c757d' : PRONUNCIATION_COLORS.link};
  text-decoration: ${props => props.$disabled ? 'none' : 'underline'};
  text-decoration-style: dotted;
  text-underline-offset: 2px;
  transition: all 0.2s ease;
  
  ${props => props.$isPlaying && css`
    animation: ${pulse} 1s infinite;
    color: ${PRONUNCIATION_COLORS.button.success};
  `}

  &:hover {
    color: ${props => props.$disabled ? '#6c757d' : PRONUNCIATION_COLORS.linkHover};
    text-decoration-style: solid;
  }

  &:focus {
    outline: 2px solid ${PRONUNCIATION_COLORS.button.primary};
    outline-offset: 1px;
    border-radius: 2px;
  }
`;

const Tooltip = styled.div<{ $position: 'top' | 'bottom' | 'left' | 'right'; $show: boolean }>`
  position: absolute;
  background: ${PRONUNCIATION_COLORS.tooltip.background};
  color: ${PRONUNCIATION_COLORS.tooltip.text};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1000;
  opacity: ${props => props.$show ? 1 : 0};
  visibility: ${props => props.$show ? 'visible' : 'hidden'};
  pointer-events: ${props => props.$show ? 'auto' : 'none'};
  transition: opacity 0.2s ease, visibility 0.2s ease;
  animation: ${props => props.$show ? fadeIn : 'none'} 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid ${PRONUNCIATION_COLORS.tooltip.border};

  ${props => {
    switch (props.$position) {
      case 'top':
        return css`
          bottom: calc(100% + 5px);
          left: 50%;
          transform: translateX(-50%);
          
          &::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: ${PRONUNCIATION_COLORS.tooltip.background};
          }
        `;
      case 'bottom':
        return css`
          top: calc(100% + 5px);
          left: 50%;
          transform: translateX(-50%);
          
          &::after {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-bottom-color: ${PRONUNCIATION_COLORS.tooltip.background};
          }
        `;
      case 'left':
        return css`
          right: calc(100% + 5px);
          top: 50%;
          transform: translateY(-50%);
          
          &::after {
            content: '';
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border: 5px solid transparent;
            border-left-color: ${PRONUNCIATION_COLORS.tooltip.background};
          }
        `;
      case 'right':
        return css`
          left: calc(100% + 5px);
          top: 50%;
          transform: translateY(-50%);
          
          &::after {
            content: '';
            position: absolute;
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            border: 5px solid transparent;
            border-right-color: ${PRONUNCIATION_COLORS.tooltip.background};
          }
        `;
    }
  }}
`;

const TooltipContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PronunciationText = styled.div`
  font-family: 'Courier New', monospace;
  color: ${PRONUNCIATION_COLORS.button.warning};
`;

const AudioButton = styled.button<{ $isPlaying: boolean; $size: 'small' | 'medium' }>`
  background: ${props => props.$isPlaying ? PRONUNCIATION_COLORS.button.success : PRONUNCIATION_COLORS.button.primary};
  border: none;
  color: white;
  border-radius: 3px;
  padding: ${props => props.$size === 'small' ? '2px 4px' : '4px 6px'};
  font-size: ${props => props.$size === 'small' ? '10px' : '11px'};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 2px;

  &:hover {
    background: ${props => props.$isPlaying ? PRONUNCIATION_COLORS.button.success : PRONUNCIATION_COLORS.linkHover};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: ${PRONUNCIATION_COLORS.button.secondary};
    cursor: not-allowed;
    transform: none;
  }

  &:focus {
    outline: 2px solid ${PRONUNCIATION_COLORS.button.warning};
    outline-offset: 1px;
  }
`;

const ErrorText = styled.div`
  color: ${PRONUNCIATION_COLORS.button.danger};
  font-size: 10px;
  font-style: italic;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 1px solid ${PRONUNCIATION_COLORS.button.secondary};
  border-top: 1px solid ${PRONUNCIATION_COLORS.button.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const BiblicalName: React.FC<BiblicalNameProps> = ({
  name,
  children,
  pronunciation: providedPronunciation,
  onClick,
  showTooltip = true,
  pronunciationStyle = 'phonetic',
  disabled = false,
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const [pronunciation, setPronunciation] = useState<PronunciationData | null>(
    providedPronunciation || null
  );
  const [isLoadingPronunciation, setIsLoadingPronunciation] = useState(false);
  const [pronunciationError, setPronunciationError] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  
  const containerRef = useRef<HTMLSpanElement>(null);
  const { playAudio, isPlaying, currentName } = useTTSAudioManager();
  
  const isCurrentlyPlaying = isPlaying && currentName === name;

  // Load pronunciation data if not provided
  useEffect(() => {
    if (!providedPronunciation && !pronunciation && !isLoadingPronunciation) {
      loadPronunciation();
    }
  }, [name, providedPronunciation, pronunciation, isLoadingPronunciation, loadPronunciation]);

  // Listen for audio ready events
  useEffect(() => {
    const handleAudioReady = (event: CustomEvent) => {
      const { name: audioName, audioData } = event.detail;
      if (audioName === name && audioData) {
        playAudio(name, audioData).catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    };

    window.addEventListener('pronunciationAudioReady', handleAudioReady as EventListener);
    
    return () => {
      window.removeEventListener('pronunciationAudioReady', handleAudioReady as EventListener);
    };
  }, [name, playAudio]);

  // Determine tooltip position based on element position
  useEffect(() => {
    if (showTooltipState && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Prefer top, but use bottom if not enough space above
      if (rect.top < 100) {
        setTooltipPosition('bottom');
      } else if (rect.bottom > viewportHeight - 100) {
        setTooltipPosition('top');
      } else if (rect.left < 200) {
        setTooltipPosition('right');
      } else if (rect.right > viewportWidth - 200) {
        setTooltipPosition('left');
      } else {
        setTooltipPosition('top');
      }
    }
  }, [showTooltipState]);

  const loadPronunciation = async () => {
    setIsLoadingPronunciation(true);
    setPronunciationError(null);

    try {
      const data = await pronunciationService.getPronunciation(name);
      setPronunciation(data);
      
      if (!data) {
        setPronunciationError('No pronunciation available');
      }
    } catch (error) {
      console.error(`Error loading pronunciation for ${name}:`, error);
      setPronunciationError('Failed to load pronunciation');
    } finally {
      setIsLoadingPronunciation(false);
    }
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (disabled) return;
    
    if (onClick) {
      onClick(name);
    }
  }, [name, onClick, disabled]);

  const handlePlayAudio = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (disabled || isCurrentlyPlaying) return;

    try {
      await pronunciationService.playPronunciation(name, {
        voice_settings: {
          speed: TTS_CONFIG.DEFAULT_SPEED,
        }
      });
    } catch (error) {
      console.error('Error playing pronunciation:', error);
      setPronunciationError('Failed to play pronunciation');
    }
  }, [name, disabled, isCurrentlyPlaying]);

  const handleMouseEnter = useCallback(() => {
    if (showTooltip && !disabled) {
      setShowTooltipState(true);
    }
  }, [showTooltip, disabled]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltipState(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  }, [handleClick]);

  const getPronunciationText = (): string | null => {
    if (!pronunciation) return null;

    if (pronunciationStyle === 'ipa' && pronunciation.ipa) {
      return pronunciation.ipa;
    }
    
    if (pronunciationStyle === 'phonetic' && pronunciation.phonetic) {
      return pronunciation.phonetic;
    }

    // Fallback
    return pronunciation.phonetic || pronunciation.ipa || pronunciation.phoneme || null;
  };

  const shouldShowTooltip = showTooltip && !disabled && (
    pronunciation || isLoadingPronunciation || pronunciationError
  );

  return (
    <NameContainer
      ref={containerRef}
      $disabled={disabled}
      $isPlaying={isCurrentlyPlaying}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={`Biblical name: ${name}${pronunciation ? ` (pronounced: ${getPronunciationText()})` : ''}`}
      aria-describedby={showTooltipState ? `tooltip-${name}` : undefined}
    >
      {children}
      
      {shouldShowTooltip && (
        <Tooltip
          id={`tooltip-${name}`}
          $position={tooltipPosition}
          $show={showTooltipState}
          role="tooltip"
        >
          <TooltipContent>
            <strong>{name}</strong>
            
            {isLoadingPronunciation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LoadingSpinner />
                <span>Loading pronunciation...</span>
              </div>
            )}
            
            {pronunciation && (
              <>
                <PronunciationText>
                  /{getPronunciationText()}/
                </PronunciationText>
                
                <AudioButton
                  $isPlaying={isCurrentlyPlaying}
                  $size="small"
                  onClick={handlePlayAudio}
                  disabled={disabled || isCurrentlyPlaying}
                  title={isCurrentlyPlaying ? 'Playing...' : 'Play pronunciation'}
                  aria-label={`Play pronunciation of ${name}`}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <LoadingSpinner />
                      Playing...
                    </>
                  ) : (
                    <>
                      🔊 Play
                    </>
                  )}
                </AudioButton>
              </>
            )}
            
            {pronunciationError && (
              <ErrorText>{pronunciationError}</ErrorText>
            )}
          </TooltipContent>
        </Tooltip>
      )}
    </NameContainer>
  );
};

export default BiblicalName;