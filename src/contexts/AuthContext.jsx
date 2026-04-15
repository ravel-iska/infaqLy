import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '@/services/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  admin: null,
  token: null,
  adminToken: null,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload.user, token: action.payload.token, isLoading: false };
    case 'SET_ADMIN':
      return { ...state, admin: action.payload.admin, adminToken: action.payload.token, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'LOGOUT_USER':
      return { ...state, user: null, token: null };
    case 'LOGOUT_ADMIN':
      return { ...state, admin: null, adminToken: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: restore session from localStorage, then VALIDATE against backend
  useEffect(() => {
    async function restoreSession() {
      // --- User session ---
      const token = localStorage.getItem('infaqly_token');
      const userStr = localStorage.getItem('infaqly_user');
      if (token && userStr) {
        try {
          const data = await api.get('/auth/session', { _token: token });
          dispatch({ type: 'SET_USER', payload: { user: data.user, token } });
          localStorage.setItem('infaqly_user', JSON.stringify(data.user));
        } catch {
          // Token invalid — clear
          localStorage.removeItem('infaqly_token');
          localStorage.removeItem('infaqly_user');
        }
      }

      // --- Admin session ---
      const adminToken = localStorage.getItem('infaqly_admin_token');
      const adminStr = localStorage.getItem('infaqly_admin');
      if (adminToken && adminStr) {
        try {
          // Use explicit admin token (not auto-detected)
          const data = await api.get('/auth/session', { _token: adminToken });
          if (data.user?.role === 'admin') {
            dispatch({ type: 'SET_ADMIN', payload: { admin: data.user, token: adminToken } });
            localStorage.setItem('infaqly_admin', JSON.stringify(data.user));
          } else {
            // Token is valid but user is not admin — clear
            localStorage.removeItem('infaqly_admin_token');
            localStorage.removeItem('infaqly_admin');
          }
        } catch {
          localStorage.removeItem('infaqly_admin_token');
          localStorage.removeItem('infaqly_admin');
        }
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    }
    restoreSession();
  }, []);

  const loginUser = (user, token) => {
    localStorage.setItem('infaqly_token', token);
    localStorage.setItem('infaqly_user', JSON.stringify(user));
    dispatch({ type: 'SET_USER', payload: { user, token } });
  };

  const loginAdmin = (admin, token) => {
    localStorage.setItem('infaqly_admin_token', token);
    localStorage.setItem('infaqly_admin', JSON.stringify(admin));
    dispatch({ type: 'SET_ADMIN', payload: { admin, token } });
  };

  const logoutUser = async () => {
    try {
      const userToken = localStorage.getItem('infaqly_token');
      await api.post('/auth/logout', {}, { _token: userToken });
    } catch {}
    localStorage.removeItem('infaqly_token');
    localStorage.removeItem('infaqly_user');
    dispatch({ type: 'LOGOUT_USER' });
  };

  const logoutAdmin = async () => {
    try {
      const adminToken = localStorage.getItem('infaqly_admin_token');
      await api.post('/auth/logout', {}, { _token: adminToken });
    } catch {}
    localStorage.removeItem('infaqly_admin_token');
    // NOTE: Keep 'infaqly_admin' so PIN quick re-login knows the username
    dispatch({ type: 'LOGOUT_ADMIN' });
  };

  const updateUser = (updatedFields) => {
    const newUser = { ...state.user, ...updatedFields };
    localStorage.setItem('infaqly_user', JSON.stringify(newUser));
    dispatch({ type: 'UPDATE_USER', payload: updatedFields });
  };

  const value = {
    ...state,
    isAuthenticated: !!state.token,
    isAdminAuthenticated: !!state.adminToken,
    loginUser,
    loginAdmin,
    logoutUser,
    logoutAdmin,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}

export default AuthContext;
