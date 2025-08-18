/**
 * ThemeSettings Component - Dark/light mode controls
 */

import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import Select from '../ui/Select';

const ThemeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text-primary);
  border-bottom: 2px solid var(--theme-border);
  padding-bottom: 8px;
`;

const ThemePreview = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
`;

const PreviewCard = styled.div<{ isActive: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: 2px solid ${props => 
    props.isActive ? 'var(--theme-accent)' : 'var(--theme-border)'
  };
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: var(--theme-accent);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 20px;
    background: ${props => props.isActive ? 'var(--theme-accent)' : 'transparent'};
    opacity: ${props => props.isActive ? 1 : 0};
    transition: opacity 0.2s ease;
  }
`;

const LightPreview = styled(PreviewCard)`
  background: #ffffff;
  color: #212529;

  .preview-text {
    color: #212529;
  }

  .preview-accent {
    color: #007bff;
  }
`;

const DarkPreview = styled(PreviewCard)`
  background: #1a1d23;
  color: #f8f9fa;

  .preview-text {
    color: #f8f9fa;
  }

  .preview-accent {
    color: #4dabf7;
  }
`;

const PreviewContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
`;

const PreviewTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
`;

const PreviewText = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

const PreviewAccent = styled.div`
  font-size: 12px;
  font-weight: 500;
`;

const SystemInfoText = styled.p`
  margin: 8px 0 0 0;
  font-size: 13px;
  color: var(--theme-text-secondary);
  font-style: italic;
`;

const ThemeSettings: React.FC = () => {
  const { theme, actions } = useTheme();

  const themeOptions = [
    {
      value: 'light',
      label: 'Light Mode',
    },
    {
      value: 'dark', 
      label: 'Dark Mode',
    },
    {
      value: 'system',
      label: 'System Default',
    },
  ];

  const handleThemeChange = useCallback((value: string) => {
    actions.setThemeMode(value as ThemeMode);
  }, [actions]);

  const handlePreviewClick = useCallback((mode: 'light' | 'dark') => {
    actions.setThemeMode(mode);
  }, [actions]);

  return (
    <ThemeContainer>
      <SectionTitle>Theme</SectionTitle>
      
      <Select
        label="Color Scheme"
        value={theme.mode}
        options={themeOptions}
        onChange={handleThemeChange}
        placeholder="Select theme mode..."
      />

      {theme.mode === 'system' && (
        <SystemInfoText>
          Using system preference: <strong>{theme.systemPreference}</strong>
          <br />
          Currently displaying: <strong>{theme.effectiveTheme}</strong> mode
        </SystemInfoText>
      )}

      <ThemePreview>
        <LightPreview
          isActive={theme.effectiveTheme === 'light'}
          onClick={() => handlePreviewClick('light')}
          role="button"
          tabIndex={0}
          aria-label="Switch to light mode"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePreviewClick('light');
            }
          }}
        >
          <PreviewTitle>Light</PreviewTitle>
          <PreviewContent>
            <PreviewText className="preview-text">
              The light shall shine upon you
            </PreviewText>
            <PreviewAccent className="preview-accent">
              John 8:12
            </PreviewAccent>
          </PreviewContent>
        </LightPreview>

        <DarkPreview
          isActive={theme.effectiveTheme === 'dark'}
          onClick={() => handlePreviewClick('dark')}
          role="button"
          tabIndex={0}
          aria-label="Switch to dark mode"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handlePreviewClick('dark');
            }
          }}
        >
          <PreviewTitle>Dark</PreviewTitle>
          <PreviewContent>
            <PreviewText className="preview-text">
              In darkness you will find peace
            </PreviewText>
            <PreviewAccent className="preview-accent">
              Psalm 23:4
            </PreviewAccent>
          </PreviewContent>
        </DarkPreview>
      </ThemePreview>
    </ThemeContainer>
  );
};

export default ThemeSettings;