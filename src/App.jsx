import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
// Layouts (keep eager — always needed)
import UserLayout from '@/layouts/UserLayout';
import AdminLayout from '@/layouts/AdminLayout';
import MinimalLayout from '@/layouts/MinimalLayout';

// ═══ Error Boundary for Lazy Load Chunks ═══
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading failed:', error, errorInfo);
    // If chunk fetch error, reload page to get fresh assets
    if (error.name === 'ChunkLoadError' || error.message.includes('fetch dynamically imported module') || error.message.includes('Importing a module script failed')) {
      window.location.reload();
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan Jaringan</h2>
          <p className="text-gray-500 mb-4">Mohon segarkan halaman untuk memuat versi terbaru aplikasi.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Segarkan Halaman</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ═══ Lazy-loaded Pages (code-split per route) ═══
// User Pages
const HomePage = lazy(() => import('@/pages/user/HomePage'));
const ExplorePage = lazy(() => import('@/pages/user/ExplorePage'));
const CampaignDetailPage = lazy(() => import('@/pages/user/CampaignDetailPage'));
const LoginPage = lazy(() => import('@/pages/user/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/user/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/user/ForgotPasswordPage'));
const ProfilePage = lazy(() => import('@/pages/user/ProfilePage'));
const HowToDonatePage = lazy(() => import('@/pages/user/HowToDonatePage'));
const MaintenancePage = lazy(() => import('@/pages/user/MaintenancePage'));
const PaymentVerificationPage = lazy(() => import('@/pages/user/PaymentVerificationPage'));
const ReceiptPage = lazy(() => import('@/pages/user/ReceiptPage'));

// Admin Pages
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const CampaignsPage = lazy(() => import('@/pages/admin/CampaignsPage'));
const CampaignFormPage = lazy(() => import('@/pages/admin/CampaignFormPage'));
const TransactionsPage = lazy(() => import('@/pages/admin/TransactionsPage'));
const WithdrawalsPage = lazy(() => import('@/pages/admin/WithdrawalsPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));

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
    const checkMaintenance = async () => {
      try {
        const res = await fetch(`/api/settings/public?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.settings?.maintenance_mode === 'true' || data.settings?.maintenance_mode === true) {
            setIsMaintenance(true);
          } else {
            setIsMaintenance(false);
          }
        }
      } catch (e) {
        // Abaikan error
      } finally {
        setCheckingMaintenance(false);
      }
    };

    // Cek di awal render
    checkMaintenance();

    // Polling otomatis tiap 15 detik agar sinkron real-time untuk semua HP/PC
    const interval = setInterval(checkMaintenance, 15000);

    return () => clearInterval(interval);
  }, []);

  // Visitor Tracking (Anti-Spam Refresh)
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('infaqly_last_visit_date');
    
    // Jika hari ini belum tercatat kunjungannya di browser ini
    if (lastVisit !== today) {
      fetch('/api/visitors/track', { method: 'POST' })
        .then(res => {
          if (res.ok) localStorage.setItem('infaqly_last_visit_date', today);
        })
        .catch(() => {}); // Silent fail
    }
  }, []);

  if (checkingMaintenance) return <LoadingScreen />;

  // PENGECUALIAN: /admin-panel tetap bisa diakses meskipun sedang maintenance
  const isAdminRoute = location.pathname.startsWith('/admin-panel');
  if (isMaintenance && !isAdminRoute) {
    return <Suspense fallback={<LoadingScreen />}><MaintenancePage /></Suspense>;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ── User Public Routes ── */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/:campaignId" element={<CampaignDetailPage />} />
          <Route path="/cara-donasi" element={<HowToDonatePage />} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/payment-verification" element={<PaymentVerificationPage />} />
            <Route path="/receipt/:orderId" element={<ReceiptPage />} />
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
    </Suspense>
    </ErrorBoundary>
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
          <Analytics />
          <SpeedInsights />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
