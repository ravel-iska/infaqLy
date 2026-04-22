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
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  release: 'infaqly@1.0.0',
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,

  // ═══ Auto-forward errors to WhatsApp via backend ═══
  beforeSend(event) {
    // Fire-and-forget: send error summary to our backend → WA
    try {
      const errorData = {
        data: {
          event: {
            title: event.exception?.values?.[0]?.value || event.message || 'Unknown Error',
            level: event.level || 'error',
            environment: event.environment || 'production',
            project: 'infaqly',
            web_url: `https://sentry.io`, // Sentry link placeholder
            exception: event.exception,
          }
        }
      };
      fetch('/api/bugs/sentry-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(() => {}); // Silent fail — don't block error reporting
    } catch {}
    return event; // Always return event so Sentry still receives it
  },
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
