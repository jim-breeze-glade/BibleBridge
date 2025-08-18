/**
 * Select Component - Accessible dropdown select for theme options
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const SelectLabel = styled.label<{ disabled?: boolean }>`
  color: var(--theme-text-primary);
  font-weight: 500;
  font-size: 14px;
  margin: 0;
  opacity: ${props => props.disabled ? 0.5 : 1};
`;

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const SelectButton = styled.button<{ hasValue: boolean; disabled?: boolean }>`
  width: 100%;
  height: 40px;
  padding: 8px 40px 8px 12px;
  background: var(--theme-bg-primary);
  border: 2px solid var(--theme-border);
  border-radius: 8px;
  color: ${props => 
    props.hasValue 
      ? 'var(--theme-text-primary)' 
      : 'var(--theme-text-muted)'
  };
  font-size: 14px;
  text-align: left;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    border-color: ${props => props.disabled ? 'var(--theme-border)' : 'var(--theme-accent)'};
  }

  &:focus {
    outline: none;
    border-color: var(--theme-accent);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  }

  &[aria-expanded="true"] {
    border-color: var(--theme-accent);
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
  }
`;

const SelectIcon = styled.span<{ isOpen: boolean }>`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%) ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  color: var(--theme-text-secondary);
  font-size: 12px;
  pointer-events: none;
  transition: transform 0.2s ease;

  &::after {
    content: '▼';
  }
`;

const SelectDropdown = styled.ul<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--theme-bg-primary);
  border: 2px solid var(--theme-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  margin: 4px 0 0 0;
  padding: 0;
  list-style: none;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.isOpen ? 0 : '-8px'});
  transition: all 0.2s ease;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--theme-bg-tertiary);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--theme-scrollbar);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--theme-text-muted);
  }
`;

const SelectOption = styled.li<{ isSelected: boolean; disabled?: boolean }>`
  padding: 10px 12px;
  color: ${props => 
    props.disabled 
      ? 'var(--theme-text-muted)' 
      : props.isSelected 
        ? 'var(--theme-accent)' 
        : 'var(--theme-text-primary)'
  };
  background: ${props => 
    props.isSelected && !props.disabled 
      ? 'rgba(0, 123, 255, 0.1)' 
      : 'transparent'
  };
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 14px;
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};
  border-radius: 6px;
  margin: 2px;

  &:hover {
    background: ${props => 
      props.disabled 
        ? 'transparent' 
        : props.isSelected
          ? 'rgba(0, 123, 255, 0.15)'
          : 'var(--theme-bg-secondary)'
    };
  }

  &:focus {
    outline: none;
    background: ${props => 
      props.disabled 
        ? 'transparent' 
        : 'rgba(0, 123, 255, 0.1)'
    };
  }

  &[aria-selected="true"] {
    font-weight: 500;
  }
`;

const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "Select an option...",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const selectRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption?.label || placeholder;

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
  }, []);

  const openDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      const selectedIndex = options.findIndex(option => option.value === value);
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [disabled, options, value]);

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    closeDropdown();
    selectRef.current?.focus();
  }, [onChange, closeDropdown]);

  const handleButtonClick = useCallback(() => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }, [isOpen, closeDropdown, openDropdown]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && focusedIndex < options.length) {
          const option = options[focusedIndex];
          if (!option.disabled) {
            handleSelect(option.value);
          }
        } else {
          openDropdown();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          const availableOptions = options.filter(opt => !opt.disabled);
          const currentInAvailable = availableOptions.findIndex(opt => opt.value === options[focusedIndex]?.value);
          const nextIndex = currentInAvailable < availableOptions.length - 1 ? currentInAvailable + 1 : 0;
          const nextOption = availableOptions[nextIndex];
          const nextFocusedIndex = options.findIndex(opt => opt.value === nextOption.value);
          setFocusedIndex(nextFocusedIndex);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else {
          const availableOptions = options.filter(opt => !opt.disabled);
          const currentInAvailable = availableOptions.findIndex(opt => opt.value === options[focusedIndex]?.value);
          const prevIndex = currentInAvailable > 0 ? currentInAvailable - 1 : availableOptions.length - 1;
          const prevOption = availableOptions[prevIndex];
          const prevFocusedIndex = options.findIndex(opt => opt.value === prevOption.value);
          setFocusedIndex(prevFocusedIndex);
        }
        break;

      case 'Escape':
      case 'Tab':
        closeDropdown();
        break;

      default:
        break;
    }
  }, [disabled, isOpen, focusedIndex, options, handleSelect, openDropdown, closeDropdown]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current && 
        !selectRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, closeDropdown]);

  const selectId = `select-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <SelectContainer className={className}>
      <SelectLabel htmlFor={selectId} disabled={disabled}>
        {label}
      </SelectLabel>
      <SelectWrapper>
        <SelectButton
          ref={selectRef}
          id={selectId}
          type="button"
          hasValue={!!selectedOption}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={`${selectId}-label`}
          onClick={handleButtonClick}
          onKeyDown={handleKeyDown}
        >
          {displayValue}
        </SelectButton>
        <SelectIcon isOpen={isOpen} />
        
        <SelectDropdown
          ref={dropdownRef}
          isOpen={isOpen}
          role="listbox"
          aria-labelledby={selectId}
        >
          {options.map((option, index) => (
            <SelectOption
              key={option.value}
              isSelected={option.value === value}
              disabled={option.disabled}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => !option.disabled && handleSelect(option.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!option.disabled) {
                    handleSelect(option.value);
                  }
                }
              }}
              style={{
                background: focusedIndex === index && !option.disabled ? 'rgba(0, 123, 255, 0.1)' : undefined,
              }}
            >
              {option.label}
            </SelectOption>
          ))}
        </SelectDropdown>
      </SelectWrapper>
    </SelectContainer>
  );
};

export default Select;