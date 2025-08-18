/**
 * Bible Context - Global state management for Bible reading application
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import {
  BibleState,
  BibleContextType,
  DEFAULT_USER_SETTINGS,
  GetChapterResponse,
  SearchResponse,
  UserSettings,
  Translation,
  BookMetadata,
  PronunciationData,
  TTSRequest,
} from '../types';
import { apiService } from '../services/api';
import { pronunciationService } from '../services/pronunciationService';
import { useTTSAudioManager } from '../hooks/useTTSAudioManager';

// Action types
type BibleAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSLATIONS'; payload: Translation[] }
  | { type: 'SET_BOOKS'; payload: BookMetadata[] }
  | { type: 'SET_CURRENT_LOCATION'; payload: { book: string; chapter: number; verse?: number } }
  | { type: 'SET_TRANSLATION_PAIR'; payload: { left: string; right: string } }
  | { type: 'SET_LEFT_CHAPTER_DATA'; payload: GetChapterResponse | null }
  | { type: 'SET_RIGHT_CHAPTER_DATA'; payload: GetChapterResponse | null }
  | { type: 'UPDATE_USER_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'SET_PRONUNCIATIONS'; payload: Record<string, PronunciationData> }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: BibleState = {
  currentBook: 'Genesis',
  currentChapter: 1,
  currentVerse: undefined,
  leftTranslation: DEFAULT_USER_SETTINGS.leftTranslation,
  rightTranslation: DEFAULT_USER_SETTINGS.rightTranslation,
  translations: [],
  books: [],
  leftChapterData: null,
  rightChapterData: null,
  loading: false,
  error: null,
  userSettings: DEFAULT_USER_SETTINGS,
  pronunciations: {},
};

// Reducer function
function bibleReducer(state: BibleState, action: BibleAction): BibleState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_TRANSLATIONS':
      return { ...state, translations: action.payload };
    
    case 'SET_BOOKS':
      return { ...state, books: action.payload };
    
    case 'SET_CURRENT_LOCATION':
      return {
        ...state,
        currentBook: action.payload.book,
        currentChapter: action.payload.chapter,
        currentVerse: action.payload.verse,
      };
    
    case 'SET_TRANSLATION_PAIR':
      return {
        ...state,
        leftTranslation: action.payload.left,
        rightTranslation: action.payload.right,
        userSettings: {
          ...state.userSettings,
          leftTranslation: action.payload.left,
          rightTranslation: action.payload.right,
        },
      };
    
    case 'SET_LEFT_CHAPTER_DATA':
      return { ...state, leftChapterData: action.payload };
    
    case 'SET_RIGHT_CHAPTER_DATA':
      return { ...state, rightChapterData: action.payload };
    
    case 'UPDATE_USER_SETTINGS':
      return {
        ...state,
        userSettings: { ...state.userSettings, ...action.payload },
      };
    
    case 'SET_PRONUNCIATIONS':
      return { ...state, pronunciations: action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Context
const BibleContext = createContext<BibleContextType | undefined>(undefined);

// Provider component
interface BibleProviderProps {
  children: ReactNode;
}

export const BibleProvider: React.FC<BibleProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(bibleReducer, initialState);

  // Initialize data on mount
  useEffect(() => {
    const initializeApp = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Load translations, books, and pronunciations in parallel
        const [translations, books, pronunciations] = await Promise.all([
          apiService.getTranslations(),
          apiService.getBooks(),
          apiService.getPronunciations().catch(() => ({})), // Don't fail if pronunciations unavailable
        ]);

        dispatch({ type: 'SET_TRANSLATIONS', payload: translations });
        dispatch({ type: 'SET_BOOKS', payload: books });
        dispatch({ type: 'SET_PRONUNCIATIONS', payload: pronunciations });

        // Try to load user position and settings
        try {
          const [userPosition, userSettings] = await Promise.all([
            apiService.getUserPosition().catch(() => null),
            apiService.getUserSettings().catch(() => null),
          ]);

          if (userSettings) {
            dispatch({ type: 'UPDATE_USER_SETTINGS', payload: userSettings });
          }

          if (userPosition) {
            dispatch({
              type: 'SET_CURRENT_LOCATION',
              payload: {
                book: userPosition.book,
                chapter: userPosition.chapter,
                verse: userPosition.verse,
              },
            });

            if (userPosition.translation) {
              dispatch({
                type: 'SET_TRANSLATION_PAIR',
                payload: {
                  left: userPosition.translation,
                  right: state.rightTranslation,
                },
              });
            }
          }
        } catch (error) {
          console.warn('Could not load user data:', error);
        }

        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error: any) {
        console.error('Failed to initialize app:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load Bible data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeApp();
  }, []);

  // Load chapter data when location or translations change
  useEffect(() => {
    if (state.currentBook && state.currentChapter && state.leftTranslation && state.rightTranslation) {
      loadBothChapters();
    }
  }, [state.currentBook, state.currentChapter, state.leftTranslation, state.rightTranslation]);

  // Helper function to load both chapters
  const loadBothChapters = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [leftData, rightData] = await Promise.all([
        apiService.getChapter(state.leftTranslation, state.currentBook, state.currentChapter),
        apiService.getChapter(state.rightTranslation, state.currentBook, state.currentChapter),
      ]);

      dispatch({ type: 'SET_LEFT_CHAPTER_DATA', payload: leftData });
      dispatch({ type: 'SET_RIGHT_CHAPTER_DATA', payload: rightData });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error: any) {
      console.error('Failed to load chapter data:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load chapter' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.leftTranslation, state.rightTranslation, state.currentBook, state.currentChapter]);

  // Action creators
  const setCurrentLocation = useCallback(
    (book: string, chapter: number, verse?: number) => {
      dispatch({
        type: 'SET_CURRENT_LOCATION',
        payload: { book, chapter, verse },
      });

      // Save user position
      apiService
        .saveUserPosition({
          book,
          chapter,
          verse,
          translation: state.leftTranslation,
        })
        .catch((error) => console.warn('Could not save user position:', error));
    },
    [state.leftTranslation]
  );

  const setTranslations = useCallback((left: string, right: string) => {
    dispatch({
      type: 'SET_TRANSLATION_PAIR',
      payload: { left, right },
    });
  }, []);

  const loadChapter = useCallback(
    async (translation: string, book: string, chapter: number): Promise<void> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const chapterData = await apiService.getChapter(translation, book, chapter);
        
        if (translation === state.leftTranslation) {
          dispatch({ type: 'SET_LEFT_CHAPTER_DATA', payload: chapterData });
        } else if (translation === state.rightTranslation) {
          dispatch({ type: 'SET_RIGHT_CHAPTER_DATA', payload: chapterData });
        }
        
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error: any) {
        console.error('Failed to load chapter:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to load chapter' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state.leftTranslation, state.rightTranslation]
  );

  const navigateToNext = useCallback(() => {
    const navigationInfo = state.leftChapterData?.navigation?.next || state.rightChapterData?.navigation?.next;
    if (navigationInfo) {
      setCurrentLocation(navigationInfo.book, navigationInfo.chapter);
    }
  }, [state.leftChapterData, state.rightChapterData, setCurrentLocation]);

  const navigateToPrevious = useCallback(() => {
    const navigationInfo = state.leftChapterData?.navigation?.previous || state.rightChapterData?.navigation?.previous;
    if (navigationInfo) {
      setCurrentLocation(navigationInfo.book, navigationInfo.chapter);
    }
  }, [state.leftChapterData, state.rightChapterData, setCurrentLocation]);

  const updateUserSettings = useCallback((settings: Partial<UserSettings>) => {
    const updatedSettings = { ...state.userSettings, ...settings };
    dispatch({ type: 'UPDATE_USER_SETTINGS', payload: settings });

    // Save settings to backend
    apiService
      .saveUserSettings(updatedSettings)
      .catch((error) => console.warn('Could not save user settings:', error));
  }, [state.userSettings]);

  const searchBible = useCallback(
    async (query: string, translation: string): Promise<SearchResponse> => {
      return apiService.searchBible(query, translation);
    },
    []
  );

  const playTTS = useCallback(async (text: string, name?: string): Promise<void> => {
    if (!state.userSettings.ttsEnabled) {
      return;
    }

    try {
      // If name is provided, use the pronunciation service for biblical names
      if (name && pronunciationService.hasPronunciation(name)) {
        await pronunciationService.playPronunciation(name);
      } else {
        // For general text, use the basic TTS service
        const audioBlob = await apiService.playTTS(text, { name });
        
        // Create audio URL and play
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
        };
        
        await audio.play();
      }
    } catch (error) {
      console.error('Failed to play TTS:', error);
      throw error;
    }
  }, [state.userSettings.ttsEnabled]);

  // Context value
  const contextValue: BibleContextType = {
    state,
    actions: {
      setCurrentLocation,
      setTranslations,
      loadChapter,
      navigateToNext,
      navigateToPrevious,
      updateUserSettings,
      searchBible,
      playTTS,
    },
  };

  return <BibleContext.Provider value={contextValue}>{children}</BibleContext.Provider>;
};

// Custom hook to use Bible context
export const useBible = (): BibleContextType => {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error('useBible must be used within a BibleProvider');
  }
  return context;
};

export default BibleContext;