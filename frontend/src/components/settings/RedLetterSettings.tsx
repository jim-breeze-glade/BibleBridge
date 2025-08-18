/**
 * RedLetterSettings Component - Controls for red letter text (Jesus' words)
 */

import React, { useCallback, useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import Toggle from '../ui/Toggle';
import Slider from '../ui/Slider';

const RedLetterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
  border-bottom: 2px solid var(--theme-border);
  padding-bottom: 8px;
`;

const ControlsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PreviewContainer = styled.div`
  background: var(--theme-bg-secondary);
  border: 2px solid var(--theme-border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
`;

const PreviewVerse = styled.div`
  font-family: var(--theme-font-family);
  font-size: var(--theme-font-size);
  line-height: var(--theme-line-height);
  color: var(--theme-text-primary);
  opacity: var(--theme-text-brightness);
  text-align: left;
  margin-bottom: 12px;
`;

const VerseNumber = styled.span`
  font-weight: bold;
  color: var(--theme-text-muted);
  margin-right: 8px;
  font-size: 0.9em;
  vertical-align: super;
`;

// RGB Wave Animation
const rgbWave = keyframes`
  0% { color: #ff0000; }
  16.66% { color: #ff8000; }
  33.33% { color: #ffff00; }
  50% { color: #00ff00; }
  66.66% { color: #0080ff; }
  83.33% { color: #8000ff; }
  100% { color: #ff0000; }
`;

const RedLetterText = styled.span<{ 
  brightness: number; 
  rgbWaveEnabled: boolean;
  rgbWaveSpeed: number;
}>`
  color: var(--theme-red-letter-color);
  opacity: ${props => props.brightness};
  font-weight: 500;
  transition: opacity 0.2s ease;
  
  ${props => props.rgbWaveEnabled && css`
    animation: ${rgbWave} ${props.rgbWaveSpeed}s linear infinite;
    font-weight: 600;
  `}
`;

const InfoText = styled.p`
  margin: 8px 0 0 0;
  font-size: 13px;
  color: var(--theme-text-secondary);
  font-style: italic;
  line-height: 1.4;
`;

const AnimationDemo = styled.div<{ isActive: boolean }>`
  display: inline-block;
  color: var(--theme-red-letter-color);
  font-weight: 600;
  transition: all 0.2s ease;
  
  ${props => props.isActive && css`
    animation: ${rgbWave} 2s linear infinite;
  `}
`;

const ResetButton = styled.button`
  padding: 8px 16px;
  background: var(--theme-bg-tertiary);
  border: 2px solid var(--theme-border);
  border-radius: 6px;
  color: var(--theme-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;

  &:hover {
    background: var(--theme-bg-secondary);
    border-color: var(--theme-accent);
  }

  &:focus {
    outline: none;
    border-color: var(--theme-accent);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  }
`;

const RedLetterSettings: React.FC = () => {
  const { theme, actions } = useTheme();
  const [demoActive, setDemoActive] = useState(false);

  const handleShowRedLettersChange = useCallback((enabled: boolean) => {
    actions.setShowRedLetters(enabled);
  }, [actions]);

  const handleRedLetterBrightnessChange = useCallback((brightness: number) => {
    actions.setRedLetterBrightness(brightness);
  }, [actions]);

  const handleRgbWaveEnabledChange = useCallback((enabled: boolean) => {
    actions.setRgbWaveEnabled(enabled);
  }, [actions]);

  const handleRgbWaveSpeedChange = useCallback((speed: number) => {
    actions.setRgbWaveSpeed(speed);
  }, [actions]);

  const handleReset = useCallback(() => {
    actions.setShowRedLetters(true);
    actions.setRedLetterBrightness(0.8);
    actions.setRgbWaveEnabled(false);
    actions.setRgbWaveSpeed(1);
  }, [actions]);

  // Demo animation toggle
  const toggleDemo = useCallback(() => {
    setDemoActive(prev => !prev);
  }, []);

  // Auto-stop demo after a few seconds
  useEffect(() => {
    if (demoActive) {
      const timer = setTimeout(() => {
        setDemoActive(false);
      }, 6000); // Stop after 6 seconds

      return () => clearTimeout(timer);
    }
  }, [demoActive]);

  return (
    <RedLetterContainer>
      <SectionTitle>Red Letter Text</SectionTitle>
      
      <InfoText>
        Red letter text highlights the words of Jesus in the Gospel books 
        (Matthew, Mark, Luke, and John). This traditional formatting helps 
        distinguish Christ's direct quotes.
      </InfoText>

      <ControlsGroup>
        <Toggle
          label="Show Red Letter Text"
          checked={theme.showRedLetters}
          onChange={handleShowRedLettersChange}
          description="Highlight Jesus' words in red in Gospel books"
        />

        {theme.showRedLetters && (
          <>
            <Slider
              label="Red Letter Brightness"
              value={theme.redLetterBrightness}
              min={0.2}
              max={1.0}
              step={0.05}
              unit="%"
              onChange={handleRedLetterBrightnessChange}
            />

            <Toggle
              label="RGB Wave Animation"
              checked={theme.rgbWaveEnabled}
              onChange={handleRgbWaveEnabledChange}
              description="Animate red letter text with rainbow colors"
            />

            {theme.rgbWaveEnabled && (
              <Slider
                label="Animation Speed"
                value={theme.rgbWaveSpeed}
                min={0.5}
                max={5.0}
                step={0.1}
                unit="s"
                onChange={handleRgbWaveSpeedChange}
              />
            )}
          </>
        )}

        <ResetButton onClick={handleReset}>
          Reset Red Letter Settings
        </ResetButton>
      </ControlsGroup>

      {theme.showRedLetters && (
        <PreviewContainer>
          <PreviewVerse>
            <VerseNumber>35</VerseNumber>
            Jesus said to them, 
            <RedLetterText
              brightness={theme.redLetterBrightness}
              rgbWaveEnabled={theme.rgbWaveEnabled}
              rgbWaveSpeed={theme.rgbWaveSpeed}
            >
              "I am the bread of life. Whoever comes to me will never go hungry, 
              and whoever believes in me will never be thirsty."
            </RedLetterText>
          </PreviewVerse>
          
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--theme-text-secondary)',
            marginTop: '8px'
          }}>
            John 6:35 (NIV) - 
            <button
              onClick={toggleDemo}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--theme-accent)',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: 'inherit',
                marginLeft: '4px',
              }}
            >
              <AnimationDemo isActive={demoActive}>
                {demoActive ? 'Demo Active' : 'Click to Demo RGB'}
              </AnimationDemo>
            </button>
          </div>
        </PreviewContainer>
      )}
    </RedLetterContainer>
  );
};

export default RedLetterSettings;