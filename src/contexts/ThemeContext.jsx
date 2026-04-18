import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    // Determine initial state
    const saved = localStorage.getItem('infaqly_theme');
    if (saved) return saved === 'dark';
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    // Add or remove dark class on <html>
    const htmlEl = document.documentElement;
    if (isDark) {
      htmlEl.classList.add('dark');
      htmlEl.setAttribute('data-theme', 'dark');
      localStorage.setItem('infaqly_theme', 'dark');
    } else {
      htmlEl.classList.remove('dark');
      htmlEl.setAttribute('data-theme', 'light');
      localStorage.setItem('infaqly_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
