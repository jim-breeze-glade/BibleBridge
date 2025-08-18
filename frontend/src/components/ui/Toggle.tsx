/**
 * Toggle Component - Accessible toggle switch for boolean settings
 */

import React, { useCallback } from 'react';
import styled from 'styled-components';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
  className?: string;
}

const ToggleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ToggleLabelGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ToggleLabel = styled.label<{ disabled?: boolean }>`
  color: var(--theme-text-primary);
  font-weight: 500;
  font-size: 14px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  margin: 0;
  transition: opacity 0.2s ease;
`;

const ToggleDescription = styled.span<{ disabled?: boolean }>`
  color: var(--theme-text-secondary);
  font-size: 13px;
  opacity: ${props => props.disabled ? 0.5 : 1};
  line-height: 1.3;
  margin-top: 2px;
`;

const ToggleSwitch = styled.div<{ checked: boolean; disabled?: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  background: ${props => 
    props.checked 
      ? 'var(--theme-accent)' 
      : 'var(--theme-bg-tertiary)'
  };
  border-radius: 12px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: all 0.3s ease;
  border: 2px solid transparent;
  flex-shrink: 0;

  &:focus-within {
    box-shadow: 0 0 0 2px var(--theme-accent);
  }

  &:hover {
    opacity: ${props => props.disabled ? 0.5 : 0.8};
  }
`;

const ToggleThumb = styled.div<{ checked: boolean }>`
  position: absolute;
  top: 2px;
  left: ${props => props.checked ? '22px' : '2px'};
  width: 16px;
  height: 16px;
  background: var(--theme-bg-primary);
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: inherit;

  &:focus {
    outline: none;
  }
`;

const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  description,
  className,
}) => {
  const handleToggle = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, onChange, disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  const toggleId = `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <ToggleContainer className={className}>
      <ToggleRow>
        <ToggleLabelGroup>
          <ToggleLabel 
            htmlFor={toggleId}
            disabled={disabled}
            onClick={handleToggle}
          >
            {label}
          </ToggleLabel>
          {description && (
            <ToggleDescription disabled={disabled}>
              {description}
            </ToggleDescription>
          )}
        </ToggleLabelGroup>
        
        <ToggleSwitch
          checked={checked}
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="switch"
          aria-checked={checked}
          aria-labelledby={toggleId}
          aria-disabled={disabled}
        >
          <HiddenInput
            id={toggleId}
            type="checkbox"
            checked={checked}
            onChange={handleToggle}
            disabled={disabled}
            aria-hidden="true"
            tabIndex={-1}
          />
          <ToggleThumb checked={checked} />
        </ToggleSwitch>
      </ToggleRow>
    </ToggleContainer>
  );
};

export default Toggle;