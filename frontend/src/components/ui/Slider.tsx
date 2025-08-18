/**
 * Slider Component - Accessible range slider for theme controls
 */

import React, { useCallback, useRef } from 'react';
import styled from 'styled-components';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
  className?: string;
}

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const SliderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
`;

const SliderLabel = styled.label`
  color: var(--theme-text-primary);
  font-weight: 500;
  margin: 0;
`;

const SliderValue = styled.span`
  color: var(--theme-text-secondary);
  font-size: 13px;
  font-family: monospace;
  min-width: 50px;
  text-align: right;
`;

const SliderTrack = styled.div`
  position: relative;
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
`;

const SliderInput = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--theme-bg-tertiary);
  outline: none;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }

  &:focus {
    opacity: 1;
    box-shadow: 0 0 0 2px var(--theme-accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Webkit browsers (Chrome, Safari, newer Edge) */
  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--theme-accent);
    border: 2px solid var(--theme-bg-primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: scale(1.2);
    }
  }

  &::-webkit-slider-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    background: var(--theme-bg-tertiary);
    border-radius: 3px;
    border: none;
  }

  /* Firefox */
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--theme-accent);
    border: 2px solid var(--theme-bg-primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: scale(1.2);
    }
  }

  &::-moz-range-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    background: var(--theme-bg-tertiary);
    border-radius: 3px;
    border: none;
  }

  /* IE/Edge */
  &::-ms-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--theme-accent);
    border: 2px solid var(--theme-bg-primary);
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &::-ms-track {
    width: 100%;
    height: 6px;
    cursor: pointer;
    background: transparent;
    border-color: transparent;
    color: transparent;
  }

  &::-ms-fill-lower {
    background: var(--theme-accent);
    border-radius: 3px;
  }

  &::-ms-fill-upper {
    background: var(--theme-bg-tertiary);
    border-radius: 3px;
  }
`;

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  disabled = false,
  showValue = true,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow fine control with arrow keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  }, [value, min, max, step, onChange]);

  const formatValue = useCallback((val: number): string => {
    if (unit === '%') {
      return `${Math.round(val * 100)}%`;
    }
    if (unit === 'px') {
      return `${val}px`;
    }
    if (unit === 's') {
      return `${val.toFixed(1)}s`;
    }
    return val.toString();
  }, [unit]);

  return (
    <SliderContainer className={className}>
      <SliderHeader>
        <SliderLabel htmlFor={`slider-${label}`}>
          {label}
        </SliderLabel>
        {showValue && (
          <SliderValue>
            {formatValue(value)}
          </SliderValue>
        )}
      </SliderHeader>
      <SliderTrack>
        <SliderInput
          ref={inputRef}
          id={`slider-${label}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label={`${label}: ${formatValue(value)}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatValue(value)}
        />
      </SliderTrack>
    </SliderContainer>
  );
};

export default Slider;