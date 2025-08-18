/**
 * Theme Context - Global theme management with CSS custom properties
 * Supports dark/light mode, typography controls, and red letter text settings
 */

import React, { createContext, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useBible } from './BibleContext';
import { UserSettings } from '../types';

// Theme-related types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  systemPreference: 'light' | 'dark';
  fontSize: number;
  fontFamily: string;
  textBrightness: number;
  showRedLetters: boolean;
  redLetterBrightness: number;
  rgbWaveEnabled: boolean;
  rgbWaveSpeed: number;
}

export interface ThemeContextType {
  theme: ThemeState;
  actions: {
    setThemeMode: (mode: ThemeMode) => void;
    setFontSize: (size: number) => void;
    setFontFamily: (family: string) => void;
    setTextBrightness: (brightness: number) => void;
    setShowRedLetters: (show: boolean) => void;
    setRedLetterBrightness: (brightness: number) => void;
    setRgbWaveEnabled: (enabled: boolean) => void;
    setRgbWaveSpeed: (speed: number) => void;
    resetToDefaults: () => void;
  };
}

// CSS custom property mappings
const CSS_PROPERTIES = {
  // Theme colors
  '--theme-bg-primary': 'background-color-primary',
  '--theme-bg-secondary': 'background-color-secondary',
  '--theme-bg-tertiary': 'background-color-tertiary',
  '--theme-text-primary': 'text-color-primary',
  '--theme-text-secondary': 'text-color-secondary',
  '--theme-text-muted': 'text-color-muted',
  '--theme-border': 'border-color',
  '--theme-accent': 'accent-color',
  '--theme-error': 'error-color',
  '--theme-success': 'success-color',
  '--theme-warning': 'warning-color',
  
  // Typography
  '--theme-font-family': 'font-family',
  '--theme-font-size': 'font-size',
  '--theme-line-height': 'line-height',
  '--theme-text-brightness': 'text-brightness',
  
  // Red letter text
  '--theme-red-letter-color': 'red-letter-color',
  '--theme-red-letter-brightness': 'red-letter-brightness',
  
  // RGB wave animation
  '--theme-rgb-wave-enabled': 'rgb-wave-enabled',
  '--theme-rgb-wave-speed': 'rgb-wave-speed',
  
  // Component-specific
  '--theme-verse-hover-bg': 'verse-hover-background',
  '--theme-button-bg': 'button-background',
  '--theme-button-text': 'button-text',
  '--theme-tooltip-bg': 'tooltip-background',
  '--theme-tooltip-text': 'tooltip-text',
  '--theme-scrollbar': 'scrollbar-color',
} as const;

// Theme configurations
const THEME_COLORS = {
  light: {
    '--theme-bg-primary': '#ffffff',
    '--theme-bg-secondary': '#f8f9fa',
    '--theme-bg-tertiary': '#e9ecef',
    '--theme-text-primary': '#212529',
    '--theme-text-secondary': '#495057',
    '--theme-text-muted': '#6c757d',
    '--theme-border': '#dee2e6',
    '--theme-accent': '#007bff',
    '--theme-error': '#dc3545',
    '--theme-success': '#28a745',
    '--theme-warning': '#ffc107',
    '--theme-verse-hover-bg': 'rgba(0, 123, 255, 0.1)',
    '--theme-button-bg': '#007bff',
    '--theme-button-text': '#ffffff',
    '--theme-tooltip-bg': '#333333',
    '--theme-tooltip-text': '#ffffff',
    '--theme-scrollbar': '#adb5bd',
  },
  dark: {
    '--theme-bg-primary': '#1a1d23',
    '--theme-bg-secondary': '#252a31',
    '--theme-bg-tertiary': '#343a46',
    '--theme-text-primary': '#f8f9fa',
    '--theme-text-secondary': '#e9ecef',
    '--theme-text-muted': '#adb5bd',
    '--theme-border': '#495057',
    '--theme-accent': '#4dabf7',
    '--theme-error': '#ff6b6b',
    '--theme-success': '#51cf66',
    '--theme-warning': '#ffd43b',
    '--theme-verse-hover-bg': 'rgba(77, 171, 247, 0.1)',
    '--theme-button-bg': '#4dabf7',
    '--theme-button-text': '#ffffff',
    '--theme-tooltip-bg': '#495057',
    '--theme-tooltip-text': '#f8f9fa',
    '--theme-scrollbar': '#6c757d',
  },
} as const;

// Font options
export const FONT_FAMILIES = [
  { name: 'Georgia', value: 'Georgia, "Times New Roman", Times, serif' },
  { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { name: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { name: 'System Default', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
] as const;

// Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { state: bibleState, actions: bibleActions } = useBible();
  
  // Get system theme preference
  const getSystemPreference = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Initialize theme state from Bible context
  const initializeTheme = useCallback((): ThemeState => {
    const settings = bibleState.userSettings;
    const systemPreference = getSystemPreference();
    
    // Handle theme mode properly - if theme is 'system', use system preference
    let mode: ThemeMode = 'light';
    if (settings.theme === 'dark' || settings.theme === 'light') {
      mode = settings.theme;
    } else {
      mode = 'system';
    }
    
    const effectiveTheme = mode === 'system' ? systemPreference : mode as 'light' | 'dark';

    return {
      mode,
      effectiveTheme,
      systemPreference,
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      textBrightness: settings.textBrightness,
      showRedLetters: settings.showRedLetters,
      redLetterBrightness: settings.redLetterBrightness,
      rgbWaveEnabled: settings.rgbWaveEnabled,
      rgbWaveSpeed: settings.rgbWaveSpeed,
    };
  }, [bibleState.userSettings, getSystemPreference]);

  const [theme, setTheme] = React.useState<ThemeState>(initializeTheme);

  // Update CSS custom properties
  const updateCSSProperties = useCallback((themeState: ThemeState) => {
    const root = document.documentElement;
    const colors = THEME_COLORS[themeState.effectiveTheme];

    // Apply color scheme
    Object.entries(colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply typography settings
    root.style.setProperty('--theme-font-family', themeState.fontFamily);
    root.style.setProperty('--theme-font-size', `${themeState.fontSize}px`);
    root.style.setProperty('--theme-line-height', bibleState.userSettings.lineHeight?.toString() || '1.6');
    root.style.setProperty('--theme-text-brightness', themeState.textBrightness.toString());

    // Apply layout settings
    root.style.setProperty('--theme-sidebar-width', `${bibleState.userSettings.sidebarWidth || 300}px`);
    root.style.setProperty('--theme-panel-spacing', `${bibleState.userSettings.panelSpacing || 16}px`);

    // Apply red letter text settings
    root.style.setProperty('--theme-red-letter-color', themeState.effectiveTheme === 'dark' ? '#ff6b6b' : '#dc3545');
    root.style.setProperty('--theme-red-letter-brightness', themeState.redLetterBrightness.toString());

    // Apply RGB wave animation settings
    root.style.setProperty('--theme-rgb-wave-enabled', themeState.rgbWaveEnabled ? '1' : '0');
    root.style.setProperty('--theme-rgb-wave-speed', `${themeState.rgbWaveSpeed}s`);

    // Set color scheme for better browser integration
    root.style.setProperty('color-scheme', themeState.effectiveTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors['--theme-bg-primary']);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const systemPreference = e.matches ? 'dark' : 'light';
      setTheme(prev => ({
        ...prev,
        systemPreference,
        effectiveTheme: prev.mode === 'system' ? systemPreference : prev.effectiveTheme,
      }));
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  // Update theme when Bible context settings change
  useEffect(() => {
    setTheme(initializeTheme());
  }, [initializeTheme]);

  // Apply CSS properties when theme changes
  useEffect(() => {
    updateCSSProperties(theme);
  }, [theme, updateCSSProperties]);

  // Apply initial theme on mount
  useEffect(() => {
    updateCSSProperties(theme);
  }, []);

  // Theme actions
  const setThemeMode = useCallback((mode: ThemeMode) => {
    const systemPreference = getSystemPreference();
    let effectiveTheme: 'light' | 'dark';
    
    if (mode === 'system') {
      effectiveTheme = systemPreference;
    } else {
      effectiveTheme = mode as 'light' | 'dark';
    }

    setTheme(prev => ({
      ...prev,
      mode,
      effectiveTheme,
    }));

    // Update Bible context
    bibleActions.updateUserSettings({ theme: effectiveTheme });
  }, [getSystemPreference, bibleActions]);

  const setFontSize = useCallback((fontSize: number) => {
    const clampedSize = Math.max(12, Math.min(32, fontSize));
    setTheme(prev => ({ ...prev, fontSize: clampedSize }));
    bibleActions.updateUserSettings({ fontSize: clampedSize });
  }, [bibleActions]);

  const setFontFamily = useCallback((fontFamily: string) => {
    setTheme(prev => ({ ...prev, fontFamily }));
    bibleActions.updateUserSettings({ fontFamily });
  }, [bibleActions]);

  const setTextBrightness = useCallback((textBrightness: number) => {
    const clampedBrightness = Math.max(0.2, Math.min(1.0, textBrightness));
    setTheme(prev => ({ ...prev, textBrightness: clampedBrightness }));
    bibleActions.updateUserSettings({ textBrightness: clampedBrightness });
  }, [bibleActions]);

  const setShowRedLetters = useCallback((showRedLetters: boolean) => {
    setTheme(prev => ({ ...prev, showRedLetters }));
    bibleActions.updateUserSettings({ showRedLetters });
  }, [bibleActions]);

  const setRedLetterBrightness = useCallback((redLetterBrightness: number) => {
    const clampedBrightness = Math.max(0.2, Math.min(1.0, redLetterBrightness));
    setTheme(prev => ({ ...prev, redLetterBrightness: clampedBrightness }));
    bibleActions.updateUserSettings({ redLetterBrightness: clampedBrightness });
  }, [bibleActions]);

  const setRgbWaveEnabled = useCallback((rgbWaveEnabled: boolean) => {
    setTheme(prev => ({ ...prev, rgbWaveEnabled }));
    bibleActions.updateUserSettings({ rgbWaveEnabled });
  }, [bibleActions]);

  const setRgbWaveSpeed = useCallback((rgbWaveSpeed: number) => {
    const clampedSpeed = Math.max(0.5, Math.min(5.0, rgbWaveSpeed));
    setTheme(prev => ({ ...prev, rgbWaveSpeed: clampedSpeed }));
    bibleActions.updateUserSettings({ rgbWaveSpeed: clampedSpeed });
  }, [bibleActions]);

  const resetToDefaults = useCallback(() => {
    const defaultSettings: Partial<UserSettings> = {
      theme: 'system',
      fontSize: 16,
      fontFamily: 'Georgia, "Times New Roman", Times, serif',
      textBrightness: 1.0,
      showRedLetters: true,
      redLetterBrightness: 0.8,
      rgbWaveEnabled: false,
      rgbWaveSpeed: 1,
    };

    bibleActions.updateUserSettings(defaultSettings);
  }, [bibleActions]);

  const contextValue: ThemeContextType = {
    theme,
    actions: {
      setThemeMode,
      setFontSize,
      setFontFamily,
      setTextBrightness,
      setShowRedLetters,
      setRedLetterBrightness,
      setRgbWaveEnabled,
      setRgbWaveSpeed,
      resetToDefaults,
    },
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;