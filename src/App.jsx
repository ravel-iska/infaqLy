import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Layouts
import UserLayout from '@/layouts/UserLayout';
import AdminLayout from '@/layouts/AdminLayout';
import MinimalLayout from '@/layouts/MinimalLayout';

// User Pages
import HomePage from '@/pages/user/HomePage';
import ExplorePage from '@/pages/user/ExplorePage';
import CampaignDetailPage from '@/pages/user/CampaignDetailPage';
import LoginPage from '@/pages/user/LoginPage';
import RegisterPage from '@/pages/user/RegisterPage';
import ForgotPasswordPage from '@/pages/user/ForgotPasswordPage';
import ProfilePage from '@/pages/user/ProfilePage';
import HowToDonatePage from '@/pages/user/HowToDonatePage';
import MaintenancePage from '@/pages/user/MaintenancePage';

// Admin Pages
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import DashboardPage from '@/pages/admin/DashboardPage';
import CampaignsPage from '@/pages/admin/CampaignsPage';
import CampaignFormPage from '@/pages/admin/CampaignFormPage';
import TransactionsPage from '@/pages/admin/TransactionsPage';
import WithdrawalsPage from '@/pages/admin/WithdrawalsPage';
import SettingsPage from '@/pages/admin/SettingsPage';

// Route Guards
function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/explore" replace />;
  return children;
}

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { isAdminAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAdminAuthenticated) return <Navigate to="/admin-panel/login" replace />;
  return children;
}

function AdminGuestOnly({ children }) {
  const { isAdminAuthenticated } = useAuth();
  if (isAdminAuthenticated) return <Navigate to="/admin-panel/dashboard" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
      {/* Subtle Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/5 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Spinner Container */}
      <div className="relative flex justify-center items-center mb-8 z-10">
        {/* Outer Static Track */}
        <div className="absolute inset-0 w-16 h-16 rounded-full border-[3px] border-outline-variant/30 dark:border-slate-700" />
        
        {/* Fast Inner Ring */}
        <div className="absolute w-10 h-10 rounded-full border-[3px] border-transparent border-t-primary dark:border-t-emerald-400 animate-spin" style={{ animationDuration: '0.8s' }} />
        
        {/* Slow Outer Ring */}
        <div className="w-16 h-16 rounded-full border-[3px] border-transparent border-b-primary dark:border-b-emerald-400 animate-[spin_1.5s_linear_infinite_reverse]" />
      </div>

      {/* Brand Text */}
      <h2 className="text-xl font-extrabold text-on-surface dark:text-white tracking-tight mb-2 z-10 font-headline">
        infaq<span className="text-primary dark:text-emerald-400">Ly</span>
      </h2>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse z-10">
        Mempersiapkan data...
      </p>
    </div>
  );
}

function AppRoutes() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/public');
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.maintenance_mode === 'true' || data.settings?.maintenance_mode === true) {
            setIsMaintenance(true);
          }
        }
      } catch (e) {
        // Abaikan error agar app tetap fallback ke mode normal jika timeout/error
      } finally {
        setCheckingMaintenance(false);
      }
    })();
  }, []);

  if (checkingMaintenance) return <LoadingScreen />;

  // PENGECUALIAN: /admin-panel tetap bisa diakses meskipun sedang maintenance
  const isAdminRoute = location.pathname.startsWith('/admin-panel');
  if (isMaintenance && !isAdminRoute) {
    return <MaintenancePage />;
  }

  return (
    <Routes>
      {/* ── User Public Routes ── */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/explore/:campaignId" element={<CampaignDetailPage />} />
        <Route path="/cara-donasi" element={<HowToDonatePage />} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      </Route>

      {/* ── Auth Routes (Minimal Layout) ── */}
      <Route element={<MinimalLayout />}>
        <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
      </Route>

      {/* ── Admin Login (No Layout) ── */}
      <Route path="/admin-panel/login" element={<AdminGuestOnly><AdminLoginPage /></AdminGuestOnly>} />

      {/* ── Admin Protected Routes ── */}
      <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
        <Route path="/admin-panel/dashboard" element={<DashboardPage />} />
        <Route path="/admin-panel/campaigns" element={<CampaignsPage />} />
        <Route path="/admin-panel/campaigns/new" element={<CampaignFormPage />} />
        <Route path="/admin-panel/campaigns/:id" element={<CampaignFormPage />} />
        <Route path="/admin-panel/transactions" element={<TransactionsPage />} />
        <Route path="/admin-panel/withdrawals" element={<WithdrawalsPage />} />
        <Route path="/admin-panel/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '8px',
              },
              success: {
                iconTheme: { primary: '#10B981', secondary: '#fff' },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
