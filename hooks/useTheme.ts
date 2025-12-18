
import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('prospector_theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('prospector_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('prospector_theme', 'light');
    }
  }, [isDarkMode]);

  return { isDarkMode, setIsDarkMode };
};
