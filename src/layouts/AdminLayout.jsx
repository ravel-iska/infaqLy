import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
import { useTheme } from '@/contexts/ThemeContext';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 768);
  const location = useLocation();
  const { isAdminDark } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isAdminDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#1d232a'; // base-200 in dark
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f2f2f2'; // base-200 in light
    }
  }, [isAdminDark]);

  return (
    <div data-theme={isAdminDark ? "dark" : "light"} className="bg-base-200 text-base-content min-h-screen flex w-full overflow-hidden transition-colors duration-300">
      {/* Overlay for mobile */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden animate-fade-in backdrop-blur-sm"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'md:ml-[72px] ml-0' : 'md:ml-[240px] ml-0'}`}>
        <Topbar onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden overflow-y-auto scrollbar-admin w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
