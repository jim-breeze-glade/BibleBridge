/**
 * SettingsPanel Component - Main collapsible settings interface
 */

import React, { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import ThemeSettings from './ThemeSettings';
import TypographySettings from './TypographySettings';
import RedLetterSettings from './RedLetterSettings';
import PronunciationSettings from './PronunciationSettings';
import LayoutSettings from './LayoutSettings';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PanelOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    background: rgba(0, 0, 0, 0.7);
  }
`;

const PanelContainer = styled.aside<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 400px;
  max-width: 90vw;
  background: var(--theme-bg-primary);
  border-left: 2px solid var(--theme-border);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 768px) {
    width: 100vw;
    max-width: 100vw;
    border-left: none;
  }

  /* Custom scrollbar */
  * {
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: var(--theme-bg-tertiary);
    }

    &::-webkit-scrollbar-thumb {
      background: var(--theme-scrollbar);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: var(--theme-text-muted);
    }
  }
`;

const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 2px solid var(--theme-border);
  background: var(--theme-bg-primary);
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 16px 20px;
  }
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--theme-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '⚙️';
    font-size: 18px;
  }

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--theme-bg-tertiary);
  color: var(--theme-text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  line-height: 1;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--theme-bg-secondary);
    transform: scale(1.05);
  }

  &:focus {
    outline: none;
    background: var(--theme-bg-secondary);
    box-shadow: 0 0 0 2px var(--theme-accent);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  @media (max-width: 768px) {
    padding: 20px;
    gap: 28px;
  }
`;

const Separator = styled.hr`
  border: none;
  height: 2px;
  background: var(--theme-border);
  margin: 8px 0;
  border-radius: 1px;
`;

const PanelFooter = styled.footer`
  padding: 16px 24px;
  border-top: 2px solid var(--theme-border);
  background: var(--theme-bg-secondary);
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 16px 20px;
  }
`;

const FooterText = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--theme-text-secondary);
  text-align: center;
  line-height: 1.4;
`;

const KeyboardHint = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: var(--theme-text-muted);
  text-align: center;

  kbd {
    background: var(--theme-bg-tertiary);
    border: 1px solid var(--theme-border);
    border-radius: 3px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 11px;
  }
`;

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
}) => {
  const panelRef = useRef<HTMLElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      lastFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the panel
      setTimeout(() => {
        panelRef.current?.focus();
      }, 100);
    } else {
      // Restore focus when closing
      if (lastFocusRef.current) {
        lastFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <PanelOverlay
      isOpen={isOpen}
      onClick={handleOverlayClick}
      aria-hidden={!isOpen}
    >
      <PanelContainer
        ref={panelRef}
        isOpen={isOpen}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
      >
        <PanelHeader>
          <PanelTitle id="settings-title">
            Settings
          </PanelTitle>
          <CloseButton
            onClick={handleCloseClick}
            aria-label="Close settings panel"
            title="Close settings (Esc)"
          >
            ✕
          </CloseButton>
        </PanelHeader>

        <PanelContent>
          <ThemeSettings />
          <Separator />
          <TypographySettings />
          <Separator />
          <RedLetterSettings />
          <Separator />
          <PronunciationSettings />
          <Separator />
          <LayoutSettings />
        </PanelContent>

        <PanelFooter>
          <FooterText>
            Settings are saved automatically and synchronized across your devices.
          </FooterText>
          <KeyboardHint>
            Press <kbd>Esc</kbd> to close
          </KeyboardHint>
        </PanelFooter>
      </PanelContainer>
    </PanelOverlay>
  );
};

export default SettingsPanel;