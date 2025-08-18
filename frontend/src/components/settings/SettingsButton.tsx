/**
 * SettingsButton Component - Toggle button for opening settings panel
 */

import React from 'react';
import styled from 'styled-components';

interface SettingsButtonProps {
  isOpen: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const StyledButton = styled.button<{ isOpen: boolean }>`
  position: fixed;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: var(--theme-accent);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1001;
  
  &:hover {
    background: var(--theme-accent);
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.3), 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Animation for icon rotation */
  .settings-icon {
    transition: transform 0.3s ease;
    transform: ${props => props.isOpen ? 'rotate(45deg)' : 'rotate(0deg)'};
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    top: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
    font-size: 18px;
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    
    .settings-icon {
      transition: none;
    }

    &:hover {
      transform: none;
    }
  }
`;

const SettingsIcon = styled.span`
  display: inline-block;
  font-size: inherit;
  line-height: 1;
`;

const SettingsButton: React.FC<SettingsButtonProps> = ({
  isOpen,
  onClick,
  disabled = false,
  className,
}) => {
  return (
    <StyledButton
      isOpen={isOpen}
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={isOpen ? 'Close settings panel' : 'Open settings panel'}
      aria-expanded={isOpen}
      title={isOpen ? 'Close settings' : 'Open settings'}
    >
      <SettingsIcon className="settings-icon">
        {isOpen ? '✕' : '⚙️'}
      </SettingsIcon>
    </StyledButton>
  );
};

export default SettingsButton;