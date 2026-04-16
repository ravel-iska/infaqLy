import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center user-bg">
      <div className="text-center">
        <span className="text-4xl animate-pulse">🕌</span>
        <p className="mt-2 text-sm text-user-text-muted">Memuat...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* ── User Public Routes ── */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/explore/:campaignId" element={<RequireAuth><CampaignDetailPage /></RequireAuth>} />
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
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: '#1E293B',
              color: '#F1F5F9',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
