/**
 * AudioControls Component
 * Provides comprehensive audio playback controls for TTS pronunciation system
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  AudioControlsProps,
  PRONUNCIATION_COLORS,
  TTS_CONFIG,
} from '../types';

// Animations
const waveform = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`;

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
`;

// Styled Components
const ControlsContainer = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  display: flex;
  align-items: center;
  gap: ${props => {
    switch (props.$size) {
      case 'small': return '4px';
      case 'medium': return '8px';
      case 'large': return '12px';
    }
  }};
  padding: ${props => {
    switch (props.$size) {
      case 'small': return '4px';
      case 'medium': return '8px';
      case 'large': return '12px';
    }
  }};
  background: rgba(255, 255, 255, 0.1);
  border-radius: ${props => {
    switch (props.$size) {
      case 'small': return '4px';
      case 'medium': return '6px';
      case 'large': return '8px';
    }
  }};
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: ${PRONUNCIATION_COLORS.button.primary};
  }
`;

const ControlButton = styled.button<{ 
  $size: 'small' | 'medium' | 'large';
  $variant: 'primary' | 'secondary' | 'danger';
  $isActive?: boolean;
}>`
  background: ${props => {
    if (props.$isActive) return PRONUNCIATION_COLORS.button.success;
    switch (props.$variant) {
      case 'primary': return PRONUNCIATION_COLORS.button.primary;
      case 'secondary': return PRONUNCIATION_COLORS.button.secondary;
      case 'danger': return PRONUNCIATION_COLORS.button.danger;
    }
  }};
  border: none;
  color: white;
  border-radius: ${props => {
    switch (props.$size) {
      case 'small': return '3px';
      case 'medium': return '4px';
      case 'large': return '6px';
    }
  }};
  padding: ${props => {
    switch (props.$size) {
      case 'small': return '4px 6px';
      case 'medium': return '6px 10px';
      case 'large': return '8px 14px';
    }
  }};
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return '10px';
      case 'medium': return '12px';
      case 'large': return '14px';
    }
  }};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: ${props => {
    switch (props.$size) {
      case 'small': return '24px';
      case 'medium': return '32px';
      case 'large': return '40px';
    }
  }};
  position: relative;
  overflow: hidden;

  &:hover:not(:disabled) {
    background: ${props => {
      if (props.$isActive) return PRONUNCIATION_COLORS.button.success;
      switch (props.$variant) {
        case 'primary': return PRONUNCIATION_COLORS.linkHover;
        case 'secondary': return '#5a6268';
        case 'danger': return '#c82333';
      }
    }};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    background: ${PRONUNCIATION_COLORS.button.secondary};
    cursor: not-allowed;
    opacity: 0.5;
    transform: none;
    box-shadow: none;
  }

  &:focus {
    outline: 2px solid ${PRONUNCIATION_COLORS.button.warning};
    outline-offset: 1px;
  }

  ${props => props.$isActive && css`
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
  `}
`;

const PlayPauseButton = styled(ControlButton)<{ $isPlaying: boolean }>`
  ${props => props.$isPlaying && css`
    animation: ${pulse} 2s infinite;
  `}
`;

const StopButton = styled(ControlButton)`
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    width: 40%;
    height: 40%;
    background: currentColor;
    border-radius: 1px;
  }
`;

const VolumeContainer = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  display: flex;
  align-items: center;
  gap: ${props => {
    switch (props.$size) {
      case 'small': return '4px';
      case 'medium': return '6px';
      case 'large': return '8px';
    }
  }};
  position: relative;
`;

const VolumeSlider = styled.input<{ $size: 'small' | 'medium' | 'large' }>`
  width: ${props => {
    switch (props.$size) {
      case 'small': return '60px';
      case 'medium': return '80px';
      case 'large': return '100px';
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'small': return '4px';
      case 'medium': return '6px';
      case 'large': return '8px';
    }
  }};
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  outline: none;
  appearance: none;
  transition: background 0.2s ease;

  &::-webkit-slider-thumb {
    appearance: none;
    width: ${props => {
      switch (props.$size) {
        case 'small': return '12px';
        case 'medium': return '16px';
        case 'large': return '20px';
      }
    }};
    height: ${props => {
      switch (props.$size) {
        case 'small': return '12px';
        case 'medium': return '16px';
        case 'large': return '20px';
      }
    }};
    background: ${PRONUNCIATION_COLORS.button.primary};
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &::-webkit-slider-thumb:hover {
    background: ${PRONUNCIATION_COLORS.linkHover};
    transform: scale(1.1);
  }

  &::-moz-range-thumb {
    width: ${props => {
      switch (props.$size) {
        case 'small': return '12px';
        case 'medium': return '16px';
        case 'large': return '20px';
      }
    }};
    height: ${props => {
      switch (props.$size) {
        case 'small': return '12px';
        case 'medium': return '16px';
        case 'large': return '20px';
      }
    }};
    background: ${PRONUNCIATION_COLORS.button.primary};
    border-radius: 50%;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    box-shadow: 0 0 0 2px ${PRONUNCIATION_COLORS.button.warning};
  }
`;

const VolumeDisplay = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return '9px';
      case 'medium': return '11px';
      case 'large': return '13px';
    }
  }};
  font-weight: 500;
  color: ${PRONUNCIATION_COLORS.tooltip.text};
  min-width: ${props => {
    switch (props.$size) {
      case 'small': return '24px';
      case 'medium': return '28px';
      case 'large': return '32px';
    }
  }};
  text-align: center;
`;

const WaveformVisualizer = styled.div<{ $isPlaying: boolean; $size: 'small' | 'medium' | 'large' }>`
  display: flex;
  align-items: center;
  gap: 1px;
  height: ${props => {
    switch (props.$size) {
      case 'small': return '12px';
      case 'medium': return '16px';
      case 'large': return '20px';
    }
  }};
`;

const WaveformBar = styled.div<{ 
  $isPlaying: boolean;
  $delay: number;
  $size: 'small' | 'medium' | 'large';
}>`
  width: ${props => {
    switch (props.$size) {
      case 'small': return '2px';
      case 'medium': return '3px';
      case 'large': return '4px';
    }
  }};
  height: 30%;
  background: ${PRONUNCIATION_COLORS.button.primary};
  border-radius: 1px;
  transform: scaleY(0.3);
  transition: background 0.2s ease;

  ${props => props.$isPlaying && css`
    animation: ${waveform} 1.5s ease-in-out infinite;
    animation-delay: ${props.$delay}ms;
    background: ${PRONUNCIATION_COLORS.button.success};
  `}
`;

const StatusIndicator = styled.div<{ $isPlaying: boolean; $size: 'small' | 'medium' | 'large' }>`
  display: flex;
  align-items: center;
  gap: ${props => {
    switch (props.$size) {
      case 'small': return '4px';
      case 'medium': return '6px';
      case 'large': return '8px';
    }
  }};
  font-size: ${props => {
    switch (props.$size) {
      case 'small': return '9px';
      case 'medium': return '11px';
      case 'large': return '13px';
    }
  }};
  color: ${PRONUNCIATION_COLORS.tooltip.text};
  opacity: 0.8;
`;

const StatusDot = styled.div<{ $isPlaying: boolean; $size: 'small' | 'medium' | 'large' }>`
  width: ${props => {
    switch (props.$size) {
      case 'small': return '6px';
      case 'medium': return '8px';
      case 'large': return '10px';
    }
  }};
  height: ${props => {
    switch (props.$size) {
      case 'small': return '6px';
      case 'medium': return '8px';
      case 'large': return '10px';
    }
  }};
  border-radius: 50%;
  background: ${props => props.$isPlaying ? PRONUNCIATION_COLORS.button.success : PRONUNCIATION_COLORS.button.secondary};
  transition: background 0.2s ease;

  ${props => props.$isPlaying && css`
    animation: ${pulse} 1s infinite;
  `}
`;

const MuteButton = styled(ControlButton)<{ $isMuted: boolean }>`
  ${props => props.$isMuted && css`
    background: ${PRONUNCIATION_COLORS.button.warning};
    position: relative;
    
    &::after {
      content: '';
      position: absolute;
      width: 1px;
      height: 120%;
      background: currentColor;
      transform: rotate(45deg);
    }
  `}
`;

export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  volume,
  muted,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  onMuteToggle,
  disabled = false,
  size = 'medium',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePlayPause = useCallback(() => {
    if (disabled) return;
    
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause, disabled]);

  const handleStop = useCallback(() => {
    if (disabled) return;
    onStop();
  }, [onStop, disabled]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
    
    // Show volume tooltip briefly
    setShowVolumeTooltip(true);
    
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeTooltip(false);
    }, 1500);
  }, [onVolumeChange]);

  const handleMuteToggle = useCallback(() => {
    if (disabled) return;
    onMuteToggle();
  }, [onMuteToggle, disabled]);

  const handleVolumeMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleVolumeMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current);
      }
    };
  }, []);

  // Keyboard controls
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        handlePlayPause();
        break;
      case 'Escape':
        e.preventDefault();
        handleStop();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onVolumeChange(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        onVolumeChange(Math.max(0, volume - 0.1));
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        handleMuteToggle();
        break;
    }
  }, [disabled, handlePlayPause, handleStop, onVolumeChange, volume, handleMuteToggle]);

  const formatVolume = (vol: number): string => {
    return Math.round(vol * 100).toString();
  };

  return (
    <ControlsContainer 
      $size={size}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="group"
      aria-label="Audio playback controls"
    >
      {/* Play/Pause Button */}
      <PlayPauseButton
        $size={size}
        $variant="primary"
        $isPlaying={isPlaying}
        $isActive={isPlaying}
        onClick={handlePlayPause}
        disabled={disabled}
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </PlayPauseButton>

      {/* Stop Button */}
      <StopButton
        $size={size}
        $variant="secondary"
        onClick={handleStop}
        disabled={disabled || !isPlaying}
        title="Stop (Escape)"
        aria-label="Stop audio"
      >
        ⏹️
      </StopButton>

      {/* Waveform Visualizer */}
      <WaveformVisualizer $isPlaying={isPlaying} $size={size}>
        {Array.from({ length: 5 }).map((_, index) => (
          <WaveformBar
            key={index}
            $isPlaying={isPlaying}
            $delay={index * 100}
            $size={size}
          />
        ))}
      </WaveformVisualizer>

      {/* Volume Controls */}
      <VolumeContainer $size={size}>
        <MuteButton
          $size={size}
          $variant="secondary"
          $isMuted={muted}
          onClick={handleMuteToggle}
          disabled={disabled}
          title={muted ? 'Unmute (M)' : 'Mute (M)'}
          aria-label={muted ? 'Unmute audio' : 'Mute audio'}
        >
          {muted ? '🔇' : volume > 0.5 ? '🔊' : volume > 0 ? '🔉' : '🔈'}
        </MuteButton>

        <VolumeSlider
          $size={size}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          onMouseDown={handleVolumeMouseDown}
          onMouseUp={handleVolumeMouseUp}
          disabled={disabled}
          title={`Volume: ${formatVolume(volume)}% (Arrow keys to adjust)`}
          aria-label="Volume slider"
        />

        <VolumeDisplay 
          $size={size}
          title={muted ? 'Muted' : `Volume: ${formatVolume(volume)}%`}
        >
          {muted ? '--' : formatVolume(volume)}
        </VolumeDisplay>
      </VolumeContainer>

      {/* Status Indicator */}
      <StatusIndicator $isPlaying={isPlaying} $size={size}>
        <StatusDot $isPlaying={isPlaying} $size={size} />
        <span>{isPlaying ? 'Playing' : 'Ready'}</span>
      </StatusIndicator>
    </ControlsContainer>
  );
};

export default AudioControls;