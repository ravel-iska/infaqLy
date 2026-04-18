/**
 * Midtrans Payment Service
 * 
 * ALL payment operations go through the backend Express.js server.
 * The backend reads Midtrans keys from the database (admin settings).
 * 
 * Flow:
 * 1. Frontend calls /api/payment/create-token → Backend creates Snap Token
 * 2. Frontend receives token → opens Snap popup
 * 3. User pays → Midtrans sends webhook to backend
 * 4. Backend updates transaction status in DB
 * 
 * Midtrans keys are NEVER stored in localStorage/cookies.
 * They are permanently stored in the PostgreSQL database via admin settings.
 */

import api from './api.js';

/**
 * Create a Snap Token via the backend API.
 * The backend reads Midtrans Server Key from database settings.
 */
export async function createTransaction({ orderId, amount, donorName, donorEmail, donorPhone, programName, campaignId, isAnonymous }) {
  // Use the backend endpoint which reads keys from DB
  const data = await api.post('/payment/create-token', {
    campaignId,
    amount,
    isAnonymous,
  });

  return { success: true, token: data.token, redirectUrl: data.redirectUrl, orderId: data.orderId };
}

/**
 * Load Midtrans Snap.js script dynamically.
 * Fetches client key from DB via backend API (not localStorage).
 */
let snapLoaded = false;
let snapLoadPromise = null;
let currentEnv = null;
let currentClientKey = null;

export async function loadSnapScript(forceReload = false) {
  if (snapLoadPromise) return snapLoadPromise;

  snapLoadPromise = (async () => {
    try {
      // Get client key and env from backend (reads from DB)
      const config = await api.get('/payment/client-config');
      
      if (!config.clientKey) {
        console.warn('[Midtrans] Client Key belum dikonfigurasi');
        snapLoadPromise = null;
        return;
      }

      // Check if we need to reload
      if (!forceReload && snapLoaded && window.snap && currentEnv === config.env && currentClientKey === config.clientKey) {
         snapLoadPromise = null;
         return;
      }

      console.log(`[Midtrans] Loading Snap Script for: ${config.env}`);
      currentEnv = config.env;
      currentClientKey = config.clientKey;

      const scriptUrl = config.env === 'production'
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';

      // Remove existing script and window.snap object
      const existing = document.querySelector('script[data-snap]');
      if (existing) existing.remove();
      if (window.snap) delete window.snap;
      snapLoaded = false;

      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.setAttribute('data-client-key', config.clientKey);
        script.setAttribute('data-snap', 'true');
        script.onload = () => { 
          snapLoaded = true; 
          snapLoadPromise = null;
          resolve(); 
        };
        script.onerror = () => {
          snapLoadPromise = null;
          reject(new Error('Gagal memuat Midtrans Snap'));
        };
        document.head.appendChild(script);
      });
    } catch (err) {
      console.warn('[Midtrans] Error loading Snap:', err);
      snapLoadPromise = null;
    }
  })();

  return snapLoadPromise;
}

/**
 * Buka Midtrans Snap Popup
 */
export function openSnapPopup(snapToken, callbacks = {}) {
  return new Promise((resolve, reject) => {
    if (!window.snap) {
      reject(new Error('Midtrans Snap belum dimuat. Refresh halaman dan pastikan Client Key sudah diisi di Admin → Pengaturan.'));
      return;
    }

    window.snap.pay(snapToken, {
      onSuccess: (result) => {
        // Force close Midtrans' generic "Payment Successful" screen
        try {
          if (typeof window.snap.hide === 'function') {
            window.snap.hide();
          }
          const iframeFrame = document.getElementById('snap-midtrans');
          if (iframeFrame) iframeFrame.remove();
          
          // Fallback if Midtrans changed classnames
          document.body.style.overflow = '';
          const snapOverlay = document.querySelector('.snap-overlay');
          if (snapOverlay) snapOverlay.remove();
        } catch (e) {}

        callbacks.onSuccess?.(result);
        resolve({ status: 'success', result });
      },
      onPending: (result) => {
        callbacks.onPending?.(result);
        resolve({ status: 'pending', result });
      },
      onError: (result) => {
        callbacks.onError?.(result);
        reject(new Error(result.status_message || 'Pembayaran gagal'));
      },
      onClose: () => {
        callbacks.onClose?.();
        resolve({ status: 'closed' });
      },
    });
  });
}

/**
 * Generate Order ID unik
 */
export function generateOrderId() {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INF-${date}-${rand}`;
}
