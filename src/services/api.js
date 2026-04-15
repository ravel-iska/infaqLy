/**
 * API Client — connect to Express.js backend
 * Semua request via Vite proxy → http://localhost:5000
 * 
 * IMPORTANT: User & Admin tokens are STRICTLY ISOLATED.
 * User pages ONLY use infaqly_token, admin pages ONLY use infaqly_admin_token.
 * NO cross-fallback to prevent session contamination.
 */

const API_BASE = '/api';

/**
 * Get the correct token based on context.
 * NEVER falls back to the other role's token.
 */
function getTokenForContext() {
  const isAdminPage = window.location.pathname.includes('/admin-panel');
  if (isAdminPage) {
    return localStorage.getItem('infaqly_admin_token');
  }
  return localStorage.getItem('infaqly_token');
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  // Extract custom token if provided (used for explicit session validation)
  const customToken = options._token;
  delete options._token;

  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  };

  // Use custom token if provided, otherwise auto-detect based on current page
  const token = customToken || getTokenForContext();
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      const isAdmin = window.location.pathname.includes('/admin-panel');
      if (isAdmin) {
        localStorage.removeItem('infaqly_admin_token');
        // Keep 'infaqly_admin' so PIN quick re-login knows the username
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/admin-panel/login';
        }
      }
      // NOTE: Do NOT auto-remove user token on 401 from user pages,
      // because the AuthContext handles that via session restore.
    }
    throw new Error(data.error || 'Terjadi kesalahan pada server');
  }

  return data;
}

const api = {
  get: (endpoint, opts) => request(endpoint, { ...opts }),
  post: (endpoint, body, opts) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...opts }),
  put: (endpoint, body, opts) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  patch: (endpoint, body, opts) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  delete: (endpoint, opts) => request(endpoint, { method: 'DELETE', ...opts }),
  
  // For file uploads (FormData) — NO cross-token fallback
  upload: (endpoint, formData, overrides = {}) => {
    const token = getTokenForContext();
    return request(endpoint, {
      method: overrides.method || 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
  },
};

export default api;
