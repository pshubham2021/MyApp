import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'theme';

export function useTheme() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) === 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', darkMode ? '#171a18' : '#f8f7f3');
  }, [darkMode]);

  useEffect(() => {
    function syncTheme(event) {
      if (event.key === THEME_STORAGE_KEY) {
        setDarkMode(event.newValue === 'dark');
      }
    }

    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  return {
    darkMode,
    toggleTheme: () => setDarkMode((current) => !current),
  };
}
