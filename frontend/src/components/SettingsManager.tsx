/**
 * SettingsManager Component - Main coordinator for settings UI
 */

import React, { useState, useCallback } from 'react';
import SettingsButton from './settings/SettingsButton';
import SettingsPanel from './settings/SettingsPanel';
import { ThemeProvider } from '../context/ThemeContext';

interface SettingsManagerProps {
  children: React.ReactNode;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ children }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  return (
    <ThemeProvider>
      {children}
      
      <SettingsButton
        isOpen={isPanelOpen}
        onClick={handleTogglePanel}
      />
      
      <SettingsPanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />
    </ThemeProvider>
  );
};

export default SettingsManager;