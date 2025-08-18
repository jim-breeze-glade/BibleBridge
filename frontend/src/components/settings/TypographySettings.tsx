/**
 * TypographySettings Component - Font family, size, and brightness controls
 */

import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useTheme, FONT_FAMILIES } from '../../context/ThemeContext';
import Select from '../ui/Select';
import Slider from '../ui/Slider';

const TypographyContainer = styled.div`
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

const PreviewContainer = styled.div`
  background: var(--theme-bg-secondary);
  border: 2px solid var(--theme-border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
`;

const PreviewText = styled.div`
  font-family: var(--theme-font-family);
  font-size: var(--theme-font-size);
  line-height: var(--theme-line-height);
  opacity: var(--theme-text-brightness);
  color: var(--theme-text-primary);
  text-align: left;
  transition: all 0.2s ease;
`;

const PreviewVerse = styled.p`
  margin: 0 0 8px 0;
  font-style: italic;
`;

const PreviewReference = styled.p`
  margin: 0;
  font-size: 0.9em;
  color: var(--theme-text-secondary);
  font-weight: 500;
`;

const ControlsGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
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

const TypographySettings: React.FC = () => {
  const { theme, actions } = useTheme();

  const fontOptions = FONT_FAMILIES.map(font => ({
    value: font.value,
    label: font.name,
  }));

  const handleFontFamilyChange = useCallback((value: string) => {
    actions.setFontFamily(value);
  }, [actions]);

  const handleFontSizeChange = useCallback((size: number) => {
    actions.setFontSize(size);
  }, [actions]);

  const handleTextBrightnessChange = useCallback((brightness: number) => {
    actions.setTextBrightness(brightness);
  }, [actions]);

  const handleReset = useCallback(() => {
    actions.setFontFamily('Georgia, "Times New Roman", Times, serif');
    actions.setFontSize(16);
    actions.setTextBrightness(1.0);
  }, [actions]);

  return (
    <TypographyContainer>
      <SectionTitle>Typography</SectionTitle>
      
      <ControlsGroup>
        <Select
          label="Font Family"
          value={theme.fontFamily}
          options={fontOptions}
          onChange={handleFontFamilyChange}
          placeholder="Select font family..."
        />

        <Slider
          label="Font Size"
          value={theme.fontSize}
          min={12}
          max={32}
          step={1}
          unit="px"
          onChange={handleFontSizeChange}
        />

        <Slider
          label="Text Brightness"
          value={theme.textBrightness}
          min={0.2}
          max={1.0}
          step={0.05}
          unit="%"
          onChange={handleTextBrightnessChange}
        />

        <ResetButton onClick={handleReset}>
          Reset Typography
        </ResetButton>
      </ControlsGroup>

      <PreviewContainer>
        <PreviewText>
          <PreviewVerse>
            "For God so loved the world that he gave his one and only Son, 
            that whoever believes in him shall not perish but have eternal life."
          </PreviewVerse>
          <PreviewReference>
            John 3:16 (NIV)
          </PreviewReference>
        </PreviewText>
      </PreviewContainer>
    </TypographyContainer>
  );
};

export default TypographySettings;