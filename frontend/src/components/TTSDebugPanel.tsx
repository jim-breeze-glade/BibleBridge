/**
 * TTS Debug Panel Component
 * Development tool for testing and monitoring the TTS pronunciation system
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  TTSServiceStats,
  PronunciationData,
  PRONUNCIATION_COLORS,
  TTS_CONFIG,
} from '../types';
import { pronunciationService } from '../services/pronunciationService';
import { useTTSAudioManager } from '../hooks/useTTSAudioManager';
import { apiService } from '../services/api';
import AudioControls from './AudioControls';

// Styled Components
const DebugContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: rgba(33, 37, 41, 0.95);
  color: white;
  border-radius: 8px;
  padding: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  z-index: 10000;
  overflow-y: auto;
  transition: all 0.3s ease;

  &.collapsed {
    height: 40px;
    overflow: hidden;
  }
`;

const DebugHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const DebugTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${PRONUNCIATION_COLORS.button.primary};
`;

const CollapseButton = styled.button`
  background: none;
  border: none;
  color: ${PRONUNCIATION_COLORS.button.secondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 3px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const StatsSection = styled.div`
  margin-bottom: 16px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  
  &:nth-child(even) {
    background: rgba(255, 255, 255, 0.05);
    padding: 2px 4px;
    border-radius: 2px;
  }
`;

const StatLabel = styled.span`
  color: ${PRONUNCIATION_COLORS.button.secondary};
`;

const StatValue = styled.span<{ $type?: 'good' | 'warning' | 'danger' }>`
  font-weight: 600;
  color: ${props => {
    switch (props.$type) {
      case 'good': return PRONUNCIATION_COLORS.button.success;
      case 'warning': return PRONUNCIATION_COLORS.button.warning;
      case 'danger': return PRONUNCIATION_COLORS.button.danger;
      default: return 'white';
    }
  }};
`;

const TestSection = styled.div`
  margin-bottom: 16px;
`;

const TestInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: white;
  font-size: 12px;

  &:focus {
    outline: none;
    border-color: ${PRONUNCIATION_COLORS.button.primary};
    background: rgba(255, 255, 255, 0.15);
  }

  &::placeholder {
    color: ${PRONUNCIATION_COLORS.button.secondary};
  }
`;

const TestButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return PRONUNCIATION_COLORS.button.primary;
      case 'secondary': return PRONUNCIATION_COLORS.button.secondary;
      case 'danger': return PRONUNCIATION_COLORS.button.danger;
    }
  }};
  border: none;
  color: white;
  padding: 4px 8px;
  margin: 2px 4px 2px 0;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LogSection = styled.div`
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 8px;
`;

const LogEntry = styled.div<{ $level: 'info' | 'warn' | 'error' }>`
  margin: 2px 0;
  font-size: 10px;
  color: ${props => {
    switch (props.$level) {
      case 'info': return '#adb5bd';
      case 'warn': return PRONUNCIATION_COLORS.button.warning;
      case 'error': return PRONUNCIATION_COLORS.button.danger;
    }
  }};

  &:before {
    content: '[${props => props.$level.toUpperCase()}] ';
    font-weight: bold;
  }
`;

const PronunciationList = styled.div`
  max-height: 120px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  padding: 4px;
  margin-top: 8px;
`;

const PronunciationItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 4px;
  font-size: 10px;
  border-radius: 2px;
  margin: 1px 0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const PronunciationName = styled.span`
  font-weight: 500;
`;

const PronunciationValue = styled.span`
  color: ${PRONUNCIATION_COLORS.button.warning};
  font-family: 'Courier New', monospace;
`;

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export const TTSDebugPanel: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stats, setStats] = useState<TTSServiceStats>({
    cacheSize: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalRequests: 0,
    errors: 0,
    averageResponseTime: 0,
  });
  const [testName, setTestName] = useState('Abraham');
  const [isLoading, setIsLoading] = useState(false);
  const [serviceHealth, setServiceHealth] = useState<any>(null);
  const [pronunciations, setPronunciations] = useState<Record<string, PronunciationData>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedPronunciation, setSelectedPronunciation] = useState<string | null>(null);

  const { playbackState, volume, setVolume, toggleMute } = useTTSAudioManager();

  // Add log entry
  const addLog = useCallback((level: 'info' | 'warn' | 'error', message: string) => {
    setLogs(prev => [
      { timestamp: new Date(), level, message },
      ...prev.slice(0, 99) // Keep only last 100 entries
    ]);
  }, []);

  // Update stats periodically
  useEffect(() => {
    const updateStats = () => {
      const currentStats = pronunciationService.getCacheStats();
      setStats(currentStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [pronunciationData, healthData] = await Promise.all([
          pronunciationService.getAllPronunciations(),
          apiService.getTTSHealth().catch(() => null),
        ]);
        
        setPronunciations(pronunciationData);
        setServiceHealth(healthData);
        addLog('info', `Loaded ${Object.keys(pronunciationData).length} pronunciations`);
      } catch (error) {
        addLog('error', `Failed to load initial data: ${error}`);
      }
    };

    loadData();
  }, [addLog]);

  const handleTestPronunciation = async () => {
    if (!testName.trim() || isLoading) return;

    setIsLoading(true);
    addLog('info', `Testing pronunciation for "${testName}"`);

    try {
      await pronunciationService.playPronunciation(testName);
      addLog('info', `Successfully played pronunciation for "${testName}"`);
    } catch (error) {
      addLog('error', `Failed to play pronunciation for "${testName}": ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      pronunciationService.clearCache();
      addLog('info', 'Cleared pronunciation cache');
    } catch (error) {
      addLog('error', `Failed to clear cache: ${error}`);
    }
  };

  const handlePreloadCommon = async () => {
    setIsLoading(true);
    try {
      const commonNames = pronunciationService.getCommonBiblicalNames();
      await pronunciationService.preloadNames(commonNames);
      addLog('info', `Preloaded ${commonNames.length} common biblical names`);
    } catch (error) {
      addLog('error', `Failed to preload common names: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (available: boolean): 'good' | 'danger' => {
    return available ? 'good' : 'danger';
  };

  const getCacheEfficiency = (): number => {
    const total = stats.cacheHits + stats.cacheMisses;
    return total > 0 ? (stats.cacheHits / total) * 100 : 0;
  };

  const getEfficiencyColor = (efficiency: number): 'good' | 'warning' | 'danger' => {
    if (efficiency >= 80) return 'good';
    if (efficiency >= 50) return 'warning';
    return 'danger';
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't render in production
  }

  return (
    <DebugContainer className={isCollapsed ? 'collapsed' : ''}>
      <DebugHeader>
        <DebugTitle>TTS Debug Panel</DebugTitle>
        <CollapseButton onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '▲' : '▼'}
        </CollapseButton>
      </DebugHeader>

      {!isCollapsed && (
        <>
          {/* Service Health */}
          <StatsSection>
            <h4>Service Health</h4>
            <StatRow>
              <StatLabel>TTS Service:</StatLabel>
              <StatValue $type={getHealthColor(serviceHealth?.available ?? false)}>
                {serviceHealth?.available ? 'Available' : 'Unavailable'}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Pronunciation Service:</StatLabel>
              <StatValue $type={getHealthColor(pronunciationService.isServiceAvailable())}>
                {pronunciationService.isServiceAvailable() ? 'Available' : 'Unavailable'}
              </StatValue>
            </StatRow>
          </StatsSection>

          {/* Performance Stats */}
          <StatsSection>
            <h4>Performance Stats</h4>
            <StatRow>
              <StatLabel>Cache Size:</StatLabel>
              <StatValue>{stats.cacheSize}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Total Requests:</StatLabel>
              <StatValue>{stats.totalRequests}</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Cache Efficiency:</StatLabel>
              <StatValue $type={getEfficiencyColor(getCacheEfficiency())}>
                {getCacheEfficiency().toFixed(1)}%
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Errors:</StatLabel>
              <StatValue $type={stats.errors > 0 ? 'warning' : 'good'}>
                {stats.errors}
              </StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>Avg Response Time:</StatLabel>
              <StatValue>{stats.averageResponseTime.toFixed(0)}ms</StatValue>
            </StatRow>
          </StatsSection>

          {/* Audio Controls */}
          <StatsSection>
            <h4>Audio Controls</h4>
            <AudioControls
              isPlaying={playbackState.isPlaying}
              volume={volume}
              muted={playbackState.muted}
              onPlay={() => {}}
              onPause={() => {}}
              onStop={() => {}}
              onVolumeChange={setVolume}
              onMuteToggle={toggleMute}
              size="small"
            />
          </StatsSection>

          {/* Test Section */}
          <TestSection>
            <h4>Test Pronunciation</h4>
            <TestInput
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Enter biblical name to test"
              onKeyPress={(e) => e.key === 'Enter' && handleTestPronunciation()}
            />
            <div>
              <TestButton
                $variant="primary"
                onClick={handleTestPronunciation}
                disabled={isLoading}
              >
                {isLoading ? 'Testing...' : 'Test'}
              </TestButton>
              <TestButton
                $variant="secondary"
                onClick={handlePreloadCommon}
                disabled={isLoading}
              >
                Preload Common
              </TestButton>
              <TestButton
                $variant="danger"
                onClick={handleClearCache}
              >
                Clear Cache
              </TestButton>
            </div>
          </TestSection>

          {/* Pronunciations List */}
          <StatsSection>
            <h4>Available Pronunciations ({Object.keys(pronunciations).length})</h4>
            <PronunciationList>
              {Object.entries(pronunciations).slice(0, 20).map(([name, data]) => (
                <PronunciationItem 
                  key={name}
                  onClick={() => setTestName(name)}
                  style={{ cursor: 'pointer' }}
                >
                  <PronunciationName>{name}</PronunciationName>
                  <PronunciationValue>
                    {data.phonetic || data.ipa || data.phoneme || 'N/A'}
                  </PronunciationValue>
                </PronunciationItem>
              ))}
              {Object.keys(pronunciations).length > 20 && (
                <PronunciationItem>
                  <span style={{ fontStyle: 'italic', opacity: 0.7 }}>
                    ...and {Object.keys(pronunciations).length - 20} more
                  </span>
                </PronunciationItem>
              )}
            </PronunciationList>
          </StatsSection>

          {/* Logs */}
          <StatsSection>
            <h4>Logs ({logs.length})</h4>
            <LogSection>
              {logs.slice(0, 50).map((log, index) => (
                <LogEntry key={index} $level={log.level}>
                  {log.timestamp.toLocaleTimeString()}: {log.message}
                </LogEntry>
              ))}
            </LogSection>
          </StatsSection>
        </>
      )}
    </DebugContainer>
  );
};

export default TTSDebugPanel;