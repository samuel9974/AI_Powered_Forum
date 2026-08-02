import { createContext, useContext, useEffect, useState } from 'react';

/** localStorage key shared with the FOUC boot script. */
export const THEME_STORAGE_KEY = 'forum-theme';

const THEMES = ['light', 'dark'];

/**
 * Theme Context providing the active color mode and switch helpers.
 */
const ThemeContext = createContext(undefined);

/**
 * Reads a stored theme, falling back to light when missing or invalid.
 * @returns {'light' | 'dark'}
 */
function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (THEMES.includes(stored)) {
      return stored;
    }
  } catch {
    // localStorage can throw in private browsing / restricted contexts
  }
  return 'light';
}

/**
 * Applies the theme to <html> so CSS `[data-theme="…"]` selectors can react.
 * Also sets `color-scheme` so native controls (scrollbars, inputs) match.
 * Mirrors the FOUC boot script in `index.html`.
 * @param {'light' | 'dark'} theme
 */
function applyThemeToDocument(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

/**
 * ThemeProvider wraps the app so any component can read or change the theme.
 * Persistence + DOM attribute updates live here — consumers only call the API.
 */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => getStoredTheme());

  // Keep <html data-theme> and localStorage in sync whenever theme changes.
  useEffect(() => {
    applyThemeToDocument(theme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore write failures; in-memory theme still works for the session.
    }
  }, [theme]);

  /**
   * Sets an explicit theme (`light` or `dark`).
   * @param {'light' | 'dark'} nextTheme
   */
  const setTheme = nextTheme => {
    if (!THEMES.includes(nextTheme)) {
      return;
    }
    setThemeState(nextTheme);
  };

  /** Flips between light and dark. */
  const toggleTheme = () => {
    setThemeState(current => (current === 'dark' ? 'light' : 'dark'));
  };

  const value = {
    /** User-selected preference (`light` | `dark`). */
    theme,
    /** Theme currently applied to the document (same as `theme`). */
    resolvedTheme: theme,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Custom hook to access the theme context.
 * @throws {Error} If used outside of ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
