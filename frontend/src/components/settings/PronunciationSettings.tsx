/**
 * PronunciationSettings Component - TTS and pronunciation preferences
 */

import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useBible } from '../../context/BibleContext';
import Toggle from '../ui/Toggle';
import Select from '../ui/Select';
import Slider from '../ui/Slider';

const PronunciationContainer = styled.div`
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

const InfoText = styled.p`
  margin: 8px 0 0 0;
  font-size: 13px;
  color: var(--theme-text-secondary);
  font-style: italic;
  line-height: 1.4;
`;

const PreviewContainer = styled.div`
  background: var(--theme-bg-secondary);
  border: 2px solid var(--theme-border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
`;

const TestButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const TestButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 12px;
  background: ${props => 
    props.variant === 'primary' 
      ? 'var(--theme-accent)' 
      : 'var(--theme-bg-tertiary)'
  };
  border: 2px solid ${props => 
    props.variant === 'primary' 
      ? 'var(--theme-accent)' 
      : 'var(--theme-border)'
  };
  border-radius: 6px;
  color: ${props => 
    props.variant === 'primary' 
      ? 'white' 
      : 'var(--theme-text-primary)'
  };
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 0 0 auto;

  &:hover {
    background: ${props => 
      props.variant === 'primary' 
        ? 'var(--theme-accent)' 
        : 'var(--theme-bg-secondary)'
    };
    border-color: var(--theme-accent);
    transform: translateY(-1px);
  }

  &:focus {
    outline: none;
    border-color: var(--theme-accent);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusIndicator = styled.div<{ status: 'available' | 'unavailable' | 'testing' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${props => {
    switch (props.status) {
      case 'available': return 'var(--theme-success)';
      case 'unavailable': return 'var(--theme-error)';
      case 'testing': return 'var(--theme-warning)';
      default: return 'var(--theme-text-muted)';
    }
  }};

  &::before {
    content: ${props => {
      switch (props.status) {
        case 'available': return '"●"';
        case 'unavailable': return '"●"';
        case 'testing': return '"◐"';
        default: return '"○"';
      }
    }};
    font-size: 8px;
  }
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

const PronunciationSettings: React.FC = () => {
  const { state, actions } = useBible();
  const [testingTTS, setTestingTTS] = React.useState(false);
  const [ttsStatus, setTtsStatus] = React.useState<'available' | 'unavailable' | 'testing'>('available');

  const pronunciationStyleOptions = [
    {
      value: 'phonetic',
      label: 'Phonetic (Traditional)',
    },
    {
      value: 'ipa', 
      label: 'IPA (International)',
    },
  ];

  const handleShowPronunciationsChange = useCallback((enabled: boolean) => {
    actions.updateUserSettings({ showPronunciations: enabled });
  }, [actions]);

  const handlePronunciationStyleChange = useCallback((style: string) => {
    actions.updateUserSettings({ pronunciationStyle: style as 'phonetic' | 'ipa' });
  }, [actions]);

  const handleTtsEnabledChange = useCallback((enabled: boolean) => {
    actions.updateUserSettings({ ttsEnabled: enabled });
  }, [actions]);

  const handleTestTTS = useCallback(async (text: string, name?: string) => {
    if (testingTTS) return;

    setTestingTTS(true);
    setTtsStatus('testing');

    try {
      await actions.playTTS(text, name);
      setTtsStatus('available');
    } catch (error) {
      console.error('TTS test failed:', error);
      setTtsStatus('unavailable');
    } finally {
      setTestingTTS(false);
    }
  }, [actions, testingTTS]);

  const handleReset = useCallback(() => {
    actions.updateUserSettings({
      showPronunciations: true,
      pronunciationStyle: 'phonetic',
      ttsEnabled: true,
    });
  }, [actions]);

  // Test TTS service availability on mount
  React.useEffect(() => {
    const checkTTSAvailability = async () => {
      try {
        // Try a simple TTS test
        await handleTestTTS('Test', 'availability-check');
      } catch (error) {
        setTtsStatus('unavailable');
      }
    };

    if (state.userSettings.ttsEnabled) {
      checkTTSAvailability();
    }
  }, [state.userSettings.ttsEnabled, handleTestTTS]);

  return (
    <PronunciationContainer>
      <SectionTitle>Pronunciation & Audio</SectionTitle>
      
      <InfoText>
        Configure how biblical names are displayed with pronunciation guides and 
        text-to-speech audio for proper pronunciation learning.
      </InfoText>

      <ControlsGroup>
        <Toggle
          label="Show Pronunciations"
          checked={state.userSettings.showPronunciations}
          onChange={handleShowPronunciationsChange}
          description="Display pronunciation guides for biblical names and places"
        />

        {state.userSettings.showPronunciations && (
          <Select
            label="Pronunciation Style"
            value={state.userSettings.pronunciationStyle}
            options={pronunciationStyleOptions}
            onChange={handlePronunciationStyleChange}
            placeholder="Select pronunciation format..."
          />
        )}

        <Toggle
          label="Text-to-Speech (TTS)"
          checked={state.userSettings.ttsEnabled}
          onChange={handleTtsEnabledChange}
          description="Enable audio pronunciation playback for biblical names"
        />

        <ResetButton onClick={handleReset}>
          Reset Pronunciation Settings
        </ResetButton>
      </ControlsGroup>

      {state.userSettings.showPronunciations && (
        <PreviewContainer>
          <div style={{ marginBottom: '12px' }}>
            <strong>Pronunciation Preview:</strong>
          </div>
          
          <div style={{ 
            fontFamily: 'var(--theme-font-family)',
            fontSize: 'var(--theme-font-size)',
            lineHeight: '1.6',
            color: 'var(--theme-text-primary)',
            marginBottom: '8px'
          }}>
            And the angel said unto her, Fear not, Mary: for thou hast found favour with God. And, behold, thou shalt conceive in thy womb, and bring forth a son, and shalt call his name{' '}
            <span style={{ 
              color: 'var(--theme-accent)', 
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              Jesus [{state.userSettings.pronunciationStyle === 'ipa' ? 'ˈdʒiːzəs' : 'JEE-zus'}]
            </span>.
          </div>
          
          <div style={{ 
            fontSize: '13px', 
            color: 'var(--theme-text-secondary)',
            marginBottom: '12px'
          }}>
            Luke 1:30-31 (KJV) - Example showing {state.userSettings.pronunciationStyle === 'ipa' ? 'IPA' : 'phonetic'} pronunciation
          </div>

          {state.userSettings.ttsEnabled && (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '8px',
                fontSize: '13px'
              }}>
                <span>TTS Service:</span>
                <StatusIndicator status={ttsStatus}>
                  {ttsStatus === 'available' && 'Available'}
                  {ttsStatus === 'unavailable' && 'Unavailable'}
                  {ttsStatus === 'testing' && 'Testing...'}
                </StatusIndicator>
              </div>

              <TestButtonGroup>
                <TestButton
                  variant="primary"
                  onClick={() => handleTestTTS('Jesus', 'Jesus')}
                  disabled={testingTTS}
                >
                  {testingTTS ? 'Playing...' : '🔊 Test "Jesus"'}
                </TestButton>
                
                <TestButton
                  onClick={() => handleTestTTS('Jerusalem', 'Jerusalem')}
                  disabled={testingTTS}
                >
                  🔊 Test "Jerusalem"
                </TestButton>
                
                <TestButton
                  onClick={() => handleTestTTS('Nebuchadnezzar', 'Nebuchadnezzar')}
                  disabled={testingTTS}
                >
                  🔊 Test "Nebuchadnezzar"
                </TestButton>
              </TestButtonGroup>
            </div>
          )}
        </PreviewContainer>
      )}
    </PronunciationContainer>
  );
};

export default PronunciationSettings;