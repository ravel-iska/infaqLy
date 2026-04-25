import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

const safeGetItem = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    return null;
  }
  return null;
};

const safeSetItem = (key, value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    // ignore
  }
};

export function ThemeProvider({ children }) {
  const [isUserDark, setIsUserDark] = useState(() => {
    const saved = safeGetItem('infaqly_user_theme');
    if (saved) return saved === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return false;
  });

  const [isAdminDark, setIsAdminDark] = useState(() => {
    const saved = safeGetItem('infaqly_admin_theme');
    if (saved) return saved === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return false;
  });

  useEffect(() => {
    safeSetItem('infaqly_user_theme', isUserDark ? 'dark' : 'light');
  }, [isUserDark]);

  useEffect(() => {
    safeSetItem('infaqly_admin_theme', isAdminDark ? 'dark' : 'light');
  }, [isAdminDark]);

  const toggleUserTheme = () => setIsUserDark(prev => !prev);
  const toggleAdminTheme = () => setIsAdminDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{
      isUserDark, toggleUserTheme,
      isAdminDark, toggleAdminTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
