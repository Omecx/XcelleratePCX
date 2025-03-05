/**
 * Context Configuration
 * This file contains configuration settings for all context providers
 */

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_STATE: 'auth_state',
  CART_DATA: 'cart_data',
  WISHLIST_DATA: 'wishlist_data',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
};

// Debounce Delays (in milliseconds)
export const DEBOUNCE_DELAYS = {
  STORAGE_UPDATE: 300,
};

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
};

// API Request Timeout (in milliseconds)
export const API_TIMEOUT = 30000;

// Cache Expiration (in milliseconds)
export const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes 