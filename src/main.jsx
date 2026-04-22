import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

// ═══ Sentry — Error & Performance Monitoring ═══
Sentry.init({
  dsn: "https://5840600aa1863e1f3ecb0400ef747e2d@o4511263254904833.ingest.us.sentry.io/4511263260803072",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
  // Capture 20% of transactions for performance monitoring
  tracesSampleRate: 0.2,
  // Capture 10% of sessions for replay
  replaysSessionSampleRate: 0.1,
  // Capture 100% of error sessions for replay
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE, // 'development' or 'production'
  enabled: import.meta.env.PROD, // Only active in production builds
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<SentryFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)

function SentryFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-8 text-center">
      <span className="material-symbols-outlined text-6xl text-red-400 mb-6">error</span>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Terjadi Kesalahan</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">Sistem mengalami gangguan teknis. Tim kami telah diberitahu secara otomatis dan sedang menangani masalah ini.</p>
      <button onClick={() => window.location.reload()} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
        Muat Ulang Halaman
      </button>
    </div>
  )
}
