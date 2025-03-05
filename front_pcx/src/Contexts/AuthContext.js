/**
 * AuthContext.js
 * Provides authentication state and methods throughout the application
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { STORAGE_KEYS, USER_ROLES, DEBOUNCE_DELAYS } from './config';
import { safeLocalStorage, debounce } from '../utils/contextUtils';

// Create context
const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
};

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  userId: null,
  userType: null,
  customerId: null,
  vendorId: null,
  isAdmin: false,
  token: null,
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        userId: action.payload.uid,
        token: action.payload.token,
        userType: action.payload.user_type === USER_ROLES.VENDOR 
          ? USER_ROLES.VENDOR 
          : action.payload.user_type === USER_ROLES.CUSTOMER 
            ? USER_ROLES.CUSTOMER 
            : action.payload.user_type === USER_ROLES.ADMIN
              ? USER_ROLES.ADMIN
              : null,
        customerId: action.payload.customer_id || null,
        vendorId: action.payload.vendor_id || null,
        isAdmin: action.payload.user_type === USER_ROLES.ADMIN || false,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        ...action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return initialState;
    default:
      return state;
  }
};

/**
 * Auth Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  // Check if user is already logged in from localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const userType = localStorage.getItem('userType');
    const customerId = localStorage.getItem('customer_id');
    const vendorId = localStorage.getItem('vendor_id');
    
    if (token) {
      dispatch({
        type: 'LOGIN',
        payload: {
          token,
          user,
          userType,
          customerId,
          vendorId
        }
      });
    }
  }, []);

  // Create memoized storage update function
  const updateStorage = useCallback(
    debounce((state) => {
      safeLocalStorage.set(STORAGE_KEYS.AUTH_STATE, state);
    }, DEBOUNCE_DELAYS.STORAGE_UPDATE),
    []
  );

  // Update storage when auth state changes
  useEffect(() => {
    updateStorage(authState);
  }, [authState, updateStorage]);

  // Handle beforeunload event to ensure state is saved
  useEffect(() => {
    const beforeUnloadHandler = () => {
      // Immediately save state without debounce when page is about to unload
      safeLocalStorage.set(STORAGE_KEYS.AUTH_STATE, authState);
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [authState]);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.status === 200 && response.data.bool === true) {
        const { access, refresh, ...userData } = response.data;
        
        // Store tokens securely
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
        
        // Check for admin role
        if (userData.is_staff || userData.is_superuser) {
          userData.user_type = USER_ROLES.ADMIN;
        }
        
        // Update auth state
        dispatch({ type: AUTH_ACTIONS.LOGIN, payload: userData });
        return { success: true };
      }
      return { success: false, message: response.data.msg || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return { 
          success: false, 
          message: error.response.data?.msg || 
                  error.response.data?.error || 
                  `Error ${error.response.status}: Login failed` 
        };
      } else if (error.request) {
        // The request was made but no response was received
        return { 
          success: false, 
          message: 'No response from server. Please check your connection.' 
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        return { 
          success: false, 
          message: error.message || 'An error occurred during login' 
        };
      }
    }
  }, []);

  // Logout function
  const logout = () => {
    // Clear all auth-related items from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('customer_id');
    localStorage.removeItem('vendor_id');
    
    // Dispatch logout action
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    
    // Instead of navigating directly, we'll use window.location for a full page refresh
    // This is a simpler approach that doesn't require useNavigate
    window.location.href = '/login';
  };

  // Check if user has a specific role
  const hasRole = useCallback((role) => {
    if (role === USER_ROLES.ADMIN) {
      return authState.isAuthenticated && authState.isAdmin;
    }
    return authState.isAuthenticated && authState.userType === role;
  }, [authState.isAuthenticated, authState.userType, authState.isAdmin]);

  // Context value
  const value = {
    authState,
    dispatch,
    login,
    logout,
    hasRole,
    isAuthenticated: authState.isAuthenticated,
    userType: authState.userType,
    userId: authState.userId,
    isAdmin: authState.isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};