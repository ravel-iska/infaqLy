import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isUserDark, setIsUserDark] = useState(() => {
    const saved = localStorage.getItem('infaqly_user_theme');
    if (saved) return saved === 'dark';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return false;
  });

  const [isAdminDark, setIsAdminDark] = useState(() => {
    const saved = localStorage.getItem('infaqly_admin_theme');
    if (saved) return saved === 'dark';
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return true;
    return false;
  });

  useEffect(() => {
    localStorage.setItem('infaqly_user_theme', isUserDark ? 'dark' : 'light');
  }, [isUserDark]);

  useEffect(() => {
    localStorage.setItem('infaqly_admin_theme', isAdminDark ? 'dark' : 'light');
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
